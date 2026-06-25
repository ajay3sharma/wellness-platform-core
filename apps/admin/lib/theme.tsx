"use client";

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
  createThemeCssVariables,
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

const ThemeContext = createContext<ThemeContextValue | null>(null);
const brand = getBrandPack();

function readStoredThemeMode() {
  if (typeof globalThis.window === "undefined") {
    return DEFAULT_THEME_MODE;
  }

  try {
    return resolveThemeMode(globalThis.window.localStorage.getItem(THEME_MODE_STORAGE_KEY));
  } catch {
    return DEFAULT_THEME_MODE;
  }
}

function applyTheme(theme: SurfaceThemeSnapshot) {
  if (typeof globalThis.document === "undefined") {
    return;
  }

  const root = globalThis.document.documentElement;
  const body = globalThis.document.body;
  const variables = createThemeCssVariables(theme);

  root.dataset.theme = theme.mode;
  body.dataset.theme = theme.mode;

  for (const [key, value] of Object.entries(variables)) {
    root.style.setProperty(key, value);
  }
}

export function AdminThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(readStoredThemeMode);
  const theme = useMemo(() => createSurfaceTheme(brand, "admin", mode), [mode]);

  useEffect(() => {
    applyTheme(theme);

    try {
      globalThis.window.localStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
    } catch {
      // Theme persistence is best effort.
    }
  }, [mode, theme]);

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

export function useAdminThemeMode() {
  const value = useContext(ThemeContext);

  if (!value) {
    throw new Error("useAdminThemeMode must be used inside AdminThemeProvider");
  }

  return value;
}
