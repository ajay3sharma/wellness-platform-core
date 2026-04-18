import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import type {
  AssignWorkoutRequest,
  CoachUserHistory,
  CoachUserRecord,
  CurrentUser,
  SaveCoachNoteRequest
} from "@platform/types";
import { CurrentUserDecorator } from "../common/current-user.decorator";
import { Roles } from "../common/roles.decorator";
import { RolesGuard } from "../common/roles.guard";
import { AccessTokenGuard } from "../auth/auth.guard";
import { AssignWorkoutDto } from "./dto/assign-workout.dto";
import { SaveCoachNoteDto } from "./dto/save-coach-note.dto";
import { WorkspaceService } from "./workspace.service";

@Controller("coach/users")
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles("coach")
export class CoachUsersController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Get()
  list(@CurrentUserDecorator() coach: CurrentUser): Promise<CoachUserRecord[]> {
    return this.workspaceService.listCoachUsers(coach);
  }

  @Post(":userId/assign-workout")
  async assignWorkout(
    @CurrentUserDecorator() coach: CurrentUser,
    @Param("userId") userId: string,
    @Body() body: AssignWorkoutDto
  ): Promise<{ success: true }> {
    await this.workspaceService.assignWorkout(coach, userId, body as AssignWorkoutRequest);
    return { success: true };
  }

  @Get(":userId/workout-history")
  history(
    @CurrentUserDecorator() coach: CurrentUser,
    @Param("userId") userId: string
  ): Promise<CoachUserHistory> {
    return this.workspaceService.getCoachUserHistory(coach, userId);
  }

  @Post(":userId/notes")
  saveNote(
    @CurrentUserDecorator() coach: CurrentUser,
    @Param("userId") userId: string,
    @Body() body: SaveCoachNoteDto
  ): Promise<CoachUserHistory> {
    return this.workspaceService.saveCoachNote(coach, userId, body as SaveCoachNoteRequest);
  }
}
