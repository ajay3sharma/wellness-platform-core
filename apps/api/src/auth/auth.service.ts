import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { createHash, randomUUID } from "node:crypto";
import type {
  AuthSession,
  AuthTokens,
  CurrentUser,
  LoginRequest,
  LogoutRequest,
  RefreshSessionRequest
} from "@platform/types";
import { type ApiConfig } from "../config/api-config";
import { API_CONFIG } from "../config/api-config.token";
import { PrismaService } from "../prisma/prisma.service";
import { ACCESS_TOKEN_TYPE, REFRESH_TOKEN_TYPE } from "./auth.constants";
import type { AccessTokenPayload, RefreshTokenPayload, StoredSession } from "./auth.types";

function toIso(date: Date): string {
  return date.toISOString();
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

@Injectable()
export class AuthService {
  private readonly sessions = new Map<string, StoredSession>();

  constructor(
    private readonly jwtService: JwtService,
    @Inject(API_CONFIG) private readonly config: ApiConfig,
    private readonly prisma: PrismaService
  ) {}

  async login(payload: LoginRequest): Promise<AuthSession> {
    this.assertDevCredentials(payload.email, payload.password);

    const user = this.createUserSnapshot(payload.email);
    return this.issueSession(user);
  }

  async refresh(payload: RefreshSessionRequest): Promise<AuthSession> {
    const verified = await this.verifyRefreshToken(payload.refreshToken);
    const session = this.sessions.get(verified.sid);

    if (!session || session.revokedAt || session.refreshTokenId !== verified.jti) {
      throw new UnauthorizedException("Refresh session is no longer active.");
    }

    const tokens = await this.rotateSession(session);
    return {
      user: session.user,
      tokens
    };
  }

  async logout(payload: LogoutRequest): Promise<void> {
    try {
      const verified = await this.verifyRefreshToken(payload.refreshToken);
      const session = this.sessions.get(verified.sid);
      if (session) {
        session.revokedAt = new Date().toISOString();
      }
      this.sessions.delete(verified.sid);
    } catch {
      return;
    }
  }

  toCurrentUser(payload: AccessTokenPayload): CurrentUser {
    return {
      id: payload.sub,
      email: payload.email,
      displayName: payload.displayName,
      role: payload.role,
      activeBrand: payload.activeBrand,
      coachId: payload.coachId
    };
  }

  private async issueSession(user: CurrentUser): Promise<AuthSession> {
    const sessionId = randomUUID();
    const refreshTokenId = randomUUID();
    const tokens = await this.createTokens(user, sessionId, refreshTokenId);

    this.sessions.set(sessionId, {
      sessionId,
      user,
      refreshTokenId,
      revokedAt: undefined,
      expiresAt: tokens.refreshTokenExpiresAt
    });

    return {
      user,
      tokens
    };
  }

  private async rotateSession(session: StoredSession): Promise<AuthTokens> {
    const refreshTokenId = randomUUID();
    const tokens = await this.createTokens(session.user, session.sessionId, refreshTokenId);

    session.refreshTokenId = refreshTokenId;
    session.expiresAt = tokens.refreshTokenExpiresAt;

    return tokens;
  }

  private async createTokens(
    user: CurrentUser,
    sessionId: string,
    refreshTokenId: string
  ): Promise<AuthTokens> {
    const issuedAt = new Date();
    const accessExpiresAt = addMinutes(issuedAt, this.config.auth.accessTokenTtlMinutes);
    const refreshExpiresAt = addDays(issuedAt, this.config.auth.refreshTokenTtlDays);

    const accessToken = await this.jwtService.signAsync(
      {
        typ: ACCESS_TOKEN_TYPE,
        sid: sessionId,
        sub: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        activeBrand: user.activeBrand,
        coachId: user.coachId
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
        sub: user.id
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

  private assertDevCredentials(email: string, password: string) {
    if (email !== this.config.devAuth.email || password !== this.config.devAuth.password) {
      throw new UnauthorizedException("Invalid credentials.");
    }
  }

  private createUserSnapshot(email: string): CurrentUser {
    const normalizedEmail = email.trim().toLowerCase();
    const id = createHash("sha256").update(normalizedEmail).digest("hex").slice(0, 12);
    const displayName = normalizedEmail
      .split("@")[0]
      .split(/[._-]/)
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() + part.slice(1))
      .join(" ");

    return {
      id: `usr_${id}`,
      email: normalizedEmail,
      displayName: displayName || `${this.config.brand.productName} Admin`,
      role: normalizedEmail === this.config.devAuth.email.trim().toLowerCase() ? "admin" : "user",
      activeBrand: this.config.brand.key,
      coachId: null
    };
  }
}
