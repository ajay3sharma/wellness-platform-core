import { getBrandPack } from "@platform/brand";
import type { PlatformConfig } from "@platform/types";

const activeBrand = getBrandPack();
const publicEnv = {
  nextPublicWebUrl: process.env.NEXT_PUBLIC_WEB_URL,
  nextPublicAdminUrl: process.env.NEXT_PUBLIC_ADMIN_URL,
  nextPublicApiUrl: process.env.NEXT_PUBLIC_API_URL,
  expoPublicApiUrl: process.env.EXPO_PUBLIC_API_URL,
  expoPublicAppScheme: process.env.EXPO_PUBLIC_APP_SCHEME
};

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

function hasConfiguredValue(value: string): boolean {
  return Boolean(value.trim());
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
  webUrl: publicEnv.nextPublicWebUrl ?? activeBrand.domains.web,
  adminUrl: publicEnv.nextPublicAdminUrl ?? activeBrand.domains.admin,
  apiUrl: publicEnv.nextPublicApiUrl ?? publicEnv.expoPublicApiUrl ?? activeBrand.domains.api,
  mobileScheme: publicEnv.expoPublicAppScheme ?? activeBrand.domains.mobileDeepLink,
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

export interface RuntimeConfigGroupStatus {
  status: "ok" | "degraded";
  summary: string;
  details: string[];
}

export interface RuntimeConfigDiagnostics {
  core: RuntimeConfigGroupStatus;
  billing: RuntimeConfigGroupStatus;
  ai: RuntimeConfigGroupStatus;
}

export function getRuntimeConfigDiagnostics(): RuntimeConfigDiagnostics {
  const coreMissing: string[] = [];

  if (!hasConfiguredValue(runtimeEnv.databaseUrl)) {
    coreMissing.push("DATABASE_URL");
  }

  if (!hasConfiguredValue(runtimeEnv.jwtAccessSecret)) {
    coreMissing.push("JWT_ACCESS_SECRET");
  }

  if (!hasConfiguredValue(runtimeEnv.jwtRefreshSecret)) {
    coreMissing.push("JWT_REFRESH_SECRET");
  }

  if (!hasConfiguredValue(runtimeEnv.webUrl)) {
    coreMissing.push("NEXT_PUBLIC_WEB_URL");
  }

  if (!hasConfiguredValue(runtimeEnv.adminUrl)) {
    coreMissing.push("NEXT_PUBLIC_ADMIN_URL");
  }

  if (!hasConfiguredValue(runtimeEnv.apiUrl)) {
    coreMissing.push("NEXT_PUBLIC_API_URL or EXPO_PUBLIC_API_URL");
  }

  const stripeMissing = [
    !hasConfiguredValue(runtimeEnv.stripeSecretKey) ? "STRIPE_SECRET_KEY" : null,
    !hasConfiguredValue(runtimeEnv.stripeWebhookSecret) ? "STRIPE_WEBHOOK_SECRET" : null
  ].filter((value): value is string => Boolean(value));
  const razorpayMissing = [
    !hasConfiguredValue(runtimeEnv.razorpayKeyId) ? "RAZORPAY_KEY_ID" : null,
    !hasConfiguredValue(runtimeEnv.razorpayKeySecret) ? "RAZORPAY_KEY_SECRET" : null,
    !hasConfiguredValue(runtimeEnv.razorpayWebhookSecret) ? "RAZORPAY_WEBHOOK_SECRET" : null
  ].filter((value): value is string => Boolean(value));

  const configuredBillingProviders = [
    stripeMissing.length === 0 ? "stripe" : null,
    razorpayMissing.length === 0 ? "razorpay" : null
  ].filter((value): value is string => Boolean(value));

  const aiIssues: string[] = [];

  if (!platformConfig.ai.enabled) {
    aiIssues.push("AI is disabled by configuration.");
  }

  if (!hasConfiguredValue(runtimeEnv.geminiApiKey)) {
    aiIssues.push("GEMINI_API_KEY is missing.");
  }

  return {
    core: {
      status: coreMissing.length === 0 ? "ok" : "degraded",
      summary:
        coreMissing.length === 0
          ? "Core runtime configuration is present."
          : "Core runtime configuration is missing required values.",
      details:
        coreMissing.length === 0
          ? [
              `Database URL resolved for ${platformConfig.data.provider}.`,
              `Service URLs resolved for API ${runtimeEnv.apiUrl}, web ${runtimeEnv.webUrl}, and admin ${runtimeEnv.adminUrl}.`
            ]
          : [`Missing core values: ${coreMissing.join(", ")}.`]
    },
    billing: {
      status: configuredBillingProviders.length === 2 ? "ok" : "degraded",
      summary:
        configuredBillingProviders.length === 2
          ? "Stripe and Razorpay credentials are present."
          : `${configuredBillingProviders.length} of 2 billing providers are configured.`,
      details: [
        stripeMissing.length === 0
          ? "Stripe credentials are present."
          : `Stripe missing: ${stripeMissing.join(", ")}.`,
        razorpayMissing.length === 0
          ? "Razorpay credentials are present."
          : `Razorpay missing: ${razorpayMissing.join(", ")}.`
      ]
    },
    ai: {
      status: aiIssues.length === 0 ? "ok" : "degraded",
      summary:
        aiIssues.length === 0
          ? "Gemini AI configuration is present."
          : "AI is bootable but not fully configured for live validation.",
      details:
        aiIssues.length === 0
          ? [`Gemini model configured as ${runtimeEnv.geminiModel}.`]
          : [...aiIssues, `Gemini model resolved to ${runtimeEnv.geminiModel}.`]
    }
  };
}
