import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  ServiceUnavailableException
} from "@nestjs/common";
import { apiConfig } from "../config/api-config";
import { runtimeEnv } from "@platform/config";
import type { BillingInterval, BillingProviderId } from "@platform/types";
import { createHmac, timingSafeEqual } from "node:crypto";

interface StripeCheckoutLineItem {
  name: string;
  description: string;
  amountMinor: number;
  quantity: number;
  currency: string;
}

interface StripeCheckoutRequest {
  mode: "payment" | "subscription";
  lineItems: StripeCheckoutLineItem[];
  successUrl: string;
  cancelUrl: string;
  customerEmail: string;
  metadata: Record<string, string>;
  recurringInterval?: BillingInterval;
}

interface StripeCheckoutResponse {
  id: string;
  url: string | null;
  expires_at: number | null;
}

interface RazorpayOrderResponse {
  id: string;
}

interface RazorpayPlanResponse {
  id: string;
}

interface RazorpaySubscriptionResponse {
  id: string;
}

interface RazorpayCheckoutRequest {
  name: string;
  description: string;
  amountMinor: number;
  currency: string;
  notes: Record<string, string>;
  prefill: {
    name: string;
    email: string;
  };
  successUrl: string;
  cancelUrl: string;
}

interface RazorpaySubscriptionCheckoutRequest extends RazorpayCheckoutRequest {
  billingInterval: BillingInterval;
}

interface BillingLaunchResponse {
  providerSessionId?: string | null;
  providerOrderId?: string | null;
  providerSubscriptionId?: string | null;
  providerCheckoutUrl?: string | null;
  expiresAt?: string | null;
  snapshot?: Record<string, unknown> | null;
}

@Injectable()
export class BillingService {
  async createStripeCheckoutSession(payload: StripeCheckoutRequest): Promise<BillingLaunchResponse> {
    this.assertProviderConfigured("stripe");

    const body = new URLSearchParams({
      mode: payload.mode,
      success_url: payload.successUrl,
      cancel_url: payload.cancelUrl,
      customer_email: payload.customerEmail
    });

    payload.lineItems.forEach((item, index) => {
      body.set(`line_items[${index}][quantity]`, String(item.quantity));
      body.set(`line_items[${index}][price_data][currency]`, item.currency.toLowerCase());
      body.set(`line_items[${index}][price_data][unit_amount]`, String(item.amountMinor));
      body.set(`line_items[${index}][price_data][product_data][name]`, item.name);
      body.set(`line_items[${index}][price_data][product_data][description]`, item.description);

      if (payload.mode === "subscription" && payload.recurringInterval) {
        body.set(
          `line_items[${index}][price_data][recurring][interval]`,
          payload.recurringInterval
        );
      }
    });

    for (const [key, value] of Object.entries(payload.metadata)) {
      body.set(`metadata[${key}]`, value);
      if (payload.mode === "subscription") {
        body.set(`subscription_data[metadata][${key}]`, value);
      }
    }

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${runtimeEnv.stripeSecretKey}`,
        "content-type": "application/x-www-form-urlencoded"
      },
      body
    });

    const data = (await response.json().catch(() => null)) as StripeCheckoutResponse | null;

    if (!response.ok || !data?.id) {
      throw new BadGatewayException({
        code: "BILLING_PROVIDER_ERROR",
        message: "Stripe checkout session creation failed.",
        details: {
          provider: "stripe"
        }
      });
    }

    return {
      providerSessionId: data.id,
      providerCheckoutUrl: data.url,
      expiresAt: data.expires_at ? new Date(data.expires_at * 1000).toISOString() : null
    };
  }

  async createRazorpayOrder(payload: RazorpayCheckoutRequest): Promise<BillingLaunchResponse> {
    this.assertProviderConfigured("razorpay");

    const order = await this.fetchRazorpay<RazorpayOrderResponse>("/orders", {
      amount: payload.amountMinor,
      currency: payload.currency,
      receipt: payload.notes.checkoutSessionId,
      notes: payload.notes
    });

    return {
      providerOrderId: order.id,
      snapshot: {
        keyId: runtimeEnv.razorpayKeyId,
        name: payload.name,
        description: payload.description,
        prefill: payload.prefill,
        callbackUrls: {
          success: payload.successUrl,
          cancel: payload.cancelUrl
        }
      }
    };
  }

  async createRazorpaySubscription(
    payload: RazorpaySubscriptionCheckoutRequest
  ): Promise<BillingLaunchResponse> {
    this.assertProviderConfigured("razorpay");

    const period = payload.billingInterval === "month" ? "monthly" : "yearly";
    const totalCount = payload.billingInterval === "month" ? 120 : 10;

    const plan = await this.fetchRazorpay<RazorpayPlanResponse>("/plans", {
      period,
      interval: 1,
      item: {
        name: payload.name,
        amount: payload.amountMinor,
        currency: payload.currency,
        description: payload.description
      },
      notes: payload.notes
    });

    const subscription = await this.fetchRazorpay<RazorpaySubscriptionResponse>("/subscriptions", {
      plan_id: plan.id,
      total_count: totalCount,
      customer_notify: false,
      quantity: 1,
      notes: payload.notes
    });

    return {
      providerSubscriptionId: subscription.id,
      snapshot: {
        keyId: runtimeEnv.razorpayKeyId,
        name: payload.name,
        description: payload.description,
        prefill: payload.prefill,
        callbackUrls: {
          success: payload.successUrl,
          cancel: payload.cancelUrl
        }
      }
    };
  }

  verifyStripeWebhook(rawBody: Buffer | string, signatureHeader: string | undefined) {
    this.assertProviderConfigured("stripe");

    if (!signatureHeader) {
      throw new BadRequestException({
        code: "INVALID_WEBHOOK_SIGNATURE",
        message: "Missing Stripe webhook signature."
      });
    }

    const entries = signatureHeader.split(",").map((entry) => entry.trim());
    const timestamp = entries.find((entry) => entry.startsWith("t="))?.slice(2);
    const signatures = entries
      .filter((entry) => entry.startsWith("v1="))
      .map((entry) => entry.slice(3));

    if (!timestamp || signatures.length === 0) {
      throw new BadRequestException({
        code: "INVALID_WEBHOOK_SIGNATURE",
        message: "Malformed Stripe webhook signature."
      });
    }

    const payload = Buffer.isBuffer(rawBody) ? rawBody.toString("utf8") : rawBody;
    const expected = createHmac("sha256", runtimeEnv.stripeWebhookSecret)
      .update(`${timestamp}.${payload}`)
      .digest("hex");

    const isValid = signatures.some((candidate) => safeCompareHex(expected, candidate));

    if (!isValid) {
      throw new BadRequestException({
        code: "INVALID_WEBHOOK_SIGNATURE",
        message: "Stripe webhook signature verification failed."
      });
    }

    return JSON.parse(payload) as Record<string, unknown>;
  }

  verifyRazorpayWebhook(rawBody: Buffer | string, signatureHeader: string | undefined) {
    this.assertProviderConfigured("razorpay");

    if (!signatureHeader) {
      throw new BadRequestException({
        code: "INVALID_WEBHOOK_SIGNATURE",
        message: "Missing Razorpay webhook signature."
      });
    }

    const payload = Buffer.isBuffer(rawBody) ? rawBody.toString("utf8") : rawBody;
    const expected = createHmac("sha256", runtimeEnv.razorpayWebhookSecret)
      .update(payload)
      .digest("hex");

    if (!safeCompareHex(expected, signatureHeader)) {
      throw new BadRequestException({
        code: "INVALID_WEBHOOK_SIGNATURE",
        message: "Razorpay webhook signature verification failed."
      });
    }

    return JSON.parse(payload) as Record<string, unknown>;
  }

  getBrandDisplayName() {
    return apiConfig.brand.productName;
  }

  private assertProviderConfigured(provider: BillingProviderId) {
    if (provider === "stripe") {
      if (!runtimeEnv.stripeSecretKey || !runtimeEnv.stripeWebhookSecret) {
        throw new ServiceUnavailableException({
          code: "BILLING_PROVIDER_NOT_CONFIGURED",
          message: "Stripe credentials are not configured.",
          details: {
            provider
          }
        });
      }

      return;
    }

    if (
      !runtimeEnv.razorpayKeyId ||
      !runtimeEnv.razorpayKeySecret ||
      !runtimeEnv.razorpayWebhookSecret
    ) {
      throw new ServiceUnavailableException({
        code: "BILLING_PROVIDER_NOT_CONFIGURED",
        message: "Razorpay credentials are not configured.",
        details: {
          provider
        }
      });
    }
  }

  private async fetchRazorpay<TResponse>(
    path: string,
    body: Record<string, unknown>
  ): Promise<TResponse> {
    const credentials = Buffer.from(
      `${runtimeEnv.razorpayKeyId}:${runtimeEnv.razorpayKeySecret}`
    ).toString("base64");

    const response = await fetch(`https://api.razorpay.com/v1${path}`, {
      method: "POST",
      headers: {
        authorization: `Basic ${credentials}`,
        "content-type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const data = (await response.json().catch(() => null)) as TResponse | null;

    if (!response.ok || !data) {
      throw new BadGatewayException({
        code: "BILLING_PROVIDER_ERROR",
        message: "Razorpay request failed.",
        details: {
          provider: "razorpay",
          path
        }
      });
    }

    return data;
  }
}

function safeCompareHex(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}
