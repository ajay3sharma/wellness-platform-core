import { platformConfig } from "@platform/config";
import type {
  ApiError,
  AssignCoachRequest,
  AssignWorkoutRequest,
  AuthSession,
  CoachUserHistory,
  CoachUserRecord,
  CompleteWorkoutSessionRequest,
  CurrentUser,
  DailyPanchangRecord,
  DailyQuoteRecord,
  LoginRequest,
  MusicTrackDetail,
  MusicTrackListItem,
  LogoutRequest,
  RelaxationTechniqueDetail,
  RelaxationTechniqueListItem,
  RegisterRequest,
  RegisterResult,
  RefreshSessionRequest,
  SaveDailyPanchangRequest,
  SaveDailyQuoteRequest,
  SaveMusicTrackRequest,
  SaveRelaxationTechniqueRequest,
  SaveCoachNoteRequest,
  SaveWorkoutRequest,
  ServiceHealth,
  StartWorkoutSessionRequest,
  TodayWellnessSnapshot,
  UpdateWorkoutSessionRequest,
  UserDirectoryRecord,
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
    register: (payload: RegisterRequest) => Promise<RegisterResult>;
    login: (payload: LoginRequest) => Promise<AuthSession>;
    refresh: (payload: RefreshSessionRequest) => Promise<AuthSession>;
    logout: (payload: LogoutRequest) => Promise<void>;
    me: () => Promise<CurrentUser>;
  };
  workouts: {
    list: () => Promise<WorkoutListItem[]>;
    detail: (workoutId: string) => Promise<WorkoutDetail>;
  };
  wellness: {
    listRelaxation: () => Promise<RelaxationTechniqueListItem[]>;
    detailRelaxation: (techniqueId: string) => Promise<RelaxationTechniqueDetail>;
    listMusic: () => Promise<MusicTrackListItem[]>;
    detailMusic: (trackId: string) => Promise<MusicTrackDetail>;
    daily: (timeZone: string) => Promise<TodayWellnessSnapshot>;
  };
  adminWorkouts: {
    list: () => Promise<WorkoutListItem[]>;
    create: (payload: SaveWorkoutRequest) => Promise<WorkoutDetail>;
    update: (workoutId: string, payload: SaveWorkoutRequest) => Promise<WorkoutDetail>;
    publish: (workoutId: string) => Promise<WorkoutDetail>;
    unpublish: (workoutId: string) => Promise<WorkoutDetail>;
  };
  workoutSessions: {
    listMine: () => Promise<WorkoutSessionSummary[]>;
    detail: (sessionId: string) => Promise<WorkoutSessionRecord>;
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
  adminUsers: {
    list: () => Promise<UserDirectoryRecord[]>;
    approveRole: (userId: string) => Promise<UserDirectoryRecord>;
    assignCoach: (userId: string, payload: AssignCoachRequest) => Promise<UserDirectoryRecord>;
  };
  adminWellness: {
    relaxation: {
      list: () => Promise<RelaxationTechniqueListItem[]>;
      detail: (techniqueId: string) => Promise<RelaxationTechniqueDetail>;
      create: (payload: SaveRelaxationTechniqueRequest) => Promise<RelaxationTechniqueDetail>;
      update: (
        techniqueId: string,
        payload: SaveRelaxationTechniqueRequest
      ) => Promise<RelaxationTechniqueDetail>;
      publish: (techniqueId: string) => Promise<RelaxationTechniqueDetail>;
      unpublish: (techniqueId: string) => Promise<RelaxationTechniqueDetail>;
    };
    music: {
      list: () => Promise<MusicTrackListItem[]>;
      create: (payload: SaveMusicTrackRequest) => Promise<MusicTrackDetail>;
      update: (trackId: string, payload: SaveMusicTrackRequest) => Promise<MusicTrackDetail>;
      publish: (trackId: string) => Promise<MusicTrackDetail>;
      unpublish: (trackId: string) => Promise<MusicTrackDetail>;
    };
    dailyQuotes: {
      list: () => Promise<DailyQuoteRecord[]>;
      create: (payload: SaveDailyQuoteRequest) => Promise<DailyQuoteRecord>;
      update: (quoteId: string, payload: SaveDailyQuoteRequest) => Promise<DailyQuoteRecord>;
      publish: (quoteId: string) => Promise<DailyQuoteRecord>;
      unpublish: (quoteId: string) => Promise<DailyQuoteRecord>;
    };
    panchang: {
      list: () => Promise<DailyPanchangRecord[]>;
      create: (payload: SaveDailyPanchangRequest) => Promise<DailyPanchangRecord>;
      update: (
        entryId: string,
        payload: SaveDailyPanchangRequest
      ) => Promise<DailyPanchangRecord>;
      publish: (entryId: string) => Promise<DailyPanchangRecord>;
      unpublish: (entryId: string) => Promise<DailyPanchangRecord>;
    };
  };
  coachUsers: {
    list: () => Promise<CoachUserRecord[]>;
    assignWorkout: (userId: string, payload: AssignWorkoutRequest) => Promise<void>;
    history: (userId: string) => Promise<CoachUserHistory>;
    saveNote: (userId: string, payload: SaveCoachNoteRequest) => Promise<CoachUserHistory>;
  };
}

async function request<TResponse>(
  path: string,
  init: globalThis.RequestInit,
  options: Required<ApiClientOptions>
): Promise<TResponse> {
  const headers = new globalThis.Headers(init.headers);

  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

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
  const fetcher: typeof globalThis.fetch = options.fetcher
    ? ((input, init) => options.fetcher!.call(globalThis, input, init)) as typeof globalThis.fetch
    : ((input, init) => globalThis.fetch(input, init)) as typeof globalThis.fetch;

  const resolvedOptions: Required<ApiClientOptions> = {
    baseUrl: options.baseUrl ?? `${platformConfig.services.api.publicUrl}${platformConfig.services.api.basePath}`,
    fetcher,
    getAccessToken: options.getAccessToken ?? (() => undefined)
  };

  return {
    health: () => request<ServiceHealth>("/health", { method: "GET" }, resolvedOptions),
    auth: {
      register: (payload) =>
        request<RegisterResult>(
          "/auth/register",
          {
            method: "POST",
            body: JSON.stringify(payload)
          },
          resolvedOptions
        ),
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
      me: () => request<CurrentUser>("/auth/me", { method: "GET" }, resolvedOptions)
    },
    workouts: {
      list: () => request<WorkoutListItem[]>("/workouts", { method: "GET" }, resolvedOptions),
      detail: (workoutId) =>
        request<WorkoutDetail>(`/workouts/${workoutId}`, { method: "GET" }, resolvedOptions)
    },
    wellness: {
      listRelaxation: () =>
        request<RelaxationTechniqueListItem[]>(
          "/wellness/relaxation",
          { method: "GET" },
          resolvedOptions
        ),
      detailRelaxation: (techniqueId) =>
        request<RelaxationTechniqueDetail>(
          `/wellness/relaxation/${techniqueId}`,
          { method: "GET" },
          resolvedOptions
        ),
      listMusic: () =>
        request<MusicTrackListItem[]>("/wellness/music", { method: "GET" }, resolvedOptions),
      detailMusic: (trackId) =>
        request<MusicTrackDetail>(`/wellness/music/${trackId}`, { method: "GET" }, resolvedOptions),
      daily: (timeZone) =>
        request<TodayWellnessSnapshot>(
          `/wellness/daily?timeZone=${encodeURIComponent(timeZone)}`,
          { method: "GET" },
          resolvedOptions
        )
    },
    adminWorkouts: {
      list: () => request<WorkoutListItem[]>("/admin/workouts", { method: "GET" }, resolvedOptions),
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
      detail: (sessionId) =>
        request<WorkoutSessionRecord>(
          `/workout-sessions/${sessionId}`,
          {
            method: "GET"
          },
          resolvedOptions
        ),
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
    },
    adminUsers: {
      list: () => request<UserDirectoryRecord[]>("/admin/users", { method: "GET" }, resolvedOptions),
      approveRole: (userId) =>
        request<UserDirectoryRecord>(
          `/admin/users/${userId}/approve-role`,
          {
            method: "POST"
          },
          resolvedOptions
        ),
      assignCoach: (userId, payload) =>
        request<UserDirectoryRecord>(
          `/admin/users/${userId}/assign-coach`,
          {
            method: "POST",
            body: JSON.stringify(payload)
          },
          resolvedOptions
        )
    },
    adminWellness: {
      relaxation: {
        list: () =>
          request<RelaxationTechniqueListItem[]>(
            "/admin/wellness/relaxation",
            { method: "GET" },
            resolvedOptions
          ),
        detail: (techniqueId) =>
          request<RelaxationTechniqueDetail>(
            `/admin/wellness/relaxation/${techniqueId}`,
            { method: "GET" },
            resolvedOptions
          ),
        create: (payload) =>
          request<RelaxationTechniqueDetail>(
            "/admin/wellness/relaxation",
            {
              method: "POST",
              body: JSON.stringify(payload)
            },
            resolvedOptions
          ),
        update: (techniqueId, payload) =>
          request<RelaxationTechniqueDetail>(
            `/admin/wellness/relaxation/${techniqueId}`,
            {
              method: "PATCH",
              body: JSON.stringify(payload)
            },
            resolvedOptions
          ),
        publish: (techniqueId) =>
          request<RelaxationTechniqueDetail>(
            `/admin/wellness/relaxation/${techniqueId}/publish`,
            {
              method: "POST"
            },
            resolvedOptions
          ),
        unpublish: (techniqueId) =>
          request<RelaxationTechniqueDetail>(
            `/admin/wellness/relaxation/${techniqueId}/unpublish`,
            {
              method: "POST"
            },
            resolvedOptions
          )
      },
      music: {
        list: () =>
          request<MusicTrackListItem[]>(
            "/admin/wellness/music",
            { method: "GET" },
            resolvedOptions
          ),
        create: (payload) =>
          request<MusicTrackDetail>(
            "/admin/wellness/music",
            {
              method: "POST",
              body: JSON.stringify(payload)
            },
            resolvedOptions
          ),
        update: (trackId, payload) =>
          request<MusicTrackDetail>(
            `/admin/wellness/music/${trackId}`,
            {
              method: "PATCH",
              body: JSON.stringify(payload)
            },
            resolvedOptions
          ),
        publish: (trackId) =>
          request<MusicTrackDetail>(
            `/admin/wellness/music/${trackId}/publish`,
            {
              method: "POST"
            },
            resolvedOptions
          ),
        unpublish: (trackId) =>
          request<MusicTrackDetail>(
            `/admin/wellness/music/${trackId}/unpublish`,
            {
              method: "POST"
            },
            resolvedOptions
          )
      },
      dailyQuotes: {
        list: () =>
          request<DailyQuoteRecord[]>(
            "/admin/wellness/daily-quotes",
            { method: "GET" },
            resolvedOptions
          ),
        create: (payload) =>
          request<DailyQuoteRecord>(
            "/admin/wellness/daily-quotes",
            {
              method: "POST",
              body: JSON.stringify(payload)
            },
            resolvedOptions
          ),
        update: (quoteId, payload) =>
          request<DailyQuoteRecord>(
            `/admin/wellness/daily-quotes/${quoteId}`,
            {
              method: "PATCH",
              body: JSON.stringify(payload)
            },
            resolvedOptions
          ),
        publish: (quoteId) =>
          request<DailyQuoteRecord>(
            `/admin/wellness/daily-quotes/${quoteId}/publish`,
            {
              method: "POST"
            },
            resolvedOptions
          ),
        unpublish: (quoteId) =>
          request<DailyQuoteRecord>(
            `/admin/wellness/daily-quotes/${quoteId}/unpublish`,
            {
              method: "POST"
            },
            resolvedOptions
          )
      },
      panchang: {
        list: () =>
          request<DailyPanchangRecord[]>(
            "/admin/wellness/panchang",
            { method: "GET" },
            resolvedOptions
          ),
        create: (payload) =>
          request<DailyPanchangRecord>(
            "/admin/wellness/panchang",
            {
              method: "POST",
              body: JSON.stringify(payload)
            },
            resolvedOptions
          ),
        update: (entryId, payload) =>
          request<DailyPanchangRecord>(
            `/admin/wellness/panchang/${entryId}`,
            {
              method: "PATCH",
              body: JSON.stringify(payload)
            },
            resolvedOptions
          ),
        publish: (entryId) =>
          request<DailyPanchangRecord>(
            `/admin/wellness/panchang/${entryId}/publish`,
            {
              method: "POST"
            },
            resolvedOptions
          ),
        unpublish: (entryId) =>
          request<DailyPanchangRecord>(
            `/admin/wellness/panchang/${entryId}/unpublish`,
            {
              method: "POST"
            },
            resolvedOptions
          )
      }
    },
    coachUsers: {
      list: () => request<CoachUserRecord[]>("/coach/users", { method: "GET" }, resolvedOptions),
      assignWorkout: (userId, payload) =>
        request<void>(
          `/coach/users/${userId}/assign-workout`,
          {
            method: "POST",
            body: JSON.stringify(payload)
          },
          resolvedOptions
        ),
      history: (userId) =>
        request<CoachUserHistory>(
          `/coach/users/${userId}/workout-history`,
          {
            method: "GET"
          },
          resolvedOptions
        ),
      saveNote: (userId, payload) =>
        request<CoachUserHistory>(
          `/coach/users/${userId}/notes`,
          {
            method: "POST",
            body: JSON.stringify(payload)
          },
          resolvedOptions
        )
    }
  };
}
