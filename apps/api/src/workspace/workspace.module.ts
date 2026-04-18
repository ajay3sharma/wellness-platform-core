import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { AdminUsersController } from "./admin-users.controller";
import { CoachUsersController } from "./coach-users.controller";
import { WorkspaceService } from "./workspace.service";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AdminUsersController, CoachUsersController],
  providers: [WorkspaceService]
})
export class WorkspaceModule {}
