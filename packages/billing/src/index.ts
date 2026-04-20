import { getBrandPack } from "@platform/brand";
import type { BillingProviderId, BrandPack, Market } from "@platform/types";

export const billingProviders: BillingProviderId[] = ["razorpay", "stripe"];

export function resolveBillingProvider(
  market: Market,
  brandPack: BrandPack = getBrandPack()
): BillingProviderId {
  return brandPack.billing.providers[market];
}

export function resolveBillingCurrency(
  market: Market,
  brandPack: BrandPack = getBrandPack()
): string {
  return brandPack.billing.currency[market];
}

export function isBillingConfigured(provider: BillingProviderId): boolean {
  if (provider === "stripe") {
    return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
  }

  return Boolean(
    process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET &&
      process.env.RAZORPAY_WEBHOOK_SECRET
  );
}
