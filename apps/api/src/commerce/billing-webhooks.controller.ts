import { Controller, Post, Req } from "@nestjs/common";
import type { Request } from "express";
import { CommerceService } from "./commerce.service";

@Controller("billing/webhooks")
export class BillingWebhooksController {
  constructor(private readonly commerceService: CommerceService) {}

  @Post("stripe")
  handleStripeWebhook(@Req() request: Request & { rawBody?: Buffer }) {
    const rawBody = Buffer.isBuffer(request.rawBody)
      ? request.rawBody
      : Buffer.from(JSON.stringify(request.body ?? {}));

    return this.commerceService.handleStripeWebhook(
      rawBody,
      request.headers["stripe-signature"]?.toString()
    );
  }

  @Post("razorpay")
  handleRazorpayWebhook(@Req() request: Request & { rawBody?: Buffer }) {
    const rawBody = Buffer.isBuffer(request.rawBody)
      ? request.rawBody
      : Buffer.from(JSON.stringify(request.body ?? {}));

    return this.commerceService.handleRazorpayWebhook(
      rawBody,
      request.headers["x-razorpay-signature"]?.toString(),
      request.headers["x-razorpay-event-id"]?.toString()
    );
  }
}
