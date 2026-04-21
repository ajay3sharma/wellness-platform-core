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
import { PlatformLogger } from "../observability/platform-logger.service";
import { RequestContextService } from "../observability/request-context.service";
import { AuthService } from "./auth.service";
import type { AccessTokenPayload } from "./auth.types";
import { extractBearerToken } from "./auth.utils";

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
    @Inject(API_CONFIG) private readonly config: ApiConfig,
    private readonly requestContext: RequestContextService,
    private readonly logger: PlatformLogger
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: CurrentUser }>();
    const route = request.originalUrl?.split("?")[0] ?? request.path ?? request.url;
    const token = extractBearerToken(request?.headers?.authorization);

    if (!token) {
      this.logger.warn("access.protected_route_denied", {
        status: 401,
        errorCode: "MISSING_BEARER_TOKEN",
        route
      });
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
      this.requestContext.update({
        route,
        userId: user.id,
        role: user.role,
        brand: user.activeBrand
      });
      return true;
    } catch {
      this.logger.warn("access.protected_route_denied", {
        status: 401,
        errorCode: "INVALID_ACCESS_TOKEN",
        route
      });
      throw new UnauthorizedException("Invalid or expired access token.");
    }
  }
}
