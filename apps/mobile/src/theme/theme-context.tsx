import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { getBrandPack } from "@platform/brand";
import {
  createSurfaceTheme,
  DEFAULT_THEME_MODE,
  getNextThemeMode,
  resolveThemeMode,
  THEME_MODE_STORAGE_KEY
} from "@platform/ui";
import type { SurfaceThemeSnapshot, ThemeMode } from "@platform/types";

interface ThemeContextValue {
  mode: ThemeMode;
  theme: SurfaceThemeSnapshot;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

interface WebStorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

interface WebDocumentLike {
  documentElement: { dataset: Record<string, string> };
  body: { dataset: Record<string, string> };
}

type MobileGlobal = typeof globalThis & {
  localStorage?: WebStorageLike;
  document?: WebDocumentLike;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const mobileBrand = getBrandPack();
const mobileGlobal = globalThis as MobileGlobal;

function readInitialThemeMode() {
  if (typeof mobileGlobal.localStorage === "undefined") {
    return DEFAULT_THEME_MODE;
  }

  try {
    return resolveThemeMode(mobileGlobal.localStorage.getItem(THEME_MODE_STORAGE_KEY));
  } catch {
    return DEFAULT_THEME_MODE;
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(readInitialThemeMode);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;

    void AsyncStorage.getItem(THEME_MODE_STORAGE_KEY)
      .then((value) => {
        if (!active) {
          return;
        }

        setMode(resolveThemeMode(value));
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) {
          setHydrated(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    void AsyncStorage.setItem(THEME_MODE_STORAGE_KEY, mode).catch(() => undefined);

    try {
      mobileGlobal.localStorage?.setItem(THEME_MODE_STORAGE_KEY, mode);
    } catch {
      // Web persistence is best effort.
    }
  }, [hydrated, mode]);

  const theme = useMemo(() => createSurfaceTheme(mobileBrand, "mobile", mode), [mode]);

  useEffect(() => {
    if (typeof mobileGlobal.document === "undefined") {
      return;
    }

    mobileGlobal.document.documentElement.dataset.theme = mode;
    mobileGlobal.document.body.dataset.theme = mode;
  }, [mode]);

  return (
    <ThemeContext.Provider
      value={{
        mode,
        theme,
        setMode,
        toggleMode: () => setMode((current) => getNextThemeMode(current))
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeMode() {
  const value = useContext(ThemeContext);

  if (!value) {
    throw new Error("useThemeMode must be used inside ThemeProvider");
  }

  return value;
}
