export type BrandKey = "moveyou";
export type BillingProviderId = "razorpay" | "stripe";
export type Market = "india" | "global";
export type UserPlan = "free" | "plus" | "pro";
export type Role = "user" | "coach" | "admin";
export type AppSurface = "web" | "admin" | "mobile" | "api";
export type WorkoutDifficulty = "beginner" | "intermediate" | "advanced";
export type WorkoutStatus = "draft" | "published";
export type WorkoutSessionStatus = "in_progress" | "completed";
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
  appMetadata: Record<
    AppSurface,
    {
      headline: string;
      subheadline: string;
      description: string;
    }
  >;
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
  services: {
    api: {
      port: number;
      basePath: string;
      publicUrl: string;
    };
    web: {
      port: number;
      publicUrl: string;
    };
    admin: {
      port: number;
      publicUrl: string;
    };
    mobile: {
      scheme: string;
      apiUrl: string;
    };
  };
  auth: {
    issuer: string;
    audience: string;
    accessTokenTtlMinutes: number;
    refreshTokenTtlDays: number;
  };
  data: {
    provider: "postgresql";
    client: "prisma";
    databaseUrlEnvVar: "DATABASE_URL";
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

export interface CurrentUser {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  activeBrand: BrandKey;
  coachId: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
}

export interface AuthSession {
  user: CurrentUser;
  tokens: AuthTokens;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshSessionRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface ApiError {
  code: string;
  message: string;
  status: number;
  traceId?: string;
  details?: Record<string, unknown>;
}

export interface ServiceHealth {
  service: string;
  status: "ok" | "degraded";
  version: string;
  environment: string;
  timestamp: string;
  activeBrand: BrandKey;
}

export interface AppMetadataSnapshot {
  surface: AppSurface;
  appName: string;
  headline: string;
  subheadline: string;
  description: string;
  supportEmail: string;
}

export interface WorkoutExerciseRecord {
  id: string;
  name: string;
  instruction: string | null;
  repTarget: string | null;
  timeTargetSeconds: number | null;
  distanceTargetMeters: number | null;
  restSeconds: number | null;
  sequence: number;
}

export interface WorkoutListItem {
  id: string;
  title: string;
  description: string;
  difficulty: WorkoutDifficulty;
  durationMinutes: number;
  category: string | null;
  tags: string[];
  status: WorkoutStatus;
  exerciseCount: number;
  publishedAt: string | null;
  updatedAt: string;
}

export interface WorkoutDetail extends WorkoutListItem {
  exercises: WorkoutExerciseRecord[];
}

export interface SaveWorkoutRequest {
  title: string;
  description: string;
  difficulty: WorkoutDifficulty;
  durationMinutes: number;
  category?: string | null;
  tags: string[];
  exercises: Array<{
    name: string;
    instruction?: string | null;
    repTarget?: string | null;
    timeTargetSeconds?: number | null;
    distanceTargetMeters?: number | null;
    restSeconds?: number | null;
    sequence: number;
  }>;
}

export interface WorkoutSessionExerciseRecord {
  id: string;
  workoutExerciseId: string | null;
  name: string;
  instruction: string | null;
  repTarget: string | null;
  timeTargetSeconds: number | null;
  distanceTargetMeters: number | null;
  restSeconds: number | null;
  sequence: number;
  completed: boolean;
  notes: string | null;
}

export interface WorkoutSessionRecord {
  id: string;
  workoutId: string;
  workoutTitle: string;
  status: WorkoutSessionStatus;
  notes: string | null;
  startedAt: string;
  completedAt: string | null;
  updatedAt: string;
  exercises: WorkoutSessionExerciseRecord[];
}

export interface WorkoutSessionSummary {
  id: string;
  workoutId: string;
  workoutTitle: string;
  status: WorkoutSessionStatus;
  notes: string | null;
  startedAt: string;
  completedAt: string | null;
  updatedAt: string;
  completedExercises: number;
  totalExercises: number;
}

export interface StartWorkoutSessionRequest {
  workoutId: string;
}

export interface UpdateWorkoutSessionRequest {
  notes?: string | null;
  exercises?: Array<{
    id: string;
    completed?: boolean;
    notes?: string | null;
  }>;
}

export interface CompleteWorkoutSessionRequest {
  notes?: string | null;
  exercises?: Array<{
    id: string;
    completed?: boolean;
    notes?: string | null;
  }>;
}
