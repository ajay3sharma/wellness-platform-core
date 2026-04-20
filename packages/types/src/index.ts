export type BrandKey = "moveyou";
export type BillingProviderId = "razorpay" | "stripe";
export type Market = "india" | "global";
export type UserPlan = "free" | "plus" | "pro";
export type Role = "user" | "coach" | "admin";
export type AppSurface = "web" | "admin" | "mobile" | "api";
export type WorkoutDifficulty = "beginner" | "intermediate" | "advanced";
export type WorkoutStatus = "draft" | "published";
export type ContentStatus = "draft" | "published";
export type WorkoutSessionStatus = "in_progress" | "completed";
export type AccountStatus = "active" | "pending_approval";
export type BillingInterval = "month" | "year";
export type CheckoutKind = "cart" | "subscription";
export type CheckoutSurface = "web" | "mobile";
export type OrderStatus = "pending" | "paid" | "cancelled" | "payment_failed";
export type SubscriptionStatus = "pending" | "active" | "cancelled" | "payment_failed";
export type AiProviderId = "gemini";
export type AiFeatureKey =
  | "user_workout_recommendation"
  | "user_reset_recommendation"
  | "admin_workout_draft"
  | "admin_relaxation_draft";
export type AiUsageStatus =
  | "succeeded"
  | "quota_blocked"
  | "provider_unavailable"
  | "disabled"
  | "failed";
export type AiApiErrorCode =
  | "AI_QUOTA_EXCEEDED"
  | "AI_TEMPORARILY_UNAVAILABLE"
  | "AI_DISABLED";
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
    checkoutBridgePath: string;
  };
  ai: {
    mode: "free_tier_only";
    fallback: "disable";
    userExperience: "recommendations_only";
    provider: AiProviderId;
    enabled: boolean;
    features: {
      adminDrafts: boolean;
      userWorkoutRecommendations: boolean;
      userResetRecommendations: boolean;
    };
  };
}

export interface CheckoutSession {
  id: string;
  provider: BillingProviderId;
  market: Market;
  currency: string;
  amountMinor: number;
  kind: CheckoutKind;
  expiresAt: string;
  target: CheckoutTarget;
  providerCheckoutUrl: string | null;
  razorpay:
    | {
        keyId: string;
        name: string;
        description: string;
        orderId: string | null;
        subscriptionId: string | null;
        prefill: {
          name: string;
          email: string;
        };
        callbackUrls: {
          success: string;
          cancel: string;
        };
      }
    | null;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  userPlan: UserPlan;
  description: string;
  billingInterval: BillingInterval;
  features: string[];
  status: ContentStatus;
  publishedAt: string | null;
  updatedAt: string;
  activePrices: SubscriptionPlanPrice[];
}

export interface CatalogProductPrice {
  id: string;
  market: Market;
  currency: string;
  amountMinor: number;
  isCurrent: boolean;
  createdAt: string;
}

export interface CatalogProductListItem {
  id: string;
  title: string;
  description: string;
  category: string | null;
  tags: string[];
  coverImageUrl: string | null;
  purchaseLabel: string | null;
  status: ContentStatus;
  publishedAt: string | null;
  updatedAt: string;
  activePrices: CatalogProductPrice[];
}

export type CatalogProductDetail = CatalogProductListItem;

export interface SaveCatalogProductRequest {
  title: string;
  description: string;
  category?: string | null;
  tags: string[];
  coverImageUrl?: string | null;
  purchaseLabel?: string | null;
  prices: Array<{
    market: Market;
    amountMinor: number;
    currency?: string;
  }>;
}

export interface SubscriptionPlanPrice {
  id: string;
  market: Market;
  currency: string;
  amountMinor: number;
  isCurrent: boolean;
  createdAt: string;
}

export type SubscriptionPlanDetail = SubscriptionPlan;

export interface SaveSubscriptionPlanRequest {
  name: string;
  description: string;
  userPlan: UserPlan;
  billingInterval: BillingInterval;
  features: string[];
  prices: Array<{
    market: Market;
    amountMinor: number;
    currency?: string;
  }>;
}

export interface CartItem {
  id: string;
  productId: string;
  productTitle: string;
  coverImageUrl: string | null;
  quantity: number;
  market: Market;
  currency: string;
  unitAmountMinor: number;
  totalAmountMinor: number;
}

export interface Cart {
  id: string;
  market: Market;
  currency: string;
  totalItems: number;
  subtotalAmountMinor: number;
  updatedAt: string;
  items: CartItem[];
}

export interface UpsertCartItemRequest {
  productId: string;
  quantity: number;
  market: Market;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface CheckoutTarget {
  surface: CheckoutSurface;
  market: Market;
}

export type CreateCartCheckoutRequest = CheckoutTarget;

export interface CreateSubscriptionCheckoutRequest extends CheckoutTarget {
  subscriptionPlanId: string;
}

export interface CheckoutLaunch {
  checkoutSessionId: string;
  provider: BillingProviderId;
  market: Market;
  launchUrl: string;
  expiresAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  title: string;
  quantity: number;
  unitAmountMinor: number;
  totalAmountMinor: number;
  coverImageUrl: string | null;
}

export interface OrderRecord {
  id: string;
  status: OrderStatus;
  provider: BillingProviderId;
  market: Market;
  currency: string;
  amountMinor: number;
  userId: string;
  userDisplayName: string | null;
  userEmail: string | null;
  checkoutSessionId: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface UserSubscription {
  id: string;
  subscriptionPlanId: string;
  planName: string;
  userPlan: UserPlan;
  billingInterval: BillingInterval;
  status: SubscriptionStatus;
  provider: BillingProviderId;
  market: Market;
  currency: string;
  amountMinor: number;
  userId: string;
  userDisplayName: string | null;
  userEmail: string | null;
  checkoutSessionId: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  activatedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EntitlementProductRecord {
  productId: string;
  title: string;
  orderId: string;
  grantedAt: string;
}

export interface EntitlementSnapshot {
  userPlan: UserPlan;
  activeSubscription: UserSubscription | null;
  ownedProducts: EntitlementProductRecord[];
}

export interface AiQuotaPolicy {
  maxRequestsPerDay: number;
  maxTokensPerDay: number;
}

export interface AdminAiQuotaPolicy {
  maxActionsPerDay: number;
  maxBrandActionsPerDay: number;
  mode: "free_tier_only";
  fallback: "disable";
}

export interface AiQuotaStatus {
  status: AiAvailabilityStatus;
  remainingRequests: number;
  remainingTokens: number;
}

export interface AiAvailability {
  feature: AiFeatureKey;
  status: AiAvailabilityStatus;
  code: AiApiErrorCode | null;
  message: string;
}

export interface UserAiQuotaStatus {
  provider: AiProviderId;
  plan: UserPlan;
  status: AiAvailabilityStatus;
  usedRequests: number;
  remainingRequests: number;
  usedTokens: number;
  remainingTokens: number;
  resetAt: string;
  features: Record<
    "user_workout_recommendation" | "user_reset_recommendation",
    AiAvailability
  >;
}

export interface AdminAiQuotaStatus {
  provider: AiProviderId;
  status: AiAvailabilityStatus;
  usedActions: number;
  remainingActions: number;
  usedBrandActions: number;
  remainingBrandActions: number;
  resetAt: string;
  features: Record<"admin_workout_draft" | "admin_relaxation_draft", AiAvailability>;
}

export interface CurrentUser {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  activeBrand: BrandKey;
  coachId: string | null;
}

export interface AccountProfile extends CurrentUser {
  status: AccountStatus;
  requestedRole: Role | null;
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

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  role: Role;
}

export interface RegisterResult {
  account: AccountProfile;
  session: AuthSession | null;
  message: string;
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

export interface PendingApprovalError extends ApiError {
  code: "ACCOUNT_PENDING_APPROVAL";
  status: 403;
  details?: ApiError["details"] & {
    requestedRole?: Role;
  };
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

export interface RelaxationStepRecord {
  id: string;
  title: string;
  instruction: string;
  durationSeconds: number;
  sequence: number;
}

export interface RelaxationTechniqueListItem {
  id: string;
  title: string;
  description: string;
  category: string | null;
  tags: string[];
  estimatedDurationMinutes: number;
  coverImageUrl: string | null;
  status: ContentStatus;
  publishedAt: string | null;
  updatedAt: string;
}

export interface RelaxationTechniqueDetail extends RelaxationTechniqueListItem {
  steps: RelaxationStepRecord[];
}

export interface SaveRelaxationTechniqueRequest {
  title: string;
  description: string;
  category?: string | null;
  tags: string[];
  estimatedDurationMinutes: number;
  coverImageUrl?: string | null;
  steps: Array<{
    title: string;
    instruction: string;
    durationSeconds: number;
    sequence: number;
  }>;
}

export interface MusicTrackListItem {
  id: string;
  title: string;
  description: string;
  category: string | null;
  tags: string[];
  artistName: string;
  durationSeconds: number;
  audioUrl: string;
  artworkUrl: string | null;
  status: ContentStatus;
  publishedAt: string | null;
  updatedAt: string;
}

export type MusicTrackDetail = MusicTrackListItem;

export interface SaveMusicTrackRequest {
  title: string;
  description: string;
  category?: string | null;
  tags: string[];
  artistName: string;
  durationSeconds: number;
  audioUrl: string;
  artworkUrl?: string | null;
}

export interface DailyQuoteRecord {
  id: string;
  entryDate: string;
  quoteText: string;
  author: string | null;
  status: ContentStatus;
  publishedAt: string | null;
  updatedAt: string;
}

export interface SaveDailyQuoteRequest {
  entryDate: string;
  quoteText: string;
  author?: string | null;
}

export interface DailyPanchangRecord {
  id: string;
  entryDate: string;
  headline: string;
  tithi: string;
  nakshatra: string;
  sunriseTime: string;
  sunsetTime: string;
  focusText: string;
  notes: string | null;
  status: ContentStatus;
  publishedAt: string | null;
  updatedAt: string;
}

export interface SaveDailyPanchangRequest {
  entryDate: string;
  headline: string;
  tithi: string;
  nakshatra: string;
  sunriseTime: string;
  sunsetTime: string;
  focusText: string;
  notes?: string | null;
}

export interface TodayWellnessSnapshot {
  resolvedDate: string;
  timeZone: string;
  quote: DailyQuoteRecord | null;
  panchang: DailyPanchangRecord | null;
}

export interface WorkoutRecommendationRequest {
  goal: string;
  availableMinutes: number;
  preferredDifficulty: WorkoutDifficulty;
  focusTags?: string[];
}

export interface WorkoutRecommendationItem {
  workoutId: string;
  explanation: string;
  workout: WorkoutListItem;
}

export interface WorkoutRecommendationResponse {
  provider: AiProviderId;
  generatedAt: string;
  quota: UserAiQuotaStatus;
  recommendations: WorkoutRecommendationItem[];
}

export type ResetRecommendationNeed = "calm" | "focus" | "sleep" | "recovery";

export interface ResetRecommendationRequest {
  intent: string;
  availableMinutes: number;
  need?: ResetRecommendationNeed | null;
}

export interface ResetRecommendationResponse {
  provider: AiProviderId;
  generatedAt: string;
  quota: UserAiQuotaStatus;
  relaxation:
    | {
        techniqueId: string;
        explanation: string;
        technique: RelaxationTechniqueListItem;
      }
    | null;
  music:
    | {
        trackId: string;
        explanation: string;
        track: MusicTrackListItem;
      }
    | null;
}

export interface WorkoutAssignmentRecord {
  id: string;
  workoutId: string;
  workoutTitle: string;
  userId: string;
  coachId: string;
  coachDisplayName: string;
  note: string | null;
  assignedAt: string;
  updatedAt: string;
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
  assignment: WorkoutAssignmentRecord | null;
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

export interface WorkoutDraftRequest {
  prompt: string;
  durationMinutes?: number | null;
  difficulty?: WorkoutDifficulty | null;
  category?: string | null;
  focusTags?: string[];
}

export interface WorkoutDraftResponse {
  provider: AiProviderId;
  generatedAt: string;
  quota: AdminAiQuotaStatus;
  draft: SaveWorkoutRequest;
}

export interface RelaxationDraftRequest {
  prompt: string;
  estimatedDurationMinutes?: number | null;
  category?: string | null;
  focusTags?: string[];
}

export interface RelaxationDraftResponse {
  provider: AiProviderId;
  generatedAt: string;
  quota: AdminAiQuotaStatus;
  draft: SaveRelaxationTechniqueRequest;
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

export interface UserDirectoryRecord {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  status: AccountStatus;
  requestedRole: Role | null;
  coachId: string | null;
  coachDisplayName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssignCoachRequest {
  coachId: string;
}

export interface CoachNoteRecord {
  id: string;
  userId: string;
  coachId: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaveCoachNoteRequest {
  note: string;
}

export interface CoachUserRecord {
  id: string;
  email: string;
  displayName: string;
  coachAssignmentId: string;
  assignedAt: string;
  assignedWorkouts: WorkoutAssignmentRecord[];
  latestCoachNote: CoachNoteRecord | null;
  lastCompletedSessionAt: string | null;
}

export interface AssignWorkoutRequest {
  workoutId: string;
  note?: string | null;
}

export interface CoachUserHistory {
  user: UserDirectoryRecord;
  assignments: WorkoutAssignmentRecord[];
  note: CoachNoteRecord | null;
  sessions: WorkoutSessionSummary[];
}
