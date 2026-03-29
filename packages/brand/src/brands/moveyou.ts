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
    primary: "#87A8A4",
    secondary: "#E4DCCF",
    accent: "#D97D54",
    surface: "#F6F1E9"
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
      headline: "A calm home for strength, recovery, and progress.",
      subheadline: "Train with intention across workouts, wellness, and guided recovery.",
      description: "Consumer web surface for discovery, account access, commerce, and light wellness exploration."
    },
    admin: {
      headline: "Operate programs, coaches, and commerce from one control room.",
      subheadline: "Manage users, content, orders, and AI-assisted drafts with clear ownership.",
      description: "Operational surface for admins and coaches."
    },
    mobile: {
      headline: "Your daily training and reset rituals in one pocket studio.",
      subheadline: "Move through workouts, relaxation, and progress tracking on the go.",
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
