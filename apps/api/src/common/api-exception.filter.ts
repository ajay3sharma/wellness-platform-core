import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus
} from "@nestjs/common";
import type { Request, Response } from "express";
import type { ApiError } from "@platform/types";

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload = exception instanceof HttpException ? exception.getResponse() : undefined;
    const message =
      typeof payload === "string"
        ? payload
        : (payload as Record<string, unknown> | undefined)?.message?.toString() ??
          "Unexpected API error.";

    const error: ApiError = {
      code: exception instanceof HttpException ? `HTTP_${status}` : "INTERNAL_SERVER_ERROR",
      message,
      status,
      traceId: request?.headers?.["x-request-id"]?.toString(),
      details:
        payload && typeof payload === "object" && !Array.isArray(payload)
          ? (payload as Record<string, unknown>)
          : undefined
    };

    response.status(status).json(error);
  }
}
