import { platformConfig } from "@platform/config";
import type {
  ApiError,
  AuthSession,
  CompleteWorkoutSessionRequest,
  LoginRequest,
  LogoutRequest,
  SaveWorkoutRequest,
  RefreshSessionRequest,
  StartWorkoutSessionRequest,
  ServiceHealth
  ,
  UpdateWorkoutSessionRequest,
  WorkoutDetail,
  WorkoutListItem,
  WorkoutSessionRecord,
  WorkoutSessionSummary
} from "@platform/types";

export interface ApiClientOptions {
  baseUrl?: string;
  fetcher?: typeof globalThis.fetch;
  getAccessToken?: () => string | undefined;
}

export interface ApiClient {
  health: () => Promise<ServiceHealth>;
  auth: {
    login: (payload: LoginRequest) => Promise<AuthSession>;
    refresh: (payload: RefreshSessionRequest) => Promise<AuthSession>;
    logout: (payload: LogoutRequest) => Promise<void>;
    me: () => Promise<AuthSession["user"]>;
  };
  workouts: {
    list: () => Promise<WorkoutListItem[]>;
    detail: (workoutId: string) => Promise<WorkoutDetail>;
  };
  adminWorkouts: {
    create: (payload: SaveWorkoutRequest) => Promise<WorkoutDetail>;
    update: (workoutId: string, payload: SaveWorkoutRequest) => Promise<WorkoutDetail>;
    publish: (workoutId: string) => Promise<WorkoutDetail>;
    unpublish: (workoutId: string) => Promise<WorkoutDetail>;
  };
  workoutSessions: {
    listMine: () => Promise<WorkoutSessionSummary[]>;
    start: (payload: StartWorkoutSessionRequest) => Promise<WorkoutSessionRecord>;
    update: (
      sessionId: string,
      payload: UpdateWorkoutSessionRequest
    ) => Promise<WorkoutSessionRecord>;
    complete: (
      sessionId: string,
      payload: CompleteWorkoutSessionRequest
    ) => Promise<WorkoutSessionRecord>;
  };
}

async function request<TResponse>(
  path: string,
  init: globalThis.RequestInit,
  options: Required<ApiClientOptions>
): Promise<TResponse> {
  const headers = new globalThis.Headers(init.headers);
  headers.set("content-type", "application/json");

  const accessToken = options.getAccessToken();
  if (accessToken) {
    headers.set("authorization", `Bearer ${accessToken}`);
  }

  const response = await options.fetcher(`${options.baseUrl}${path}`, {
    ...init,
    headers
  });

  if (!response.ok) {
    const fallbackError: ApiError = {
      code: "UNEXPECTED_API_ERROR",
      message: "Unexpected API error.",
      status: response.status
    };

    throw (await response.json().catch(() => fallbackError)) as ApiError;
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
}

export function createApiClient(options: ApiClientOptions = {}): ApiClient {
  const resolvedOptions: Required<ApiClientOptions> = {
    baseUrl: options.baseUrl ?? `${platformConfig.services.api.publicUrl}${platformConfig.services.api.basePath}`,
    fetcher: options.fetcher ?? fetch,
    getAccessToken: options.getAccessToken ?? (() => undefined)
  };

  return {
    health: () => request<ServiceHealth>("/health", { method: "GET" }, resolvedOptions),
    auth: {
      login: (payload) =>
        request<AuthSession>(
          "/auth/login",
          {
            method: "POST",
            body: JSON.stringify(payload)
          },
          resolvedOptions
        ),
      refresh: (payload) =>
        request<AuthSession>(
          "/auth/refresh",
          {
            method: "POST",
            body: JSON.stringify(payload)
          },
          resolvedOptions
        ),
      logout: (payload) =>
        request<void>(
          "/auth/logout",
          {
            method: "POST",
            body: JSON.stringify(payload)
          },
          resolvedOptions
        ),
      me: () => request<AuthSession["user"]>("/auth/me", { method: "GET" }, resolvedOptions)
    },
    workouts: {
      list: () => request<WorkoutListItem[]>("/workouts", { method: "GET" }, resolvedOptions),
      detail: (workoutId) =>
        request<WorkoutDetail>(`/workouts/${workoutId}`, { method: "GET" }, resolvedOptions)
    },
    adminWorkouts: {
      create: (payload) =>
        request<WorkoutDetail>(
          "/admin/workouts",
          {
            method: "POST",
            body: JSON.stringify(payload)
          },
          resolvedOptions
        ),
      update: (workoutId, payload) =>
        request<WorkoutDetail>(
          `/admin/workouts/${workoutId}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload)
          },
          resolvedOptions
        ),
      publish: (workoutId) =>
        request<WorkoutDetail>(
          `/admin/workouts/${workoutId}/publish`,
          {
            method: "POST"
          },
          resolvedOptions
        ),
      unpublish: (workoutId) =>
        request<WorkoutDetail>(
          `/admin/workouts/${workoutId}/unpublish`,
          {
            method: "POST"
          },
          resolvedOptions
        )
    },
    workoutSessions: {
      listMine: () =>
        request<WorkoutSessionSummary[]>("/workout-sessions/me", { method: "GET" }, resolvedOptions),
      start: (payload) =>
        request<WorkoutSessionRecord>(
          "/workout-sessions",
          {
            method: "POST",
            body: JSON.stringify(payload)
          },
          resolvedOptions
        ),
      update: (sessionId, payload) =>
        request<WorkoutSessionRecord>(
          `/workout-sessions/${sessionId}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload)
          },
          resolvedOptions
        ),
      complete: (sessionId, payload) =>
        request<WorkoutSessionRecord>(
          `/workout-sessions/${sessionId}/complete`,
          {
            method: "POST",
            body: JSON.stringify(payload)
          },
          resolvedOptions
        )
    }
  };
}
