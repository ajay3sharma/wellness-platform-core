import { Injectable, type NestMiddleware } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { RequestContextService } from "./request-context.service";

function resolveHeaderValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  constructor(private readonly requestContext: RequestContextService) {}

  use(request: Request & { requestId?: string }, response: Response, next: NextFunction) {
    const requestId = resolveHeaderValue(request.headers["x-request-id"]) ?? randomUUID();
    const route = request.originalUrl.split("?")[0] || request.path || request.url;

    request.requestId = requestId;
    response.setHeader("x-request-id", requestId);

    return this.requestContext.run(
      {
        requestId,
        method: request.method,
        route
      },
      next
    );
  }
}
