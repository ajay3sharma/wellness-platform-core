import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { AdminCommerceController } from "./admin-commerce.controller";
import { BillingService } from "./billing.service";
import { BillingWebhooksController } from "./billing-webhooks.controller";
import { CommerceService } from "./commerce.service";
import { StoreController } from "./store.controller";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [StoreController, AdminCommerceController, BillingWebhooksController],
  providers: [CommerceService, BillingService],
  exports: [CommerceService]
})
export class CommerceModule {}
