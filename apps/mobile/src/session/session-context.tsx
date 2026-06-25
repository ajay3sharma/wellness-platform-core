import { createApiClient } from "@platform/sdk";
import type {
  AuthSession,
  LoginRequest,
  RegisterRequest,
  RegisterResult
} from "@platform/types";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { bootstrapSession } from "./bootstrap";

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
const WEB_SESSION_STORAGE_KEY = "platform.mobile.session";

interface SessionStorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

function getWebSessionStorage(): SessionStorageLike | null {
  const storageHost = globalThis as typeof globalThis & {
    sessionStorage?: SessionStorageLike;
  };

  return storageHost.sessionStorage ?? null;
}

function readStoredSession(): AuthSession | null {
  const storage = getWebSessionStorage();

  if (!storage) {
    return null;
  }

  try {
    const serializedSession = storage.getItem(WEB_SESSION_STORAGE_KEY);

    if (!serializedSession) {
      return null;
    }

    return JSON.parse(serializedSession) as AuthSession;
  } catch {
    return null;
  }
}

function writeStoredSession(session: AuthSession | null) {
  const storage = getWebSessionStorage();

  if (!storage) {
    return;
  }

  try {
    if (session) {
      storage.setItem(WEB_SESSION_STORAGE_KEY, JSON.stringify(session));
      return;
    }

    storage.removeItem(WEB_SESSION_STORAGE_KEY);
  } catch {
    // Session persistence is best effort for Expo web and tests.
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
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
    let active = true;

    void (async () => {
      const storedSession = readStoredSession();

      if (!storedSession?.tokens.accessToken) {
        if (!active) {
          return;
        }

        setSession(null);
        setStatus("signed-out");
        return;
      }

      const restoredSession = await bootstrapSession(storedSession.tokens.accessToken);

      if (!active) {
        return;
      }

      if (!restoredSession) {
        writeStoredSession(null);
        setSession(null);
        setStatus("signed-out");
        return;
      }

      setSession(storedSession);
      setStatus("signed-in");
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (status === "booting") {
      return;
    }

    writeStoredSession(session);
  }, [session, status]);

  async function signIn(payload: LoginRequest) {
    const nextSession = await createApiClient().auth.login(payload);
    writeStoredSession(nextSession);
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
      writeStoredSession(result.session);
      setSession(result.session);
      setStatus("signed-in");
    } else {
      writeStoredSession(null);
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

    writeStoredSession(null);
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
      writeStoredSession(nextSession);
      setSession(nextSession);
      setStatus("signed-in");
    } catch {
      writeStoredSession(null);
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
