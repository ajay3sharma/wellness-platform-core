import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import type {
  CurrentUser,
  ResetRecommendationResponse,
  UserAiQuotaStatus,
  WorkoutRecommendationResponse
} from "@platform/types";
import { AccessTokenGuard } from "../auth/auth.guard";
import { CurrentUserDecorator } from "../common/current-user.decorator";
import { Roles } from "../common/roles.decorator";
import { RolesGuard } from "../common/roles.guard";
import { ResetRecommendationDto } from "./dto/reset-recommendation.dto";
import { WorkoutRecommendationDto } from "./dto/workout-recommendation.dto";
import { AiService } from "./ai.service";

@Controller("ai")
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles("user")
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get("quota/me")
  getMyQuota(@CurrentUserDecorator() user: CurrentUser): Promise<UserAiQuotaStatus> {
    return this.aiService.getUserQuotaStatus(user);
  }

  @Post("recommendations/workout")
  workoutRecommendations(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() payload: WorkoutRecommendationDto
  ): Promise<WorkoutRecommendationResponse> {
    return this.aiService.generateWorkoutRecommendations(user, payload);
  }

  @Post("recommendations/reset")
  resetRecommendations(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() payload: ResetRecommendationDto
  ): Promise<ResetRecommendationResponse> {
    return this.aiService.generateResetRecommendations(user, payload);
  }
}
