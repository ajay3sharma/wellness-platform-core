"use client";

import { createApiClient } from "@platform/sdk";
import type { AuthSession, LoginRequest, RegisterResult } from "@platform/types";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

type SessionStatus = "booting" | "signed-out" | "signed-in";

interface WebSessionContextValue {
  status: SessionStatus;
  session: AuthSession | null;
  signIn: (payload: LoginRequest) => Promise<AuthSession>;
  registerUser: (payload: {
    email: string;
    password: string;
    displayName: string;
  }) => Promise<RegisterResult>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const storageKey = "platform-web-session";
const SessionContext = createContext<WebSessionContextValue | null>(null);

function readStoredSession(): AuthSession | null {
  if (typeof globalThis.window === "undefined") {
    return null;
  }

  const raw = globalThis.window.localStorage.getItem(storageKey);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    globalThis.window.localStorage.removeItem(storageKey);
    return null;
  }
}

function persistSession(session: AuthSession | null) {
  if (typeof globalThis.window === "undefined") {
    return;
  }

  if (!session) {
    globalThis.window.localStorage.removeItem(storageKey);
    return;
  }

  globalThis.window.localStorage.setItem(storageKey, JSON.stringify(session));
}

export function WebSessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>("booting");
  const [session, setSession] = useState<AuthSession | null>(null);
  const api = useMemo(
    () =>
      createApiClient({
        getAccessToken: () => session?.tokens.accessToken
      }),
    [session]
  );

  useEffect(() => {
    const stored = readStoredSession();

    if (!stored) {
      setStatus("signed-out");
      return;
    }

    void (async () => {
      try {
        const nextSession = await createApiClient().auth.refresh({
          refreshToken: stored.tokens.refreshToken
        });
        setSession(nextSession);
        persistSession(nextSession);
        setStatus("signed-in");
      } catch {
        persistSession(null);
        setSession(null);
        setStatus("signed-out");
      }
    })();
  }, []);

  async function signIn(payload: LoginRequest) {
    const nextSession = await createApiClient().auth.login(payload);
    setSession(nextSession);
    persistSession(nextSession);
    setStatus("signed-in");
    return nextSession;
  }

  async function registerUser(payload: {
    email: string;
    password: string;
    displayName: string;
  }) {
    const result = await createApiClient().auth.register({
      ...payload,
      role: "user"
    });

    if (result.session) {
      setSession(result.session);
      persistSession(result.session);
      setStatus("signed-in");
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
    persistSession(null);
    setStatus("signed-out");
  }

  async function refresh() {
    if (!session) {
      setSession(null);
      setStatus("signed-out");
      return;
    }

    try {
      const nextSession = await createApiClient().auth.refresh({
        refreshToken: session.tokens.refreshToken
      });
      setSession(nextSession);
      persistSession(nextSession);
      setStatus("signed-in");
    } catch {
      setSession(null);
      persistSession(null);
      setStatus("signed-out");
    }
  }

  return (
    <SessionContext.Provider value={{ status, session, signIn, registerUser, signOut, refresh }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useWebSession() {
  const value = useContext(SessionContext);

  if (!value) {
    throw new Error("useWebSession must be used inside WebSessionProvider");
  }

  return value;
}
