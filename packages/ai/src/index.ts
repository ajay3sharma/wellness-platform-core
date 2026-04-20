import { getBrandPack } from "@platform/brand";
import type { AdminAiQuotaPolicy, AiQuotaPolicy, BrandPack, UserPlan } from "@platform/types";

export function getUserAiQuotaPolicy(
  plan: UserPlan,
  brandPack: BrandPack = getBrandPack()
): AiQuotaPolicy {
  return {
    maxRequestsPerDay: brandPack.ai.userDailyRequestLimits[plan],
    maxTokensPerDay: brandPack.ai.userDailyTokenLimits[plan]
  };
}

export function getAdminAiQuotaPolicy(
  brandPack: BrandPack = getBrandPack()
): AdminAiQuotaPolicy {
  return {
    maxActionsPerDay: brandPack.ai.adminDailyActions,
    maxBrandActionsPerDay: brandPack.ai.brandDailyActions,
    mode: "free_tier_only" as const,
    fallback: "disable" as const
  };
}
