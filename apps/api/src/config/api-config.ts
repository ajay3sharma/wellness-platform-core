import { getBrandMetadata, getBrandPack } from "@platform/brand";
import { platformConfig, runtimeEnv } from "@platform/config";
import type { AppMetadataSnapshot, BrandPack, ServiceHealth } from "@platform/types";

export interface ApiConfig {
  port: number;
  basePath: string;
  version: string;
  brand: BrandPack;
  apiMetadata: AppMetadataSnapshot;
  allowedOrigins: string[];
  auth: {
    issuer: string;
    audience: string;
    accessTokenTtlMinutes: number;
    refreshTokenTtlDays: number;
    accessSecret: string;
    refreshSecret: string;
  };
  bootstrapAdmin: {
    email: string;
    password: string;
    displayName: string;
  };
  health: {
    service: string;
    environment: string;
    activeBrand: string;
  };
  databaseUrl: string;
}

const activeBrand = getBrandPack(runtimeEnv.activeBrand);
const mobileWebOrigins = [
  "http://localhost:8081",
  "http://127.0.0.1:8081",
  "http://localhost:8082",
  "http://127.0.0.1:8082"
];

function getStringEnv(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const apiConfig: ApiConfig = {
  port: runtimeEnv.apiPort,
  basePath: platformConfig.services.api.basePath,
  version: "0.1.0",
  brand: activeBrand,
  apiMetadata: getBrandMetadata("api", runtimeEnv.activeBrand),
  // Allow the Expo web surface to call the API during local mobile testing and screenshot capture.
  allowedOrigins: Array.from(new Set([runtimeEnv.webUrl, runtimeEnv.adminUrl, ...mobileWebOrigins])),
  auth: {
    issuer: platformConfig.auth.issuer,
    audience: platformConfig.auth.audience,
    accessTokenTtlMinutes: platformConfig.auth.accessTokenTtlMinutes,
    refreshTokenTtlDays: platformConfig.auth.refreshTokenTtlDays,
    accessSecret: runtimeEnv.jwtAccessSecret,
    refreshSecret: runtimeEnv.jwtRefreshSecret
  },
  bootstrapAdmin: {
    email: getStringEnv("API_BOOTSTRAP_ADMIN_EMAIL", activeBrand.supportEmail),
    password: getStringEnv("API_BOOTSTRAP_ADMIN_PASSWORD", "dev-password"),
    displayName: getStringEnv("API_BOOTSTRAP_ADMIN_NAME", `${activeBrand.productName} Admin`)
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
