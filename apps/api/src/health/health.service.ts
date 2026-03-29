import { Inject, Injectable } from "@nestjs/common";
import type { ServiceHealth } from "@platform/types";
import { API_CONFIG } from "../config/api-config.token";
import type { ApiConfig } from "../config/api-config";

@Injectable()
export class HealthService {
  constructor(@Inject(API_CONFIG) private readonly config: ApiConfig) {}

  getHealth(): ServiceHealth {
    return {
      service: this.config.health.service,
      status: "ok",
      version: this.config.version,
      environment: this.config.health.environment,
      timestamp: new Date().toISOString(),
      activeBrand: this.config.brand.key
    };
  }
}
