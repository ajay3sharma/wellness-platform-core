import { Module } from "@nestjs/common";
import { ApiConfigModule } from "./config/api-config.module";
import { AuthModule } from "./auth/auth.module";
import { HealthModule } from "./health/health.module";
import { PrismaModule } from "./prisma/prisma.module";
import { WorkoutsModule } from "./workouts/workouts.module";
import { WorkoutSessionsModule } from "./workout-sessions/workout-sessions.module";
import { WorkspaceModule } from "./workspace/workspace.module";
import { WellnessModule } from "./wellness/wellness.module";
import { CommerceModule } from "./commerce/commerce.module";
import { AiModule } from "./ai/ai.module";

@Module({
  imports: [
    ApiConfigModule,
    PrismaModule,
    HealthModule,
    AuthModule,
    WorkoutsModule,
    WorkoutSessionsModule,
    WorkspaceModule,
    WellnessModule,
    CommerceModule,
    AiModule
  ]
})
export class AppModule {}
