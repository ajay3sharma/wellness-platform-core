import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import type { WorkoutDetail, WorkoutListItem } from "@platform/types";
import { RolesGuard } from "../common/roles.guard";
import { Roles } from "../common/roles.decorator";
import { AccessTokenGuard } from "../auth/auth.guard";
import { SaveWorkoutDto } from "./dto/save-workout.dto";
import { WorkoutsService } from "./workouts.service";

@Controller("admin/workouts")
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles("admin")
export class AdminWorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  @Get()
  list(): Promise<WorkoutListItem[]> {
    return this.workoutsService.listAdminWorkouts();
  }

  @Post()
  create(@Body() body: SaveWorkoutDto): Promise<WorkoutDetail> {
    return this.workoutsService.createWorkout(body);
  }

  @Patch(":workoutId")
  update(@Param("workoutId") workoutId: string, @Body() body: SaveWorkoutDto): Promise<WorkoutDetail> {
    return this.workoutsService.updateWorkout(workoutId, body);
  }

  @Post(":workoutId/publish")
  publish(@Param("workoutId") workoutId: string): Promise<WorkoutDetail> {
    return this.workoutsService.setWorkoutStatus(workoutId, "published");
  }

  @Post(":workoutId/unpublish")
  unpublish(@Param("workoutId") workoutId: string): Promise<WorkoutDetail> {
    return this.workoutsService.setWorkoutStatus(workoutId, "draft");
  }
}
