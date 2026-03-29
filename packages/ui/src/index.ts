import type { BrandPack } from "@platform/types";

export function createClayThemeSnapshot(brand: BrandPack) {
  return {
    productName: brand.productName,
    colors: brand.theme,
    surfaces: {
      default: brand.theme.surface,
      raisedShadow: "0 18px 35px rgba(66, 75, 82, 0.16)",
      insetShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.7)"
    }
  };
}
