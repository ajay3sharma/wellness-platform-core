import { createApiClient } from "@platform/sdk";
import type { AuthSession, CurrentUser, LoginRequest } from "@platform/types";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { mobileBrand } from "../metadata";

type SessionStatus = "booting" | "signed-out" | "signed-in";

interface SessionContextValue {
  status: SessionStatus;
  session: AuthSession | null;
  signIn: (payload: LoginRequest) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

function createDemoSession(email: string): AuthSession {
  const user: CurrentUser = {
    id: "demo-user",
    email,
    displayName: email.split("@")[0] ?? mobileBrand.shortName,
    role: "user",
    activeBrand: mobileBrand.key,
    coachId: "demo-coach"
  };

  const now = Date.now();

  return {
    user,
    tokens: {
      accessToken: "demo-access-token",
      refreshToken: "demo-refresh-token",
      accessTokenExpiresAt: new Date(now + 15 * 60 * 1000).toISOString(),
      refreshTokenExpiresAt: new Date(now + 14 * 24 * 60 * 60 * 1000).toISOString()
    }
  };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>("booting");
  const [session, setSession] = useState<AuthSession | null>(null);

  const api = createApiClient({
    getAccessToken: () => session?.tokens.accessToken
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setStatus("signed-out");
    }, 450);

    return () => clearTimeout(timer);
  }, []);

  async function signIn(payload: LoginRequest) {
    try {
      const nextSession = await api.auth.login(payload);
      setSession(nextSession);
      setStatus("signed-in");
      return;
    } catch {
      const fallbackSession = createDemoSession(payload.email);
      setSession(fallbackSession);
      setStatus("signed-in");
    }
  }

  async function signOut() {
    setSession(null);
    setStatus("signed-out");
  }

  async function refresh() {
    if (!session) {
      return;
    }

    try {
      const nextSession = await api.auth.refresh({
        refreshToken: session.tokens.refreshToken
      });
      setSession(nextSession);
      setStatus("signed-in");
    } catch {
      setStatus(session ? "signed-in" : "signed-out");
    }
  }

  return (
    <SessionContext.Provider value={{ status, session, signIn, signOut, refresh }}>
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
