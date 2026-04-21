import { Inject, Injectable } from "@nestjs/common";
import { getRuntimeConfigDiagnostics } from "@platform/config";
import type { ServiceDependencyStatus, ServiceHealth, ServiceReadiness } from "@platform/types";
import { API_CONFIG } from "../config/api-config.token";
import type { ApiConfig } from "../config/api-config";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class HealthService {
  constructor(
    @Inject(API_CONFIG) private readonly config: ApiConfig,
    private readonly prisma: PrismaService
  ) {}

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

  async getReadiness(): Promise<ServiceReadiness> {
    const diagnostics = getRuntimeConfigDiagnostics();
    const dependencies: ServiceDependencyStatus[] = [
      await this.getDatabaseStatus(),
      {
        key: "billing",
        status: diagnostics.billing.status,
        required: false,
        summary: diagnostics.billing.summary,
        details: diagnostics.billing.details
      },
      {
        key: "ai",
        status: diagnostics.ai.status,
        required: false,
        summary: diagnostics.ai.summary,
        details: diagnostics.ai.details
      }
    ];
    const status =
      diagnostics.core.status === "ok" &&
      dependencies.every((dependency) => dependency.status === "ok")
        ? "ok"
        : "degraded";

    return {
      ...this.getHealth(),
      status,
      dependencies
    };
  }

  private async getDatabaseStatus(): Promise<ServiceDependencyStatus> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        key: "database",
        status: "ok",
        required: true,
        summary: "Database connectivity is available.",
        details: ["Prisma executed a local readiness query successfully."]
      };
    } catch (error) {
      return {
        key: "database",
        status: "degraded",
        required: true,
        summary: "Database connectivity is unavailable.",
        details: [error instanceof Error ? error.message : "Prisma readiness query failed."]
      };
    }
  }
}
