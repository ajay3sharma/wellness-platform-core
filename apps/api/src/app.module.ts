import { Module } from "@nestjs/common";
import { ApiConfigModule } from "./config/api-config.module";
import { AuthModule } from "./auth/auth.module";
import { HealthModule } from "./health/health.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [ApiConfigModule, PrismaModule, HealthModule, AuthModule]
})
export class AppModule {}
