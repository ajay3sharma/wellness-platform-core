import { getBrandMetadata, getBrandPack } from "@platform/brand";
import { createSurfaceTheme } from "@platform/ui";

export const mobileBrand = getBrandPack();
export const mobileMetadata = getBrandMetadata("mobile");
export const mobileTheme = createSurfaceTheme(mobileBrand, "mobile");

