import { getBrandPack } from "@platform/brand";
import type { PlatformConfig } from "@platform/types";

const activeBrand = getBrandPack();

export const platformConfig: PlatformConfig = {
  repo: {
    slug: "wellness-platform-core",
    defaultBranch: "main"
  },
  billing: {
    defaultMarket: activeBrand.billing.defaultMarket,
    enabledProviders: ["razorpay", "stripe"]
  },
  ai: {
    mode: "free_tier_only",
    fallback: "disable",
    userExperience: "recommendations_only"
  }
};

