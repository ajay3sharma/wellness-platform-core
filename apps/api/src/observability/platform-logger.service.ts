import { Injectable } from "@nestjs/common";
import { RequestContextService } from "./request-context.service";

type LogLevel = "info" | "warn" | "error";

type LogFields = {
  status?: number;
  errorCode?: string | null;
  requestId?: string;
  method?: string;
  route?: string;
  userId?: string | null;
  role?: string | null;
  brand?: string | null;
  [key: string]: unknown;
};

@Injectable()
export class PlatformLogger {
  constructor(private readonly requestContext: RequestContextService) {}

  info(event: string, fields: LogFields = {}) {
    this.write("info", event, fields);
  }

  warn(event: string, fields: LogFields = {}) {
    this.write("warn", event, fields);
  }

  error(event: string, fields: LogFields = {}) {
    this.write("error", event, fields);
  }

  private write(level: LogLevel, event: string, fields: LogFields) {
    const context = this.requestContext.get();
    const payload = Object.fromEntries(
      Object.entries({
        timestamp: new Date().toISOString(),
        level,
        event,
        requestId: fields.requestId ?? context?.requestId ?? null,
        method: fields.method ?? context?.method ?? null,
        route: fields.route ?? context?.route ?? null,
        userId: fields.userId ?? context?.userId ?? null,
        role: fields.role ?? context?.role ?? null,
        brand: fields.brand ?? context?.brand ?? null,
        status: fields.status ?? null,
        errorCode: fields.errorCode ?? null,
        ...fields
      }).filter(([, value]) => value !== undefined)
    );
    const message = JSON.stringify(payload);

    switch (level) {
      case "warn":
        console.warn(message);
        return;
      case "error":
        console.error(message);
        return;
      default:
        console.log(message);
    }
  }
}
