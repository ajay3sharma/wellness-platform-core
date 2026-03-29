import { getBrandPack } from "@platform/brand";
import { platformConfig } from "@platform/config";
import { createClayThemeSnapshot } from "@platform/ui";

const brand = getBrandPack();

export const mobileAppMetadata = {
  appName: brand.productName,
  shortName: brand.shortName,
  tagline: brand.tagline,
  scheme: brand.domains.mobileDeepLink,
  supportEmail: brand.supportEmail,
  theme: createClayThemeSnapshot(brand),
  aiPolicy: platformConfig.ai
};

