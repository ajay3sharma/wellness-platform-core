import { Injectable } from "@nestjs/common";
import { Prisma, PrismaClient } from "@prisma/client";
import type { AiFeatureKey, AiAvailability, CurrentUser, UserPlan } from "@platform/types";
import {
  type AdminAiQuotaStatus,
  type AiApiErrorCode,
  type AiAvailabilityStatus,
  type AiUsageStatus,
  type UserAiQuotaStatus
} from "@platform/types";
import { getAdminAiQuotaPolicy, getUserAiQuotaPolicy } from "@platform/ai";
import { getBrandPack } from "@platform/brand";
import { platformConfig, runtimeEnv } from "@platform/config";
import { createApiException } from "../common/api-error.util";
import { PlatformLogger } from "../observability/platform-logger.service";
import { PrismaService } from "../prisma/prisma.service";

const userAiFeatures = ["user_workout_recommendation", "user_reset_recommendation"] as const;
const adminAiFeatures = ["admin_workout_draft", "admin_relaxation_draft"] as const;

@Injectable()
export class AiQuotaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PlatformLogger
  ) {}

  async getUserQuotaStatus(user: CurrentUser): Promise<UserAiQuotaStatus> {
    const plan = await this.resolveCurrentPlan(user.id);
    return this.buildUserQuotaStatus(user, plan);
  }

  async getAdminQuotaStatus(user: CurrentUser): Promise<AdminAiQuotaStatus> {
    return this.buildAdminQuotaStatus(user);
  }

  async assertUserFeatureAvailable(
    user: CurrentUser,
    feature: (typeof userAiFeatures)[number]
  ): Promise<UserPlan> {
    const plan = await this.resolveCurrentPlan(user.id);
    const quota = await this.buildUserQuotaStatus(user, plan);
    const availability = quota.features[feature];

    if (availability.status !== "available") {
      this.logger.warn("ai.quota_blocked", {
        status: availability.code === "AI_QUOTA_EXCEEDED" ? 429 : 503,
        errorCode: availability.code,
        userId: user.id,
        role: user.role,
        brand: user.activeBrand,
        feature
      });
      await this.recordUsage({
        user,
        feature,
        resolvedUserPlan: plan,
        status: this.toUsageStatus(availability.status),
        errorCode: availability.code
      });
      throw this.toApiException(availability);
    }

    return plan;
  }

  async assertAdminFeatureAvailable(
    user: CurrentUser,
    feature: (typeof adminAiFeatures)[number]
  ): Promise<void> {
    const quota = await this.buildAdminQuotaStatus(user);
    const availability = quota.features[feature];

    if (availability.status !== "available") {
      this.logger.warn("ai.quota_blocked", {
        status: availability.code === "AI_QUOTA_EXCEEDED" ? 429 : 503,
        errorCode: availability.code,
        userId: user.id,
        role: user.role,
        brand: user.activeBrand,
        feature
      });
      await this.recordUsage({
        user,
        feature,
        resolvedUserPlan: null,
        status: this.toUsageStatus(availability.status),
        errorCode: availability.code
      });
      throw this.toApiException(availability);
    }
  }

  async recordUsage({
    user,
    feature,
    resolvedUserPlan,
    status,
    errorCode,
    promptTokenCount = 0,
    candidateTokenCount = 0,
    totalTokenCount = 0,
    metadata
  }: {
    user: CurrentUser;
    feature: AiFeatureKey;
    resolvedUserPlan: UserPlan | null;
    status: AiUsageStatus;
    errorCode: AiApiErrorCode | null;
    promptTokenCount?: number;
    candidateTokenCount?: number;
    totalTokenCount?: number;
    metadata?: Record<string, unknown> | null;
  }) {
    const prisma = this.prisma as PrismaClient;

    await prisma.aiUsageRecord.create({
      data: {
        userId: user.id,
        role: user.role,
        activeBrand: user.activeBrand,
        resolvedUserPlan,
        provider: "gemini",
        featureKey: feature,
        usageDate: this.getUtcDayStart(),
        status,
        promptTokenCount,
        candidateTokenCount,
        totalTokenCount,
        errorCode,
        metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined
      }
    });
  }

  private async buildUserQuotaStatus(
    user: CurrentUser,
    plan: UserPlan
  ): Promise<UserAiQuotaStatus> {
    const prisma = this.prisma as PrismaClient;
    const brand = getBrandPack(user.activeBrand);
    const policy = getUserAiQuotaPolicy(plan, brand);
    const usageDate = this.getUtcDayStart();
    const resetAt = this.getNextUtcDayStart().toISOString();
    const usage = await prisma.aiUsageRecord.aggregate({
      where: {
        userId: user.id,
        role: "user",
        usageDate,
        featureKey: {
          in: [...userAiFeatures]
        },
        status: "succeeded"
      },
      _count: {
        _all: true
      },
      _sum: {
        totalTokenCount: true
      }
    });

    const usedRequests = usage._count._all;
    const usedTokens = usage._sum.totalTokenCount ?? 0;
    const remainingRequests = Math.max(policy.maxRequestsPerDay - usedRequests, 0);
    const remainingTokens = Math.max(policy.maxTokensPerDay - usedTokens, 0);
    const quotaExceeded = remainingRequests <= 0 || remainingTokens <= 0;

    const features = {
      user_workout_recommendation: this.buildAvailability(
        "user_workout_recommendation",
        quotaExceeded
      ),
      user_reset_recommendation: this.buildAvailability("user_reset_recommendation", quotaExceeded)
    };

    return {
      provider: "gemini",
      plan,
      status: this.summarizeStatus(Object.values(features)),
      usedRequests,
      remainingRequests,
      usedTokens,
      remainingTokens,
      resetAt,
      features
    };
  }

  private async buildAdminQuotaStatus(user: CurrentUser): Promise<AdminAiQuotaStatus> {
    const prisma = this.prisma as PrismaClient;
    const brand = getBrandPack(user.activeBrand);
    const policy = getAdminAiQuotaPolicy(brand);
    const usageDate = this.getUtcDayStart();
    const resetAt = this.getNextUtcDayStart().toISOString();
    const [userUsage, brandUsage] = await Promise.all([
      prisma.aiUsageRecord.aggregate({
        where: {
          userId: user.id,
          role: "admin",
          usageDate,
          featureKey: {
            in: [...adminAiFeatures]
          },
          status: "succeeded"
        },
        _count: {
          _all: true
        }
      }),
      prisma.aiUsageRecord.aggregate({
        where: {
          activeBrand: user.activeBrand,
          role: "admin",
          usageDate,
          featureKey: {
            in: [...adminAiFeatures]
          },
          status: "succeeded"
        },
        _count: {
          _all: true
        }
      })
    ]);

    const usedActions = userUsage._count._all;
    const usedBrandActions = brandUsage._count._all;
    const remainingActions = Math.max(policy.maxActionsPerDay - usedActions, 0);
    const remainingBrandActions = Math.max(policy.maxBrandActionsPerDay - usedBrandActions, 0);
    const quotaExceeded = remainingActions <= 0 || remainingBrandActions <= 0;

    const features = {
      admin_workout_draft: this.buildAvailability("admin_workout_draft", quotaExceeded),
      admin_relaxation_draft: this.buildAvailability("admin_relaxation_draft", quotaExceeded)
    };

    return {
      provider: "gemini",
      status: this.summarizeStatus(Object.values(features)),
      usedActions,
      remainingActions,
      usedBrandActions,
      remainingBrandActions,
      resetAt,
      features
    };
  }

  private buildAvailability(feature: AiFeatureKey, quotaExceeded: boolean): AiAvailability {
    const featureEnabled = this.isFeatureEnabled(feature);

    if (!platformConfig.ai.enabled || !featureEnabled) {
      return {
        feature,
        status: "disabled",
        code: "AI_DISABLED",
        message: "This AI feature is disabled for the current environment."
      };
    }

    if (!runtimeEnv.geminiApiKey) {
      return {
        feature,
        status: "temporarily_unavailable",
        code: "AI_TEMPORARILY_UNAVAILABLE",
        message: "The Gemini provider is not configured right now."
      };
    }

    if (quotaExceeded) {
      return {
        feature,
        status: "quota_exceeded",
        code: "AI_QUOTA_EXCEEDED",
        message: "The free-tier AI quota has been exhausted for the current UTC day."
      };
    }

    return {
      feature,
      status: "available",
      code: null,
      message: "AI is available for this feature."
    };
  }

  private isFeatureEnabled(feature: AiFeatureKey) {
    switch (feature) {
      case "admin_workout_draft":
      case "admin_relaxation_draft":
        return platformConfig.ai.features.adminDrafts;
      case "user_workout_recommendation":
        return platformConfig.ai.features.userWorkoutRecommendations;
      case "user_reset_recommendation":
        return platformConfig.ai.features.userResetRecommendations;
      default:
        return false;
    }
  }

  private summarizeStatus(availability: AiAvailability[]): AiAvailabilityStatus {
    if (availability.some((item) => item.status === "available")) {
      return "available";
    }

    if (availability.some((item) => item.status === "quota_exceeded")) {
      return "quota_exceeded";
    }

    if (availability.some((item) => item.status === "temporarily_unavailable")) {
      return "temporarily_unavailable";
    }

    return "disabled";
  }

  private toUsageStatus(status: AiAvailabilityStatus): AiUsageStatus {
    switch (status) {
      case "quota_exceeded":
        return "quota_blocked";
      case "temporarily_unavailable":
        return "provider_unavailable";
      case "disabled":
        return "disabled";
      default:
        return "failed";
    }
  }

  private toApiException(availability: AiAvailability) {
    if (availability.code === "AI_QUOTA_EXCEEDED") {
      return createApiException(429, availability.code, availability.message);
    }

    if (availability.code === "AI_DISABLED") {
      return createApiException(503, availability.code, availability.message);
    }

    return createApiException(503, "AI_TEMPORARILY_UNAVAILABLE", availability.message);
  }

  private async resolveCurrentPlan(userId: string): Promise<UserPlan> {
    const subscription = await this.prisma.userSubscription.findFirst({
      where: {
        userId,
        status: "active"
      },
      select: {
        userPlan: true
      },
      orderBy: [{ activatedAt: "desc" }, { createdAt: "desc" }]
    });

    return subscription?.userPlan ?? "free";
  }

  private getUtcDayStart(now = new Date()) {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }

  private getNextUtcDayStart(now = new Date()) {
    return new Date(this.getUtcDayStart(now).getTime() + 24 * 60 * 60 * 1000);
  }
}
