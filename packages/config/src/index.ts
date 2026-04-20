import { getBrandPack } from "@platform/brand";
import type { PlatformConfig } from "@platform/types";

const activeBrand = getBrandPack();

function getFirstDefinedEnv(names: string[], fallback: string): string {
  for (const name of names) {
    const value = process.env[name];
    if (value) {
      return value;
    }
  }

  return fallback;
}

function getStringEnv(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

function getNumberEnv(name: string, fallback: number): number {
  const value = process.env[name];

  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getBooleanEnv(name: string, fallback: boolean): boolean {
  const value = process.env[name];

  if (!value) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

export const runtimeEnv = {
  nodeEnv: getStringEnv("NODE_ENV", "development"),
  activeBrand: getStringEnv("PLATFORM_BRAND", activeBrand.key),
  databaseUrl: getStringEnv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/wellness_platform"
  ),
  jwtAccessSecret: getStringEnv("JWT_ACCESS_SECRET", "dev-access-secret"),
  jwtRefreshSecret: getStringEnv("JWT_REFRESH_SECRET", "dev-refresh-secret"),
  apiPort: getNumberEnv("API_PORT", 4000),
  webPort: getNumberEnv("WEB_PORT", 3000),
  adminPort: getNumberEnv("ADMIN_PORT", 3001),
  webUrl: getStringEnv("NEXT_PUBLIC_WEB_URL", activeBrand.domains.web),
  adminUrl: getStringEnv("NEXT_PUBLIC_ADMIN_URL", activeBrand.domains.admin),
  apiUrl: getFirstDefinedEnv(
    ["NEXT_PUBLIC_API_URL", "EXPO_PUBLIC_API_URL"],
    activeBrand.domains.api
  ),
  mobileScheme: getStringEnv("EXPO_PUBLIC_APP_SCHEME", activeBrand.domains.mobileDeepLink),
  stripeSecretKey: getStringEnv("STRIPE_SECRET_KEY", ""),
  stripeWebhookSecret: getStringEnv("STRIPE_WEBHOOK_SECRET", ""),
  razorpayKeyId: getStringEnv("RAZORPAY_KEY_ID", ""),
  razorpayKeySecret: getStringEnv("RAZORPAY_KEY_SECRET", ""),
  razorpayWebhookSecret: getStringEnv("RAZORPAY_WEBHOOK_SECRET", ""),
  geminiApiKey: getStringEnv("GEMINI_API_KEY", ""),
  geminiModel: getStringEnv("GEMINI_MODEL", "gemini-2.0-flash"),
  aiEnabled: getBooleanEnv("AI_ENABLED", true),
  aiAdminDraftsEnabled: getBooleanEnv("AI_ADMIN_DRAFTS_ENABLED", true),
  aiUserWorkoutRecommendationsEnabled: getBooleanEnv(
    "AI_USER_WORKOUT_RECOMMENDATIONS_ENABLED",
    true
  ),
  aiUserResetRecommendationsEnabled: getBooleanEnv("AI_USER_RESET_RECOMMENDATIONS_ENABLED", true)
};

export const platformConfig: PlatformConfig = {
  repo: {
    slug: "wellness-platform-core",
    defaultBranch: "main"
  },
  services: {
    api: {
      port: runtimeEnv.apiPort,
      basePath: "/api/v1",
      publicUrl: runtimeEnv.apiUrl
    },
    web: {
      port: runtimeEnv.webPort,
      publicUrl: runtimeEnv.webUrl
    },
    admin: {
      port: runtimeEnv.adminPort,
      publicUrl: runtimeEnv.adminUrl
    },
    mobile: {
      scheme: runtimeEnv.mobileScheme,
      apiUrl: runtimeEnv.apiUrl
    }
  },
  auth: {
    issuer: activeBrand.domains.api,
    audience: activeBrand.productName.toLowerCase(),
    accessTokenTtlMinutes: 15,
    refreshTokenTtlDays: 14
  },
  data: {
    provider: "postgresql",
    client: "prisma",
    databaseUrlEnvVar: "DATABASE_URL"
  },
  billing: {
    defaultMarket: activeBrand.billing.defaultMarket,
    enabledProviders: ["razorpay", "stripe"],
    checkoutBridgePath: "/checkout/launch"
  },
  ai: {
    mode: "free_tier_only",
    fallback: "disable",
    userExperience: "recommendations_only",
    provider: "gemini",
    enabled: runtimeEnv.aiEnabled,
    features: {
      adminDrafts: runtimeEnv.aiAdminDraftsEnabled,
      userWorkoutRecommendations: runtimeEnv.aiUserWorkoutRecommendationsEnabled,
      userResetRecommendations: runtimeEnv.aiUserResetRecommendationsEnabled
    }
  }
};
