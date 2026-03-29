export type BrandKey = "moveyou";
export type BillingProviderId = "razorpay" | "stripe";
export type Market = "india" | "global";
export type UserPlan = "free" | "plus" | "pro";
export type AiAvailabilityStatus =
  | "available"
  | "quota_exceeded"
  | "temporarily_unavailable"
  | "disabled";

export interface BrandPack {
  key: BrandKey;
  productName: string;
  shortName: string;
  tagline: string;
  description: string;
  supportEmail: string;
  domains: {
    web: string;
    admin: string;
    api: string;
    mobileDeepLink: string;
  };
  theme: {
    primary: string;
    secondary: string;
    accent: string;
    surface: string;
  };
  assets: {
    logoText: string;
    logoMark: string;
    favicon: string;
    appIcon: string;
  };
  metadata: {
    titleTemplate: string;
    seoTitle: string;
    seoDescription: string;
    legalName: string;
  };
  billing: {
    defaultMarket: Market;
    providers: Record<Market, BillingProviderId>;
    currency: Record<Market, string>;
  };
  ai: {
    adminDailyActions: number;
    brandDailyActions: number;
    userDailyRequestLimits: Record<UserPlan, number>;
    userDailyTokenLimits: Record<UserPlan, number>;
  };
}

export interface PlatformConfig {
  repo: {
    slug: string;
    defaultBranch: string;
  };
  billing: {
    defaultMarket: Market;
    enabledProviders: BillingProviderId[];
  };
  ai: {
    mode: "free_tier_only";
    fallback: "disable";
    userExperience: "recommendations_only";
  };
}

export interface CheckoutSession {
  provider: BillingProviderId;
  market: Market;
  currency: string;
  amountMinor: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  userPlan: UserPlan;
  billingProvider: BillingProviderId;
}

export interface AiQuotaPolicy {
  maxRequestsPerDay: number;
  maxTokensPerDay: number;
}

export interface AiQuotaStatus {
  status: AiAvailabilityStatus;
  remainingRequests: number;
  remainingTokens: number;
}

