import { getBrandMetadata, getBrandPack } from "@platform/brand";
import { platformConfig, runtimeEnv } from "@platform/config";
import type { AppMetadataSnapshot } from "@platform/types";

const brand = getBrandPack();

export const webBrand = brand;
export const webAppMetadata: AppMetadataSnapshot = getBrandMetadata("web");
export const webTitleTemplate = brand.metadata.titleTemplate;

export const webNavigation = [
  { href: "/", label: "Home" },
  { href: "/login", label: "Login" },
  { href: "/account", label: "Account" },
  { href: "/store", label: "Store" }
] as const;

export const webStats = [
  { value: "12", label: "week plans" },
  { value: "24/7", label: "member access" },
  { value: "1", label: "account" }
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
    description: "Memberships and digital products stay connected to your account."
  }
] as const;

export const webHighlights = [
  "Your account keeps orders, products, and plans together.",
  "Store checkout opens through a single secure flow.",
  "The interface adapts to the selected brand and theme mode."
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
