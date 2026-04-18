import { createApiClient } from "@platform/sdk";
import type {
  AuthSession,
  LoginRequest,
  RegisterRequest,
  RegisterResult
} from "@platform/types";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type SessionStatus = "booting" | "signed-out" | "signed-in";

interface SessionContextValue {
  status: SessionStatus;
  session: AuthSession | null;
  signIn: (payload: LoginRequest) => Promise<AuthSession>;
  registerUser: (payload: Omit<RegisterRequest, "role">) => Promise<RegisterResult>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>("signed-out");
  const [session, setSession] = useState<AuthSession | null>(null);
  const api = useMemo(
    () =>
      createApiClient({
        getAccessToken: () => session?.tokens.accessToken
      }),
    [session]
  );

  async function signIn(payload: LoginRequest) {
    const nextSession = await createApiClient().auth.login(payload);
    setSession(nextSession);
    setStatus("signed-in");
    return nextSession;
  }

  async function registerUser(payload: Omit<RegisterRequest, "role">) {
    const result = await createApiClient().auth.register({
      ...payload,
      role: "user"
    });

    if (result.session) {
      setSession(result.session);
      setStatus("signed-in");
    } else {
      setSession(null);
      setStatus("signed-out");
    }

    return result;
  }

  async function signOut() {
    if (session) {
      await api.auth
        .logout({
          refreshToken: session.tokens.refreshToken
        })
        .catch(() => undefined);
    }

    setSession(null);
    setStatus("signed-out");
  }

  async function refresh() {
    if (!session) {
      setStatus("signed-out");
      return;
    }

    try {
      const nextSession = await createApiClient().auth.refresh({
        refreshToken: session.tokens.refreshToken
      });
      setSession(nextSession);
      setStatus("signed-in");
    } catch {
      setSession(null);
      setStatus("signed-out");
    }
  }

  return (
    <SessionContext.Provider value={{ status, session, signIn, registerUser, signOut, refresh }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const value = useContext(SessionContext);

  if (!value) {
    throw new Error("useSession must be used inside SessionProvider");
  }

  return value;
}
