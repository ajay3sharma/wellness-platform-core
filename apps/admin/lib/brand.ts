import { getBrandMetadata, getBrandPack } from "@platform/brand";
import { platformConfig } from "@platform/config";
import { createSurfaceTheme } from "@platform/ui";

export const adminBrand = getBrandPack();
export const adminMetadata = getBrandMetadata("admin");
export const adminTheme = createSurfaceTheme(adminBrand, "admin");
export const adminBasePath = platformConfig.services.api.basePath;
