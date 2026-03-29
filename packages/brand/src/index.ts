import type { BrandKey, BrandPack } from "@platform/types";
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

