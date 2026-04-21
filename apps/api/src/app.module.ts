import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
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
import { ObservabilityModule } from "./observability/observability.module";
import { RequestIdMiddleware } from "./observability/request-id.middleware";
import { ApiExceptionFilter } from "./common/api-exception.filter";

@Module({
  imports: [
    ObservabilityModule,
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
  ],
  providers: [ApiExceptionFilter]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes("*");
  }
}
