import "reflect-metadata";

import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { apiConfig } from "./config/api-config";
import { ApiExceptionFilter } from "./common/api-exception.filter";
import { PlatformLogger } from "./observability/platform-logger.service";
import { getRuntimeConfigDiagnostics } from "@platform/config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    rawBody: true
  });

  app.setGlobalPrefix(apiConfig.basePath.replace(/^\//, ""));
  app.enableCors({
    origin: apiConfig.allowedOrigins,
    credentials: true
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: true
    })
  );
  app.useGlobalFilters(app.get(ApiExceptionFilter));

  const logger = app.get(PlatformLogger);
  const diagnostics = getRuntimeConfigDiagnostics();

  logger.info("runtime.startup", {
    status: diagnostics.core.status === "ok" ? 200 : 503,
    brand: apiConfig.brand.key,
    coreSummary: diagnostics.core.summary,
    billingSummary: diagnostics.billing.summary,
    aiSummary: diagnostics.ai.summary
  });

  if (diagnostics.billing.status !== "ok") {
    logger.warn("runtime.optional_dependency_degraded", {
      status: 503,
      brand: apiConfig.brand.key,
      errorCode: "BILLING_CONFIG_DEGRADED",
      details: diagnostics.billing.details
    });
  }

  if (diagnostics.ai.status !== "ok") {
    logger.warn("runtime.optional_dependency_degraded", {
      status: 503,
      brand: apiConfig.brand.key,
      errorCode: "AI_CONFIG_DEGRADED",
      details: diagnostics.ai.details
    });
  }

  await app.listen(apiConfig.port);
}

void bootstrap();
