import { Module } from "@nestjs/common";
import { ApiConfigModule } from "../config/api-config.module";
import { PrismaModule } from "../prisma/prisma.module";
import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";

@Module({
  imports: [ApiConfigModule, PrismaModule],
  controllers: [HealthController],
  providers: [HealthService]
})
export class HealthModule {}
