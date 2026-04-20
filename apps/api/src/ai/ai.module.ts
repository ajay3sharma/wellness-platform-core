import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { WellnessModule } from "../wellness/wellness.module";
import { WorkoutsModule } from "../workouts/workouts.module";
import { AdminAiController } from "./admin-ai.controller";
import { AiController } from "./ai.controller";
import { AiQuotaService } from "./ai-quota.service";
import { AiService } from "./ai.service";
import { GeminiService } from "./gemini.service";

@Module({
  imports: [PrismaModule, AuthModule, WorkoutsModule, WellnessModule],
  controllers: [AiController, AdminAiController],
  providers: [AiService, AiQuotaService, GeminiService]
})
export class AiModule {}
