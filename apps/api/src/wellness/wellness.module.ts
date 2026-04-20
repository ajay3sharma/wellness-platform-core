import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { AdminWellnessController } from "./admin-wellness.controller";
import { WellnessController } from "./wellness.controller";
import { WellnessService } from "./wellness.service";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [WellnessController, AdminWellnessController],
  providers: [WellnessService],
  exports: [WellnessService]
})
export class WellnessModule {}
