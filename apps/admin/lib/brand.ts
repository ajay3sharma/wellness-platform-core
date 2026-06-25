import { getBrandMetadata, getBrandPack } from "@platform/brand";
import { platformConfig } from "@platform/config";

export const adminBrand = getBrandPack();
export const adminMetadata = getBrandMetadata("admin");
export const adminBasePath = platformConfig.services.api.basePath;
