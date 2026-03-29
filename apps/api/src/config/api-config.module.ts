import { Module } from "@nestjs/common";
import { apiConfig } from "./api-config";
import { API_CONFIG } from "./api-config.token";

@Module({
  providers: [
    {
      provide: API_CONFIG,
      useValue: apiConfig
    }
  ],
  exports: [API_CONFIG]
})
export class ApiConfigModule {}
