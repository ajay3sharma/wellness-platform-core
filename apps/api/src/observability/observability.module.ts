import { Global, Module } from "@nestjs/common";
import { PlatformLogger } from "./platform-logger.service";
import { RequestContextService } from "./request-context.service";
import { RequestIdMiddleware } from "./request-id.middleware";

@Global()
@Module({
  providers: [RequestContextService, PlatformLogger, RequestIdMiddleware],
  exports: [RequestContextService, PlatformLogger, RequestIdMiddleware]
})
export class ObservabilityModule {}
