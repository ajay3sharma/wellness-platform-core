import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import type {
  AdminAiQuotaStatus,
  CurrentUser,
  RelaxationDraftResponse,
  WorkoutDraftResponse
} from "@platform/types";
import { AccessTokenGuard } from "../auth/auth.guard";
import { CurrentUserDecorator } from "../common/current-user.decorator";
import { Roles } from "../common/roles.decorator";
import { RolesGuard } from "../common/roles.guard";
import { AiService } from "./ai.service";
import { RelaxationDraftDto } from "./dto/relaxation-draft.dto";
import { WorkoutDraftDto } from "./dto/workout-draft.dto";

@Controller("admin/ai")
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles("admin")
export class AdminAiController {
  constructor(private readonly aiService: AiService) {}

  @Get("quota")
  getAdminQuota(@CurrentUserDecorator() user: CurrentUser): Promise<AdminAiQuotaStatus> {
    return this.aiService.getAdminQuotaStatus(user);
  }

  @Post("drafts/workout")
  createWorkoutDraft(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() payload: WorkoutDraftDto
  ): Promise<WorkoutDraftResponse> {
    return this.aiService.createWorkoutDraft(user, payload);
  }

  @Post("drafts/relaxation")
  createRelaxationDraft(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() payload: RelaxationDraftDto
  ): Promise<RelaxationDraftResponse> {
    return this.aiService.createRelaxationDraft(user, payload);
  }
}
