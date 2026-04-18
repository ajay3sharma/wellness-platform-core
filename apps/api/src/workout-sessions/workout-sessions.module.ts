import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { WorkoutSessionsController } from "./workout-sessions.controller";
import { WorkoutSessionsService } from "./workout-sessions.service";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [WorkoutSessionsController],
  providers: [WorkoutSessionsService]
})
export class WorkoutSessionsModule {}
