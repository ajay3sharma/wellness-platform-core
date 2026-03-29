import { getBrandMetadata, getBrandPack } from "@platform/brand";
import { platformConfig, runtimeEnv } from "@platform/config";
import { createSurfaceTheme } from "@platform/ui";
import type { AppMetadataSnapshot } from "@platform/types";

const brand = getBrandPack();

export const webBrand = brand;
export const webAppMetadata: AppMetadataSnapshot = getBrandMetadata("web");
export const webTitleTemplate = brand.metadata.titleTemplate;

export const webTheme = createSurfaceTheme(brand, "web");

export const webNavigation = [
  { href: "/", label: "Home" },
  { href: "/login", label: "Login" },
  { href: "/account", label: "Account" },
  { href: "/store", label: "Store" }
] as const;

export const webStats = [
  { value: "12", label: "week training blocks" },
  { value: "24/7", label: "brand-aware access" },
  { value: "1", label: "shared identity layer" }
] as const;

export const webPillars = [
  {
    title: "Train",
    description: "Daily plans, guided progress, and a calm landing place for focused movement."
  },
  {
    title: "Recover",
    description: "Breathing, mobility, and reset flows shaped for quick transitions between sessions."
  },
  {
    title: "Grow",
    description: "Commerce, subscriptions, and account journeys designed to evolve with the platform."
  }
] as const;

export const webHighlights = [
  "Brand metadata is resolved from `packages/brand`.",
  "Auth, config, and client contracts are shared across surfaces.",
  "The visual system is built from local CSS variables, not scattered overrides."
] as const;

export const webSurfaceCopy = {
  brandName: webAppMetadata.appName,
  headline: webAppMetadata.headline,
  subheadline: webAppMetadata.subheadline,
  description: webAppMetadata.description,
  supportEmail: webAppMetadata.supportEmail,
  defaultMarket: platformConfig.billing.defaultMarket,
  publicUrl: runtimeEnv.webUrl
} as const;
