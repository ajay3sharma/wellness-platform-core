import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import type { AssignCoachRequest, CurrentUser, UserDirectoryRecord } from "@platform/types";
import { CurrentUserDecorator } from "../common/current-user.decorator";
import { Roles } from "../common/roles.decorator";
import { RolesGuard } from "../common/roles.guard";
import { AccessTokenGuard } from "../auth/auth.guard";
import { AssignCoachDto } from "./dto/assign-coach.dto";
import { WorkspaceService } from "./workspace.service";

@Controller("admin/users")
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles("admin")
export class AdminUsersController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Get()
  list(): Promise<UserDirectoryRecord[]> {
    return this.workspaceService.listAdminUsers();
  }

  @Post(":userId/approve-role")
  approveRole(@Param("userId") userId: string): Promise<UserDirectoryRecord> {
    return this.workspaceService.approveRole(userId);
  }

  @Post(":userId/assign-coach")
  assignCoach(
    @CurrentUserDecorator() admin: CurrentUser,
    @Param("userId") userId: string,
    @Body() body: AssignCoachDto
  ): Promise<UserDirectoryRecord> {
    return this.workspaceService.assignCoach(userId, body as AssignCoachRequest, admin);
  }
}
