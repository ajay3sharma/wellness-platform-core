import { getBrandPack } from "@platform/brand";
import { getAdminAiQuotaPolicy } from "@platform/ai";
import { createClayThemeSnapshot } from "@platform/ui";

const brand = getBrandPack();

export const adminAppMetadata = {
  appName: brand.productName,
  supportEmail: brand.supportEmail,
  adminAiQuotaPolicy: getAdminAiQuotaPolicy(brand),
  theme: createClayThemeSnapshot(brand)
};

