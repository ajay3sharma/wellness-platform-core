import { getBrandPack } from "@platform/brand";
import type { BillingProviderId, BrandPack, Market } from "@platform/types";

export const billingProviders: BillingProviderId[] = ["razorpay", "stripe"];

export function resolveBillingProvider(
  market: Market,
  brandPack: BrandPack = getBrandPack()
): BillingProviderId {
  return brandPack.billing.providers[market];
}

