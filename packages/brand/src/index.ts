import type { AppMetadataSnapshot, AppSurface, BrandKey, BrandPack } from "@platform/types";
import { moveyouBrand } from "./brands/moveyou";

export const brandRegistry = {
  moveyou: moveyouBrand
} as const satisfies Record<BrandKey, BrandPack>;

export function getBrandPack(requestedBrand = process.env.PLATFORM_BRAND): BrandPack {
  if (requestedBrand && requestedBrand in brandRegistry) {
    return brandRegistry[requestedBrand as BrandKey];
  }

  return brandRegistry.moveyou;
}

export function getBrandMetadata(
  surface: AppSurface,
  requestedBrand = process.env.PLATFORM_BRAND
): AppMetadataSnapshot {
  const brand = getBrandPack(requestedBrand);
  const surfaceMetadata = brand.appMetadata[surface];

  return {
    surface,
    appName: brand.productName,
    headline: surfaceMetadata.headline,
    subheadline: surfaceMetadata.subheadline,
    description: surfaceMetadata.description,
    supportEmail: brand.supportEmail
  };
}
