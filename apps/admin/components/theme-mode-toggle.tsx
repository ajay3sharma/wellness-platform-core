"use client";

import { useAdminThemeMode } from "../lib/theme";

export function ThemeModeToggle() {
  const { mode, setMode } = useAdminThemeMode();

  return (
    <div className="theme-segmented" aria-label="Appearance mode" role="tablist">
      <button
        aria-selected={mode === "light"}
        className="theme-segmented-button"
        data-active={mode === "light"}
        onClick={() => setMode("light")}
        role="tab"
        type="button"
      >
        Light
      </button>
      <button
        aria-selected={mode === "dark"}
        className="theme-segmented-button"
        data-active={mode === "dark"}
        onClick={() => setMode("dark")}
        role="tab"
        type="button"
      >
        Dark
      </button>
    </div>
  );
}
