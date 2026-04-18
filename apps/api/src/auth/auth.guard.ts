import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { CurrentUser } from "@platform/types";
import type { Request } from "express";
import type { ApiConfig } from "../config/api-config";
import { API_CONFIG } from "../config/api-config.token";
import { AuthService } from "./auth.service";
import type { AccessTokenPayload } from "./auth.types";
import { extractBearerToken } from "./auth.utils";

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
    @Inject(API_CONFIG) private readonly config: ApiConfig
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: CurrentUser }>();
    const token = extractBearerToken(request?.headers?.authorization);

    if (!token) {
      throw new UnauthorizedException("Missing bearer token.");
    }

    try {
      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token, {
        secret: this.config.auth.accessSecret,
        issuer: this.config.auth.issuer,
        audience: this.config.auth.audience
      });

      const user = await this.authService.getCurrentUserForSession(payload.sub, payload.sid);
      request.user = user;
      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired access token.");
    }
  }
}
