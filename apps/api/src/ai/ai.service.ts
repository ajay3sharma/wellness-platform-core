import { HttpException, Injectable } from "@nestjs/common";
import type {
  AdminAiQuotaStatus,
  CurrentUser,
  MusicTrackListItem,
  RelaxationDraftRequest,
  RelaxationDraftResponse,
  RelaxationTechniqueListItem,
  ResetRecommendationRequest,
  ResetRecommendationResponse,
  SaveRelaxationTechniqueRequest,
  SaveWorkoutRequest,
  UserAiQuotaStatus,
  WorkoutListItem,
  WorkoutDraftRequest,
  WorkoutDraftResponse,
  WorkoutRecommendationRequest,
  WorkoutRecommendationResponse
} from "@platform/types";
import { createApiException } from "../common/api-error.util";
import { PlatformLogger } from "../observability/platform-logger.service";
import { GeminiService, type GeminiJsonResult } from "./gemini.service";
import { AiQuotaService } from "./ai-quota.service";
import { WorkoutsService } from "../workouts/workouts.service";
import { WellnessService } from "../wellness/wellness.service";

interface WorkoutRecommendationModelResult {
  recommendations?: Array<{
    workoutId?: string;
    explanation?: string;
  }>;
}

interface ResetRecommendationModelResult {
  relaxationTechniqueId?: string | null;
  relaxationExplanation?: string;
  musicTrackId?: string | null;
  musicExplanation?: string;
}

@Injectable()
export class AiService {
  constructor(
    private readonly geminiService: GeminiService,
    private readonly aiQuotaService: AiQuotaService,
    private readonly workoutsService: WorkoutsService,
    private readonly wellnessService: WellnessService,
    private readonly logger: PlatformLogger
  ) {}

  getUserQuotaStatus(user: CurrentUser): Promise<UserAiQuotaStatus> {
    return this.aiQuotaService.getUserQuotaStatus(user);
  }

  getAdminQuotaStatus(user: CurrentUser): Promise<AdminAiQuotaStatus> {
    return this.aiQuotaService.getAdminQuotaStatus(user);
  }

  async generateWorkoutRecommendations(
    user: CurrentUser,
    payload: WorkoutRecommendationRequest
  ): Promise<WorkoutRecommendationResponse> {
    const plan = await this.aiQuotaService.assertUserFeatureAvailable(
      user,
      "user_workout_recommendation"
    );
    const workouts = await this.workoutsService.listVisibleWorkouts(user);

    if (workouts.length === 0) {
      return {
        provider: "gemini",
        generatedAt: new Date().toISOString(),
        quota: await this.aiQuotaService.getUserQuotaStatus(user),
        recommendations: []
      };
    }

    try {
      const result = await this.geminiService.generateJson<WorkoutRecommendationModelResult>({
        systemInstruction:
          "You are a fitness recommendation assistant. Choose only from the provided workout catalog. Return strict JSON only.",
        userPrompt: JSON.stringify({
          task:
            "Pick up to 3 workout ids from the catalog that best match the request. Each explanation must be short, specific, and mention why the workout fits. Never invent ids.",
          request: payload,
          catalog: workouts.map((workout) => ({
            id: workout.id,
            title: workout.title,
            description: workout.description,
            difficulty: workout.difficulty,
            durationMinutes: workout.durationMinutes,
            category: workout.category,
            tags: workout.tags,
            assigned: Boolean(workout.assignment)
          }))
        }),
        temperature: 0.4
      });

      const recommendations = this.mapWorkoutRecommendations(result, workouts);

      if (recommendations.length === 0) {
        throw createApiException(
          503,
          "AI_TEMPORARILY_UNAVAILABLE",
          "Gemini AI did not return valid workout recommendations."
        );
      }

      await this.aiQuotaService.recordUsage({
        user,
        feature: "user_workout_recommendation",
        resolvedUserPlan: plan,
        status: "succeeded",
        promptTokenCount: result.usage.promptTokenCount,
        candidateTokenCount: result.usage.candidateTokenCount,
        totalTokenCount: result.usage.totalTokenCount,
        errorCode: null,
        metadata: {
          catalogSize: workouts.length,
          recommendationCount: recommendations.length
        }
      });

      return {
        provider: "gemini",
        generatedAt: new Date().toISOString(),
        quota: await this.aiQuotaService.getUserQuotaStatus(user),
        recommendations
      };
    } catch (error) {
      await this.recordAiFailure(user, plan, "user_workout_recommendation", error, {
        catalogSize: workouts.length
      });
      throw this.normalizeAiError(error);
    }
  }

  async generateResetRecommendations(
    user: CurrentUser,
    payload: ResetRecommendationRequest
  ): Promise<ResetRecommendationResponse> {
    const plan = await this.aiQuotaService.assertUserFeatureAvailable(
      user,
      "user_reset_recommendation"
    );
    const [relaxation, music] = await Promise.all([
      this.wellnessService.listVisibleRelaxation(),
      this.wellnessService.listVisibleMusic()
    ]);

    if (relaxation.length === 0 && music.length === 0) {
      return {
        provider: "gemini",
        generatedAt: new Date().toISOString(),
        quota: await this.aiQuotaService.getUserQuotaStatus(user),
        relaxation: null,
        music: null
      };
    }

    try {
      const result = await this.geminiService.generateJson<ResetRecommendationModelResult>({
        systemInstruction:
          "You are a wellness recommendation assistant. Choose only from the provided relaxation and music catalogs. Return strict JSON only.",
        userPrompt: JSON.stringify({
          task:
            "Choose one relaxationTechniqueId and one musicTrackId that best fit the request. If a catalog is empty, return null for that id. Never invent ids.",
          request: payload,
          relaxationCatalog: relaxation.map((technique) => ({
            id: technique.id,
            title: technique.title,
            description: technique.description,
            category: technique.category,
            estimatedDurationMinutes: technique.estimatedDurationMinutes,
            tags: technique.tags
          })),
          musicCatalog: music.map((track) => ({
            id: track.id,
            title: track.title,
            description: track.description,
            category: track.category,
            artistName: track.artistName,
            durationSeconds: track.durationSeconds,
            tags: track.tags
          }))
        }),
        temperature: 0.4
      });

      const recommendation = this.mapResetRecommendation(result, relaxation, music);

      if (!recommendation.relaxation && !recommendation.music) {
        throw createApiException(
          503,
          "AI_TEMPORARILY_UNAVAILABLE",
          "Gemini AI did not return valid reset recommendations."
        );
      }

      await this.aiQuotaService.recordUsage({
        user,
        feature: "user_reset_recommendation",
        resolvedUserPlan: plan,
        status: "succeeded",
        promptTokenCount: result.usage.promptTokenCount,
        candidateTokenCount: result.usage.candidateTokenCount,
        totalTokenCount: result.usage.totalTokenCount,
        errorCode: null,
        metadata: {
          relaxationCatalogSize: relaxation.length,
          musicCatalogSize: music.length,
          recommendedRelaxation: recommendation.relaxation?.techniqueId ?? null,
          recommendedMusic: recommendation.music?.trackId ?? null
        }
      });

      return {
        provider: "gemini",
        generatedAt: new Date().toISOString(),
        quota: await this.aiQuotaService.getUserQuotaStatus(user),
        relaxation: recommendation.relaxation,
        music: recommendation.music
      };
    } catch (error) {
      await this.recordAiFailure(user, plan, "user_reset_recommendation", error, {
        relaxationCatalogSize: relaxation.length,
        musicCatalogSize: music.length
      });
      throw this.normalizeAiError(error);
    }
  }

  async createWorkoutDraft(
    user: CurrentUser,
    payload: WorkoutDraftRequest
  ): Promise<WorkoutDraftResponse> {
    await this.aiQuotaService.assertAdminFeatureAvailable(user, "admin_workout_draft");

    try {
      const result = await this.geminiService.generateJson<SaveWorkoutRequest>({
        systemInstruction:
          "You are an admin content drafting assistant for a fitness app. Return strict JSON matching the requested workout draft shape. Never include markdown.",
        userPrompt: JSON.stringify({
          task:
            "Generate a workout draft with a clear title, descriptive summary, difficulty, durationMinutes, category, tags, and an ordered exercises array. Each exercise needs name, instruction, optional repTarget or timeTargetSeconds, optional distanceTargetMeters, optional restSeconds, and sequence starting at 1.",
          request: payload
        }),
        temperature: 0.55
      });

      const draft = this.sanitizeWorkoutDraft(result.data, payload);

      await this.aiQuotaService.recordUsage({
        user,
        feature: "admin_workout_draft",
        resolvedUserPlan: null,
        status: "succeeded",
        promptTokenCount: result.usage.promptTokenCount,
        candidateTokenCount: result.usage.candidateTokenCount,
        totalTokenCount: result.usage.totalTokenCount,
        errorCode: null,
        metadata: {
          exerciseCount: draft.exercises.length
        }
      });

      return {
        provider: "gemini",
        generatedAt: new Date().toISOString(),
        quota: await this.aiQuotaService.getAdminQuotaStatus(user),
        draft
      };
    } catch (error) {
      await this.recordAiFailure(user, null, "admin_workout_draft", error, null);
      throw this.normalizeAiError(error);
    }
  }

  async createRelaxationDraft(
    user: CurrentUser,
    payload: RelaxationDraftRequest
  ): Promise<RelaxationDraftResponse> {
    await this.aiQuotaService.assertAdminFeatureAvailable(user, "admin_relaxation_draft");

    try {
      const result = await this.geminiService.generateJson<SaveRelaxationTechniqueRequest>({
        systemInstruction:
          "You are an admin content drafting assistant for a wellness app. Return strict JSON matching the requested relaxation draft shape. Never include markdown.",
        userPrompt: JSON.stringify({
          task:
            "Generate a relaxation technique draft with title, description, category, tags, estimatedDurationMinutes, optional coverImageUrl, and an ordered steps array. Each step needs title, instruction, durationSeconds, and sequence starting at 1.",
          request: payload
        }),
        temperature: 0.55
      });

      const draft = this.sanitizeRelaxationDraft(result.data, payload);

      await this.aiQuotaService.recordUsage({
        user,
        feature: "admin_relaxation_draft",
        resolvedUserPlan: null,
        status: "succeeded",
        promptTokenCount: result.usage.promptTokenCount,
        candidateTokenCount: result.usage.candidateTokenCount,
        totalTokenCount: result.usage.totalTokenCount,
        errorCode: null,
        metadata: {
          stepCount: draft.steps.length
        }
      });

      return {
        provider: "gemini",
        generatedAt: new Date().toISOString(),
        quota: await this.aiQuotaService.getAdminQuotaStatus(user),
        draft
      };
    } catch (error) {
      await this.recordAiFailure(user, null, "admin_relaxation_draft", error, null);
      throw this.normalizeAiError(error);
    }
  }

  private mapWorkoutRecommendations(
    result: GeminiJsonResult<WorkoutRecommendationModelResult>,
    workouts: WorkoutListItem[]
  ) {
    const workoutsById = new Map(workouts.map((workout) => [workout.id, workout]));
    const seen = new Set<string>();

    return (result.data.recommendations ?? [])
      .map((entry) => {
        const workoutId = entry.workoutId?.trim();
        const explanation = entry.explanation?.trim();

        if (!workoutId || !explanation || seen.has(workoutId) || !workoutsById.has(workoutId)) {
          return null;
        }

        seen.add(workoutId);

        return {
          workoutId,
          explanation,
          workout: workoutsById.get(workoutId)!
        };
      })
      .filter((entry): entry is WorkoutRecommendationResponse["recommendations"][number] => Boolean(entry))
      .slice(0, 3);
  }

  private mapResetRecommendation(
    result: GeminiJsonResult<ResetRecommendationModelResult>,
    relaxation: RelaxationTechniqueListItem[],
    music: MusicTrackListItem[]
  ) {
    const relaxationById = new Map(relaxation.map((item) => [item.id, item]));
    const musicById = new Map(music.map((item) => [item.id, item]));
    const relaxationTechniqueId = result.data.relaxationTechniqueId?.trim() ?? null;
    const musicTrackId = result.data.musicTrackId?.trim() ?? null;
    const relaxationExplanation = result.data.relaxationExplanation?.trim() ?? "";
    const musicExplanation = result.data.musicExplanation?.trim() ?? "";

    return {
      relaxation:
        relaxationTechniqueId && relaxationById.has(relaxationTechniqueId) && relaxationExplanation
          ? {
              techniqueId: relaxationTechniqueId,
              explanation: relaxationExplanation,
              technique: relaxationById.get(relaxationTechniqueId)!
            }
          : null,
      music:
        musicTrackId && musicById.has(musicTrackId) && musicExplanation
          ? {
              trackId: musicTrackId,
              explanation: musicExplanation,
              track: musicById.get(musicTrackId)!
            }
          : null
    };
  }

  private sanitizeWorkoutDraft(
    draft: SaveWorkoutRequest,
    payload: WorkoutDraftRequest
  ): SaveWorkoutRequest {
    const exercises = (draft.exercises ?? [])
      .filter((exercise) => exercise?.name?.trim())
      .map((exercise, index) => ({
        name: exercise.name.trim(),
        instruction: exercise.instruction?.trim() || null,
        repTarget: exercise.repTarget?.trim() || null,
        timeTargetSeconds: exercise.timeTargetSeconds ?? null,
        distanceTargetMeters: exercise.distanceTargetMeters ?? null,
        restSeconds: exercise.restSeconds ?? null,
        sequence: index + 1
      }));

    if (exercises.length === 0) {
      throw createApiException(
        503,
        "AI_TEMPORARILY_UNAVAILABLE",
        "Gemini AI did not return any usable workout exercises."
      );
    }

    return {
      title: draft.title?.trim() || "AI Draft Workout",
      description:
        draft.description?.trim() ||
        "AI-generated workout draft. Review and adjust before publishing.",
      difficulty: draft.difficulty ?? payload.difficulty ?? "beginner",
      durationMinutes: draft.durationMinutes ?? payload.durationMinutes ?? 20,
      category: draft.category?.trim() || payload.category?.trim() || null,
      tags: this.normalizeTags(draft.tags, payload.focusTags),
      exercises
    };
  }

  private sanitizeRelaxationDraft(
    draft: SaveRelaxationTechniqueRequest,
    payload: RelaxationDraftRequest
  ): SaveRelaxationTechniqueRequest {
    const steps = (draft.steps ?? [])
      .filter((step) => step?.title?.trim() && step?.instruction?.trim())
      .map((step, index) => ({
        title: step.title.trim(),
        instruction: step.instruction.trim(),
        durationSeconds: Math.max(step.durationSeconds ?? 60, 1),
        sequence: index + 1
      }));

    if (steps.length === 0) {
      throw createApiException(
        503,
        "AI_TEMPORARILY_UNAVAILABLE",
        "Gemini AI did not return any usable relaxation steps."
      );
    }

    return {
      title: draft.title?.trim() || "AI Draft Relaxation",
      description:
        draft.description?.trim() ||
        "AI-generated relaxation draft. Review and adjust before publishing.",
      category: draft.category?.trim() || payload.category?.trim() || null,
      tags: this.normalizeTags(draft.tags, payload.focusTags),
      estimatedDurationMinutes:
        draft.estimatedDurationMinutes ?? payload.estimatedDurationMinutes ?? 10,
      coverImageUrl: draft.coverImageUrl?.trim() || null,
      steps
    };
  }

  private normalizeTags(tags: string[] | undefined, fallbackTags: string[] | undefined) {
    return [...(tags ?? []), ...(fallbackTags ?? [])]
      .map((tag) => tag.trim())
      .filter(Boolean)
      .filter((tag, index, items) => items.indexOf(tag) === index)
      .slice(0, 8);
  }

  private async recordAiFailure(
    user: CurrentUser,
    resolvedUserPlan: "free" | "plus" | "pro" | null,
    feature: "user_workout_recommendation" | "user_reset_recommendation" | "admin_workout_draft" | "admin_relaxation_draft",
    error: unknown,
    metadata: Record<string, unknown> | null
  ) {
    const normalized = this.normalizeAiFailure(error);

    await this.aiQuotaService.recordUsage({
      user,
      feature,
      resolvedUserPlan,
      status: normalized.status,
      errorCode: normalized.code,
      metadata
    });

    this.logger.warn("ai.provider_failure", {
      status: normalized.httpStatus,
      errorCode: normalized.code,
      userId: user.id,
      role: user.role,
      brand: user.activeBrand,
      feature
    });
  }

  private normalizeAiError(error: unknown) {
    const normalized = this.normalizeAiFailure(error);
    return createApiException(normalized.httpStatus, normalized.code, normalized.message);
  }

  private normalizeAiFailure(error: unknown) {
    if (error instanceof HttpException) {
      const response = error.getResponse() as { code?: string; message?: string };
      const status = error.getStatus();

      if (response?.code === "AI_TEMPORARILY_UNAVAILABLE") {
        return {
          status: "provider_unavailable" as const,
          code: "AI_TEMPORARILY_UNAVAILABLE" as const,
          message: response.message || "AI is temporarily unavailable.",
          httpStatus: status
        };
      }
    }

    return {
      status: "failed" as const,
      code: "AI_TEMPORARILY_UNAVAILABLE" as const,
      message: "AI is temporarily unavailable.",
      httpStatus: 503
    };
  }
}
