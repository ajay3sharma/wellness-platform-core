import { getBrandMetadata } from "@platform/brand";
import type {
  AppSurface,
  BrandRouteThemeKey,
  BrandRouteThemeSet,
  BrandPack,
  SurfaceProfile,
  SurfaceThemeSnapshot,
  ThemeMode
} from "@platform/types";

export const THEME_MODE_STORAGE_KEY = "platform-theme-mode";
export const DEFAULT_THEME_MODE: ThemeMode = "light";

const surfaceProfiles = {
  web: {
    density: "comfortable",
    contentMaxWidth: 1240,
    heroPadding: 40,
    cardPadding: 24,
    navHeight: 76
  },
  admin: {
    density: "compact",
    contentMaxWidth: 1480,
    heroPadding: 32,
    cardPadding: 22,
    navHeight: 80
  },
  mobile: {
    density: "comfortable",
    contentMaxWidth: 440,
    heroPadding: 28,
    cardPadding: 18,
    navHeight: 62
  },
  api: {
    density: "compact",
    contentMaxWidth: 960,
    heroPadding: 24,
    cardPadding: 20,
    navHeight: 64
  }
} as const satisfies Record<AppSurface, SurfaceProfile>;

const defaultRouteBySurface = {
  web: "home",
  admin: "admin",
  mobile: "home",
  api: "profile"
} as const satisfies Record<AppSurface, BrandRouteThemeKey>;

function px(value: number) {
  return `${value}px`;
}

export function resolveThemeMode(value: string | null | undefined): ThemeMode {
  return value === "dark" ? "dark" : DEFAULT_THEME_MODE;
}

export function getNextThemeMode(mode: ThemeMode): ThemeMode {
  return mode === "light" ? "dark" : "light";
}

export function createResolvedThemeSnapshot(brand: BrandPack, mode: ThemeMode) {
  return {
    mode,
    productName: brand.productName,
    colors: brand.theme.modes[mode],
    routeThemes: brand.theme.routeThemes[mode],
    typography: brand.theme.typography,
    radius: brand.theme.radius,
    spacing: brand.theme.spacing,
    shadow: brand.theme.shadow,
    motion: brand.theme.motion
  };
}

export function createSurfaceTheme(
  brand: BrandPack,
  surface: AppSurface,
  mode: ThemeMode = DEFAULT_THEME_MODE
): SurfaceThemeSnapshot {
  const metadata = getBrandMetadata(surface, brand.key);

  return {
    ...createResolvedThemeSnapshot(brand, mode),
    surface,
    profile: surfaceProfiles[surface],
    defaultRouteTheme: brand.theme.routeThemes[mode][defaultRouteBySurface[surface]],
    headline: metadata.headline,
    subheadline: metadata.subheadline
  };
}

export function getRouteTheme(
  routeThemes: BrandRouteThemeSet,
  route: BrandRouteThemeKey = "home"
) {
  return routeThemes[route];
}

export function createThemeCssVariables(theme: SurfaceThemeSnapshot) {
  const routeVariables = Object.fromEntries(
    (Object.entries(theme.routeThemes) as Array<[BrandRouteThemeKey, (typeof theme.routeThemes)[BrandRouteThemeKey]]>).flatMap(
      ([key, routeTheme]) => [
        [`--route-${key}-primary`, routeTheme.primary],
        [`--route-${key}-primary-strong`, routeTheme.primaryStrong],
        [`--route-${key}-bg`, routeTheme.background],
        [`--route-${key}-bg-soft`, routeTheme.backgroundSoft],
        [`--route-${key}-text-on-primary`, routeTheme.textOnPrimary]
      ]
    )
  ) as Record<string, string>;

  return {
    "--theme-mode": theme.mode,
    "--theme-canvas": theme.colors.canvas,
    "--theme-canvas-soft": theme.colors.canvasSoft,
    "--theme-surface": theme.colors.surface,
    "--theme-surface-raised": theme.colors.surfaceRaised,
    "--theme-surface-glass": theme.colors.surfaceGlass,
    "--theme-text-strong": theme.colors.textStrong,
    "--theme-text-muted": theme.colors.textMuted,
    "--theme-border-soft": theme.colors.borderSoft,
    "--theme-border-strong": theme.colors.borderStrong,
    "--theme-primary": theme.colors.primary,
    "--theme-primary-strong": theme.colors.primaryStrong,
    "--theme-secondary": theme.colors.secondary,
    "--theme-accent": theme.colors.accent,
    "--theme-accent-soft": theme.colors.accentSoft,
    "--theme-success": theme.colors.success,
    "--theme-warning": theme.colors.warning,
    "--theme-danger": theme.colors.danger,
    "--theme-highlight": theme.colors.highlight,
    "--theme-text-on-primary": theme.colors.textOnPrimary,
    "--theme-text-on-primary-muted": theme.colors.textOnPrimaryMuted,
    "--theme-font-display": theme.typography.displayFamily,
    "--theme-font-body": theme.typography.bodyFamily,
    "--theme-letter-ui": theme.typography.uiLetterSpacing,
    "--theme-letter-display": theme.typography.displayLetterSpacing,
    "--theme-radius-sm": theme.radius.sm,
    "--theme-radius-md": theme.radius.md,
    "--theme-radius-lg": theme.radius.lg,
    "--theme-radius-xl": theme.radius.xl,
    "--theme-radius-pill": theme.radius.pill,
    "--theme-space-xs": px(theme.spacing.xs),
    "--theme-space-sm": px(theme.spacing.sm),
    "--theme-space-md": px(theme.spacing.md),
    "--theme-space-lg": px(theme.spacing.lg),
    "--theme-space-xl": px(theme.spacing.xl),
    "--theme-space-2xl": px(theme.spacing.xxl),
    "--theme-shadow-soft": theme.shadow.soft,
    "--theme-shadow-medium": theme.shadow.medium,
    "--theme-shadow-strong": theme.shadow.strong,
    "--theme-shadow-glow": theme.shadow.glow,
    "--theme-shadow-inset": theme.shadow.inset,
    "--route-primary": theme.defaultRouteTheme.primary,
    "--route-primary-strong": theme.defaultRouteTheme.primaryStrong,
    "--route-bg": theme.defaultRouteTheme.background,
    "--route-bg-soft": theme.defaultRouteTheme.backgroundSoft,
    "--route-text-on-primary": theme.defaultRouteTheme.textOnPrimary,
    "--theme-motion-fast": `${theme.motion.fastMs}ms`,
    "--theme-motion-base": `${theme.motion.baseMs}ms`,
    "--theme-motion-slow": `${theme.motion.slowMs}ms`,
    "--theme-motion-easing": theme.motion.easing,
    "--theme-content-max": px(theme.profile.contentMaxWidth),
    "--theme-hero-padding": px(theme.profile.heroPadding),
    "--theme-card-padding": px(theme.profile.cardPadding),
    "--theme-nav-height": px(theme.profile.navHeight),
    ...routeVariables
  } satisfies Record<string, string>;
}

export function getSurfaceProfile(surface: AppSurface) {
  return surfaceProfiles[surface];
}
