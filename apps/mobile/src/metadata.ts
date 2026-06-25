import { getBrandMetadata, getBrandPack } from "@platform/brand";
import { createSurfaceTheme, DEFAULT_THEME_MODE } from "@platform/ui";

export const mobileBrand = getBrandPack();
export const mobileMetadata = getBrandMetadata("mobile");
export const mobileTheme = createSurfaceTheme(mobileBrand, "mobile", DEFAULT_THEME_MODE);
