import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { AdminWorkoutsController } from "./admin-workouts.controller";
import { WorkoutsController } from "./workouts.controller";
import { WorkoutsService } from "./workouts.service";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [WorkoutsController, AdminWorkoutsController],
  providers: [WorkoutsService],
  exports: [WorkoutsService]
})
export class WorkoutsModule {}
