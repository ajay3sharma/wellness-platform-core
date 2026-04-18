import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import type { CurrentUser, WorkoutDetail, WorkoutListItem } from "@platform/types";
import { CurrentUserDecorator } from "../common/current-user.decorator";
import { AccessTokenGuard } from "../auth/auth.guard";
import { WorkoutsService } from "./workouts.service";

@Controller("workouts")
@UseGuards(AccessTokenGuard)
export class WorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  @Get()
  list(@CurrentUserDecorator() user: CurrentUser): Promise<WorkoutListItem[]> {
    return this.workoutsService.listVisibleWorkouts(user);
  }

  @Get(":workoutId")
  detail(
    @CurrentUserDecorator() user: CurrentUser,
    @Param("workoutId") workoutId: string
  ): Promise<WorkoutDetail> {
    return this.workoutsService.getVisibleWorkout(user, workoutId);
  }
}
