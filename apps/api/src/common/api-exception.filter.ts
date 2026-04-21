import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable
} from "@nestjs/common";
import type { Request, Response } from "express";
import type { ApiError } from "@platform/types";
import { PlatformLogger } from "../observability/platform-logger.service";
import { RequestContextService } from "../observability/request-context.service";

@Injectable()
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly requestContext: RequestContextService,
    private readonly logger: PlatformLogger
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request & { requestId?: string; user?: { id: string; role: string; activeBrand: string } }>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload = exception instanceof HttpException ? exception.getResponse() : undefined;
    const payloadObject =
      payload && typeof payload === "object" && !Array.isArray(payload)
        ? (payload as Record<string, unknown>)
        : undefined;
    const message =
      typeof payload === "string"
        ? payload
        : payloadObject?.message?.toString() ?? "Unexpected API error.";
    const requestId =
      request?.requestId ??
      this.requestContext.getRequestId() ??
      request?.headers?.["x-request-id"]?.toString();

    const error: ApiError = {
      code:
        (payloadObject?.code as string | undefined) ??
        (exception instanceof HttpException ? `HTTP_${status}` : "INTERNAL_SERVER_ERROR"),
      message,
      status,
      traceId: requestId,
      details: payloadObject?.details as Record<string, unknown> | undefined
    };

    if (requestId) {
      response.setHeader("x-request-id", requestId);
    }

    if (!(exception instanceof HttpException) || status >= 500) {
      this.logger.error("request.unhandled_exception", {
        status,
        errorCode: error.code,
        userId: request?.user?.id ?? null,
        role: request?.user?.role ?? null,
        brand: request?.user?.activeBrand ?? null,
        details: error.details ?? null
      });
    }

    response.status(status).json(error);
  }
}
