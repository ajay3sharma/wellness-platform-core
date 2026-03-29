import { getBrandMetadata, getBrandPack } from "@platform/brand";
import { platformConfig, runtimeEnv } from "@platform/config";
import type { AppMetadataSnapshot, BrandPack, ServiceHealth } from "@platform/types";

export interface ApiConfig {
  port: number;
  basePath: string;
  version: string;
  brand: BrandPack;
  apiMetadata: AppMetadataSnapshot;
  auth: {
    issuer: string;
    audience: string;
    accessTokenTtlMinutes: number;
    refreshTokenTtlDays: number;
    accessSecret: string;
    refreshSecret: string;
  };
  devAuth: {
    email: string;
    password: string;
  };
  health: {
    service: string;
    environment: string;
    activeBrand: string;
  };
  databaseUrl: string;
}

const activeBrand = getBrandPack(runtimeEnv.activeBrand);

function getStringEnv(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const apiConfig: ApiConfig = {
  port: runtimeEnv.apiPort,
  basePath: platformConfig.services.api.basePath,
  version: "0.1.0",
  brand: activeBrand,
  apiMetadata: getBrandMetadata("api", runtimeEnv.activeBrand),
  auth: {
    issuer: platformConfig.auth.issuer,
    audience: platformConfig.auth.audience,
    accessTokenTtlMinutes: platformConfig.auth.accessTokenTtlMinutes,
    refreshTokenTtlDays: platformConfig.auth.refreshTokenTtlDays,
    accessSecret: runtimeEnv.jwtAccessSecret,
    refreshSecret: runtimeEnv.jwtRefreshSecret
  },
  devAuth: {
    email: getStringEnv("API_DEV_EMAIL", activeBrand.supportEmail),
    password: getStringEnv("API_DEV_PASSWORD", "dev-password")
  },
  health: {
    service: "api",
    environment: runtimeEnv.nodeEnv,
    activeBrand: activeBrand.key
  },
  databaseUrl: runtimeEnv.databaseUrl
};

export const apiManifest: ServiceHealth = {
  service: apiConfig.health.service,
  status: "ok",
  version: apiConfig.version,
  environment: apiConfig.health.environment,
  timestamp: new Date().toISOString(),
  activeBrand: activeBrand.key
};
