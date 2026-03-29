import { getUserAiQuotaPolicy } from "@platform/ai";
import { getBrandPack } from "@platform/brand";
import { resolveBillingProvider } from "@platform/billing";
import { platformConfig } from "@platform/config";

const brand = getBrandPack();

export const apiManifest = {
  repoSlug: platformConfig.repo.slug,
  defaultBranch: platformConfig.repo.defaultBranch,
  activeBrand: brand.key,
  defaultBillingByMarket: {
    india: resolveBillingProvider("india", brand),
    global: resolveBillingProvider("global", brand)
  },
  userAiQuotas: {
    free: getUserAiQuotaPolicy("free", brand),
    plus: getUserAiQuotaPolicy("plus", brand),
    pro: getUserAiQuotaPolicy("pro", brand)
  }
};

