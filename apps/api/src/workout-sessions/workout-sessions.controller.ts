import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import type {
  CompleteWorkoutSessionRequest,
  CurrentUser,
  StartWorkoutSessionRequest,
  UpdateWorkoutSessionRequest,
  WorkoutSessionRecord,
  WorkoutSessionSummary
} from "@platform/types";
import { CurrentUserDecorator } from "../common/current-user.decorator";
import { Roles } from "../common/roles.decorator";
import { RolesGuard } from "../common/roles.guard";
import { AccessTokenGuard } from "../auth/auth.guard";
import { StartWorkoutSessionDto } from "./dto/start-workout-session.dto";
import { UpdateWorkoutSessionDto } from "./dto/update-workout-session.dto";
import { WorkoutSessionsService } from "./workout-sessions.service";

@Controller("workout-sessions")
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles("user")
export class WorkoutSessionsController {
  constructor(private readonly workoutSessionsService: WorkoutSessionsService) {}

  @Get("me")
  listMine(@CurrentUserDecorator() user: CurrentUser): Promise<WorkoutSessionSummary[]> {
    return this.workoutSessionsService.listMine(user);
  }

  @Get(":sessionId")
  detail(
    @CurrentUserDecorator() user: CurrentUser,
    @Param("sessionId") sessionId: string
  ): Promise<WorkoutSessionRecord> {
    return this.workoutSessionsService.detail(user, sessionId);
  }

  @Post()
  start(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() body: StartWorkoutSessionDto
  ): Promise<WorkoutSessionRecord> {
    return this.workoutSessionsService.start(user, body as StartWorkoutSessionRequest);
  }

  @Patch(":sessionId")
  update(
    @CurrentUserDecorator() user: CurrentUser,
    @Param("sessionId") sessionId: string,
    @Body() body: UpdateWorkoutSessionDto
  ): Promise<WorkoutSessionRecord> {
    return this.workoutSessionsService.update(user, sessionId, body as UpdateWorkoutSessionRequest);
  }

  @Post(":sessionId/complete")
  complete(
    @CurrentUserDecorator() user: CurrentUser,
    @Param("sessionId") sessionId: string,
    @Body() body: UpdateWorkoutSessionDto
  ): Promise<WorkoutSessionRecord> {
    return this.workoutSessionsService.complete(
      user,
      sessionId,
      body as CompleteWorkoutSessionRequest
    );
  }
}
