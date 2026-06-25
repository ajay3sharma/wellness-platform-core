import type { BrandPack } from "@platform/types";

export const moveyouBrand = {
  key: "moveyou",
  productName: "MoveYOU",
  shortName: "MoveYOU",
  tagline: "Stretch. Strengthen. Renew.",
  description: "White-label fitness and wellness experiences with guided movement and recovery.",
  supportEmail: "support@moveyou.app",
  domains: {
    web: "https://www.moveyou.app",
    admin: "https://admin.moveyou.app",
    api: "https://api.moveyou.app",
    mobileDeepLink: "moveyou"
  },
  theme: {
    modes: {
      light: {
        primary: "#FF6A00",
        secondary: "#F8F2E8",
        accent: "#B8A5D8",
        surface: "#FFFFFF",
        canvas: "#FAFAFA",
        canvasSoft: "#FFF8F0",
        surfaceRaised: "#FFFDF9",
        surfaceGlass: "rgba(255, 255, 255, 0.76)",
        textStrong: "#10233F",
        textMuted: "#64748B",
        borderSoft: "rgba(184, 165, 216, 0.22)",
        borderStrong: "rgba(51, 65, 85, 0.18)",
        primaryStrong: "#EA580C",
        accentSoft: "#F0EBF8",
        success: "#16A34A",
        warning: "#F59E0B",
        danger: "#E11D48",
        highlight: "#FF6A00",
        textOnPrimary: "#FFFFFF",
        textOnPrimaryMuted: "rgba(255, 255, 255, 0.82)"
      },
      dark: {
        primary: "#FF8A3D",
        secondary: "#1F2937",
        accent: "#CDBAF0",
        surface: "#182235",
        canvas: "#0F172A",
        canvasSoft: "#111827",
        surfaceRaised: "#223047",
        surfaceGlass: "rgba(24, 34, 53, 0.82)",
        textStrong: "#F8FAFC",
        textMuted: "#CBD5E1",
        borderSoft: "rgba(226, 232, 240, 0.12)",
        borderStrong: "rgba(226, 232, 240, 0.20)",
        primaryStrong: "#FDBA74",
        accentSoft: "rgba(205, 186, 240, 0.18)",
        success: "#4ADE80",
        warning: "#FBBF24",
        danger: "#FB7185",
        highlight: "#FF8A3D",
        textOnPrimary: "#FFFFFF",
        textOnPrimaryMuted: "rgba(255, 255, 255, 0.82)"
      }
    },
    routeThemes: {
      light: {
        home: {
          primary: "#B8A5D8",
          primaryStrong: "#8F75C2",
          background: "#F0EBF8",
          backgroundSoft: "#F8F5FC",
          textOnPrimary: "#FFFFFF"
        },
        workouts: {
          primary: "#A8C8E8",
          primaryStrong: "#6B9DCC",
          background: "#E8F2FC",
          backgroundSoft: "#F3F8FE",
          textOnPrimary: "#FFFFFF"
        },
        reset: {
          primary: "#A8D8C8",
          primaryStrong: "#68B99E",
          background: "#E8F8F2",
          backgroundSoft: "#F3FCF8",
          textOnPrimary: "#FFFFFF"
        },
        store: {
          primary: "#D8A8C8",
          primaryStrong: "#BC6EA3",
          background: "#F8E8F2",
          backgroundSoft: "#FDF4F9",
          textOnPrimary: "#FFFFFF"
        },
        progress: {
          primary: "#D8C8A8",
          primaryStrong: "#B49B68",
          background: "#F8F2E8",
          backgroundSoft: "#FCF8F1",
          textOnPrimary: "#FFFFFF"
        },
        admin: {
          primary: "#C8A8D8",
          primaryStrong: "#A270BC",
          background: "#F2E8F8",
          backgroundSoft: "#FAF4FD",
          textOnPrimary: "#FFFFFF"
        },
        profile: {
          primary: "#B8B8B8",
          primaryStrong: "#858585",
          background: "#F0F0F0",
          backgroundSoft: "#F8F8F8",
          textOnPrimary: "#FFFFFF"
        }
      },
      dark: {
        home: {
          primary: "#CDBAF0",
          primaryStrong: "#E4D9FF",
          background: "#211C2E",
          backgroundSoft: "#2A2438",
          textOnPrimary: "#111827"
        },
        workouts: {
          primary: "#BEDAF4",
          primaryStrong: "#DBEDFF",
          background: "#172535",
          backgroundSoft: "#203147",
          textOnPrimary: "#111827"
        },
        reset: {
          primary: "#BDEDDD",
          primaryStrong: "#D8FFF1",
          background: "#173027",
          backgroundSoft: "#203D33",
          textOnPrimary: "#111827"
        },
        store: {
          primary: "#F0B7D8",
          primaryStrong: "#FFD8EE",
          background: "#321B2A",
          backgroundSoft: "#402436",
          textOnPrimary: "#111827"
        },
        progress: {
          primary: "#EBD9B6",
          primaryStrong: "#FFF1CA",
          background: "#302617",
          backgroundSoft: "#3E321F",
          textOnPrimary: "#111827"
        },
        admin: {
          primary: "#DEC0F0",
          primaryStrong: "#F1DBFF",
          background: "#2B1D34",
          backgroundSoft: "#382641",
          textOnPrimary: "#111827"
        },
        profile: {
          primary: "#D1D5DB",
          primaryStrong: "#F3F4F6",
          background: "#24262B",
          backgroundSoft: "#30333A",
          textOnPrimary: "#111827"
        }
      }
    },
    typography: {
      displayFamily:
        'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      bodyFamily:
        'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      displayWeight: 300,
      bodyWeight: 400,
      uiLetterSpacing: "0",
      displayLetterSpacing: "-0.02em"
    },
    radius: {
      sm: "14px",
      md: "18px",
      lg: "24px",
      xl: "32px",
      pill: "999px"
    },
    spacing: {
      xs: 8,
      sm: 12,
      md: 16,
      lg: 24,
      xl: 32,
      xxl: 48
    },
    shadow: {
      soft: "4px 4px 8px rgba(174, 174, 192, 0.15), -4px -4px 8px rgba(255, 255, 255, 0.70), inset 1px 1px 2px rgba(255, 255, 255, 0.30)",
      medium: "6px 6px 12px rgba(174, 174, 192, 0.20), -6px -6px 12px rgba(255, 255, 255, 0.70), inset 2px 2px 4px rgba(255, 255, 255, 0.20)",
      strong: "8px 8px 16px rgba(174, 174, 192, 0.25), -8px -8px 16px rgba(255, 255, 255, 0.70), inset 3px 3px 6px rgba(255, 255, 255, 0.15)",
      glow: "0 18px 48px rgba(184, 165, 216, 0.20)",
      inset: "inset 4px 4px 8px rgba(174, 174, 192, 0.20), inset -4px -4px 8px rgba(255, 255, 255, 0.50)"
    },
    motion: {
      fastMs: 160,
      baseMs: 260,
      slowMs: 420,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)"
    }
  },
  assets: {
    logoText: "/brands/moveyou/logo-text.svg",
    logoMark: "/brands/moveyou/logo-mark.svg",
    favicon: "/brands/moveyou/favicon.ico",
    appIcon: "/brands/moveyou/app-icon.png"
  },
  metadata: {
    titleTemplate: "%s | MoveYOU",
    seoTitle: "MoveYOU",
    seoDescription: "Stretch. Strengthen. Renew.",
    legalName: "MoveYOU Wellness Platform"
  },
  appMetadata: {
    web: {
      headline: "Fitness, recovery, and progress in one place.",
      subheadline: "Simple tools for training, reset, and membership.",
      description: "Browse programs, manage your account, and keep your wellness purchases together."
    },
    admin: {
      headline: "Programs, people, and payments.",
      subheadline: "A clear workspace for content, coaching, commerce, and approvals.",
      description: "Operational workspace for admins and coaches."
    },
    mobile: {
      headline: "Move. Reset. Keep going.",
      subheadline: "Workouts, recovery, and progress made easy to follow.",
      description: "Primary mobile experience for end users."
    },
    api: {
      headline: "Platform backbone for auth, content, billing, and AI policy.",
      subheadline: "Stable contracts for every app surface and shared package.",
      description: "Backend service boundary for the wellness platform."
    }
  },
  billing: {
    defaultMarket: "india",
    providers: {
      india: "razorpay",
      global: "stripe"
    },
    currency: {
      india: "INR",
      global: "USD"
    }
  },
  ai: {
    adminDailyActions: 10,
    brandDailyActions: 50,
    userDailyRequestLimits: {
      free: 1,
      plus: 3,
      pro: 5
    },
    userDailyTokenLimits: {
      free: 1000,
      plus: 3000,
      pro: 6000
    }
  }
} satisfies BrandPack;
