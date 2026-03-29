import { getBrandPack } from "@platform/brand";
import { platformConfig } from "@platform/config";
import { createClayThemeSnapshot } from "@platform/ui";

const brand = getBrandPack();

export const webAppMetadata = {
  appName: brand.productName,
  titleTemplate: brand.metadata.titleTemplate,
  seoTitle: brand.metadata.seoTitle,
  seoDescription: brand.metadata.seoDescription,
  defaultMarket: platformConfig.billing.defaultMarket,
  theme: createClayThemeSnapshot(brand)
};

