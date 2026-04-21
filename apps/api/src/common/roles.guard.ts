import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { CurrentUser, Role } from "@platform/types";
import type { Request } from "express";
import { PlatformLogger } from "../observability/platform-logger.service";
import { RequestContextService } from "../observability/request-context.service";
import { ROLES_KEY } from "./roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly requestContext: RequestContextService,
    private readonly logger: PlatformLogger
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: CurrentUser }>();
    const user = request.user;
    const route = request.originalUrl?.split("?")[0] ?? request.path ?? request.url;

    if (user) {
      this.requestContext.update({
        route,
        userId: user.id,
        role: user.role,
        brand: user.activeBrand
      });
    }

    if (!user) {
      this.logger.warn("access.protected_route_denied", {
        status: 403,
        errorCode: "ROLE_USER_MISSING",
        route
      });
      throw new ForbiddenException("You do not have permission to access this resource.");
    }

    if (!requiredRoles.includes(user.role)) {
      this.logger.warn("access.protected_route_denied", {
        status: 403,
        errorCode: "ROLE_FORBIDDEN",
        route,
        userId: user.id,
        role: user.role,
        brand: user.activeBrand,
        requiredRoles
      });
      throw new ForbiddenException("You do not have permission to access this resource.");
    }

    return true;
  }
}
