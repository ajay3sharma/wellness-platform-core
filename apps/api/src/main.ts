import "reflect-metadata";

import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { apiConfig } from "./config/api-config";
import { ApiExceptionFilter } from "./common/api-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true
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
  app.useGlobalFilters(new ApiExceptionFilter());

  await app.listen(apiConfig.port);
}

void bootstrap();
