import { HttpStatus, Inject, Injectable, OnModuleInit, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Prisma, User } from "@prisma/client";
import type {
  AccountProfile,
  AuthSession,
  AuthTokens,
  CurrentUser,
  LoginRequest,
  LogoutRequest,
  RefreshSessionRequest,
  RegisterRequest,
  RegisterResult
} from "@platform/types";
import { randomUUID } from "node:crypto";
import { createApiException } from "../common/api-error.util";
import type { ApiConfig } from "../config/api-config";
import { API_CONFIG } from "../config/api-config.token";
import { PrismaService } from "../prisma/prisma.service";
import { ACCESS_TOKEN_TYPE, REFRESH_TOKEN_TYPE } from "./auth.constants";
import type { RefreshTokenPayload } from "./auth.types";
import { formatDisplayName, hashPassword, normalizeEmail, verifyPassword } from "./auth.utils";

type AuthUserRecord = Prisma.UserGetPayload<{
  include: {
    coachAssignment: true;
  };
}>;

type SessionRecord = Prisma.RefreshTokenGetPayload<{
  include: {
    user: {
      include: {
        coachAssignment: true;
      };
    };
  };
}>;

function toIso(value: Date): string {
  return value.toISOString();
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(API_CONFIG) private readonly config: ApiConfig,
    private readonly prisma: PrismaService
  ) {}

  async onModuleInit() {
    const email = normalizeEmail(this.config.bootstrapAdmin.email);

    await this.prisma.user.upsert({
      where: { email },
      update: {
        displayName: this.config.bootstrapAdmin.displayName.trim(),
        role: "admin",
        status: "active",
        requestedRole: null,
        activeBrand: this.config.brand.key,
        passwordHash: await hashPassword(this.config.bootstrapAdmin.password)
      },
      create: {
        email,
        displayName: this.config.bootstrapAdmin.displayName.trim(),
        role: "admin",
        status: "active",
        requestedRole: null,
        activeBrand: this.config.brand.key,
        passwordHash: await hashPassword(this.config.bootstrapAdmin.password)
      }
    });
  }

  async register(payload: RegisterRequest): Promise<RegisterResult> {
    const email = normalizeEmail(payload.email);
    const existing = await this.prisma.user.findUnique({
      where: { email }
    });

    if (existing) {
      throw createApiException(HttpStatus.CONFLICT, "EMAIL_IN_USE", "An account already exists for this email.");
    }

    const requestedRole = payload.role === "user" ? null : payload.role;
    const user = await this.prisma.user.create({
      data: {
        email,
        displayName: payload.displayName.trim() || formatDisplayName(email),
        role: "user",
        status: requestedRole ? "pending_approval" : "active",
        requestedRole,
        activeBrand: this.config.brand.key,
        passwordHash: await hashPassword(payload.password)
      },
      include: {
        coachAssignment: true
      }
    });

    const account = this.toAccountProfile(user);

    if (requestedRole) {
      return {
        account,
        session: null,
        message: `Your ${requestedRole} access request is pending approval.`
      };
    }

    return {
      account,
      session: await this.issueSession(user),
      message: "Your account is ready."
    };
  }

  async login(payload: LoginRequest): Promise<AuthSession> {
    const user = await this.findUserByEmail(payload.email);

    if (!user || !(await verifyPassword(payload.password, user.passwordHash))) {
      throw new UnauthorizedException("Invalid credentials.");
    }

    this.assertAccountCanSignIn(user);
    return this.issueSession(user);
  }

  async refresh(payload: RefreshSessionRequest): Promise<AuthSession> {
    const verified = await this.verifyRefreshToken(payload.refreshToken);
    const session = await this.findActiveSession(verified.sid);

    if (!session || session.tokenId !== verified.jti || session.userId !== verified.sub) {
      throw new UnauthorizedException("Refresh session is no longer active.");
    }

    this.assertAccountCanSignIn(session.user);

    const tokens = await this.rotateSession(session);
    return {
      user: this.toCurrentUser(session.user),
      tokens
    };
  }

  async logout(payload: LogoutRequest): Promise<void> {
    try {
      const verified = await this.verifyRefreshToken(payload.refreshToken);
      await this.prisma.refreshToken.updateMany({
        where: {
          sessionId: verified.sid,
          userId: verified.sub
        },
        data: {
          revokedAt: new Date()
        }
      });
    } catch {
      return;
    }
  }

  async getCurrentUserForSession(userId: string, sessionId: string): Promise<CurrentUser> {
    const session = await this.findActiveSession(sessionId);

    if (!session || session.userId !== userId) {
      throw new UnauthorizedException("Invalid or expired access token.");
    }

    this.assertAccountCanSignIn(session.user);
    return this.toCurrentUser(session.user);
  }

  private async issueSession(user: AuthUserRecord): Promise<AuthSession> {
    const sessionId = randomUUID();
    const refreshTokenId = randomUUID();
    const tokens = await this.createTokens(user, sessionId, refreshTokenId);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        sessionId,
        tokenId: refreshTokenId,
        expiresAt: new Date(tokens.refreshTokenExpiresAt)
      }
    });

    return {
      user: this.toCurrentUser(user),
      tokens
    };
  }

  private async rotateSession(session: SessionRecord): Promise<AuthTokens> {
    const refreshTokenId = randomUUID();
    const tokens = await this.createTokens(session.user, session.sessionId, refreshTokenId);

    await this.prisma.refreshToken.update({
      where: {
        sessionId: session.sessionId
      },
      data: {
        tokenId: refreshTokenId,
        revokedAt: null,
        expiresAt: new Date(tokens.refreshTokenExpiresAt)
      }
    });

    return tokens;
  }

  private async createTokens(
    user: AuthUserRecord,
    sessionId: string,
    refreshTokenId: string
  ): Promise<AuthTokens> {
    const issuedAt = new Date();
    const accessExpiresAt = addMinutes(issuedAt, this.config.auth.accessTokenTtlMinutes);
    const refreshExpiresAt = addDays(issuedAt, this.config.auth.refreshTokenTtlDays);

    const snapshot = this.toCurrentUser(user);

    const accessToken = await this.jwtService.signAsync(
      {
        typ: ACCESS_TOKEN_TYPE,
        sid: sessionId,
        sub: snapshot.id,
        email: snapshot.email,
        displayName: snapshot.displayName,
        role: snapshot.role,
        activeBrand: snapshot.activeBrand,
        coachId: snapshot.coachId
      },
      {
        secret: this.config.auth.accessSecret,
        expiresIn: `${this.config.auth.accessTokenTtlMinutes}m`,
        issuer: this.config.auth.issuer,
        audience: this.config.auth.audience
      }
    );

    const refreshToken = await this.jwtService.signAsync(
      {
        typ: REFRESH_TOKEN_TYPE,
        sid: sessionId,
        jti: refreshTokenId,
        sub: snapshot.id
      },
      {
        secret: this.config.auth.refreshSecret,
        expiresIn: `${this.config.auth.refreshTokenTtlDays}d`,
        issuer: this.config.auth.issuer,
        audience: this.config.auth.audience
      }
    );

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt: toIso(accessExpiresAt),
      refreshTokenExpiresAt: toIso(refreshExpiresAt)
    };
  }

  private async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    return this.jwtService.verifyAsync<RefreshTokenPayload>(token, {
      secret: this.config.auth.refreshSecret,
      issuer: this.config.auth.issuer,
      audience: this.config.auth.audience
    });
  }

  private async findUserByEmail(email: string): Promise<AuthUserRecord | null> {
    return this.prisma.user.findUnique({
      where: {
        email: normalizeEmail(email)
      },
      include: {
        coachAssignment: true
      }
    });
  }

  private async findActiveSession(sessionId: string): Promise<SessionRecord | null> {
    const session = await this.prisma.refreshToken.findUnique({
      where: { sessionId },
      include: {
        user: {
          include: {
            coachAssignment: true
          }
        }
      }
    });

    if (!session) {
      return null;
    }

    if (session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
      return null;
    }

    return session;
  }

  private assertAccountCanSignIn(user: Pick<User, "status" | "requestedRole">) {
    if (user.status === "pending_approval") {
      throw createApiException(
        HttpStatus.FORBIDDEN,
        "ACCOUNT_PENDING_APPROVAL",
        "Your access request is still waiting for approval.",
        {
          requestedRole: user.requestedRole ?? "user"
        }
      );
    }
  }

  private toCurrentUser(user: AuthUserRecord): CurrentUser {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      activeBrand: user.activeBrand as CurrentUser["activeBrand"],
      coachId: user.coachAssignment?.coachId ?? null
    };
  }

  private toAccountProfile(user: AuthUserRecord): AccountProfile {
    return {
      ...this.toCurrentUser(user),
      status: user.status,
      requestedRole: user.requestedRole
    };
  }
}
