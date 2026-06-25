import { createApiClient } from "@platform/sdk";
import { platformConfig } from "@platform/config";
import type {
  ApiError,
  Cart,
  CatalogProductListItem,
  Market,
  SubscriptionPlanDetail,
  UserSubscription
} from "@platform/types";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Linking, ScrollView, Text, View } from "react-native";
import {
  ActionButton,
  EmptyState,
  Screen,
  SectionTitle,
  StatusBanner,
  Surface
} from "../../src/components/ui";
import { useSession } from "../../src/session";
import { useThemeMode } from "../../src/theme/theme-context";

export default function StoreScreen() {
  const { session } = useSession();
  const params = useLocalSearchParams<{ checkoutStatus?: string }>();
  const [market, setMarket] = useState<Market>(platformConfig.billing.defaultMarket);
  const [products, setProducts] = useState<CatalogProductListItem[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlanDetail[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useThemeMode();
  const api = useMemo(
    () =>
      createApiClient({
        getAccessToken: () => session?.tokens.accessToken
      }),
    [session]
  );

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }

    void loadStore();
  }, [api, market, session]);

  useEffect(() => {
    if (!session || !params.checkoutStatus) {
      return;
    }

    void loadStore();
  }, [params.checkoutStatus, session]);

  async function loadStore() {
    if (!session) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [nextProducts, nextPlans, nextCart, nextSubscription] = await Promise.all([
        api.store.products(),
        api.store.plans(),
        api.store.cart(market),
        api.store.subscription()
      ]);
      setProducts(nextProducts);
      setPlans(nextPlans);
      setCart(nextCart);
      setSubscription(nextSubscription);
    } catch (unknownError) {
      setError((unknownError as ApiError).message || "Unable to load the store.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToCart(product: CatalogProductListItem) {
    if (!session) {
      return;
    }

    const existing = cart?.items.find((item) => item.productId === product.id);

    try {
      setActionLoading(product.id);
      setError(null);
      const nextCart = await api.store.upsertCartItem({
        productId: product.id,
        quantity: (existing?.quantity ?? 0) + 1,
        market
      });
      setCart(nextCart);
    } catch (unknownError) {
      setError((unknownError as ApiError).message || "Unable to update the cart.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleQuantity(itemId: string, quantity: number) {
    if (!session) {
      return;
    }

    try {
      setActionLoading(itemId);
      setError(null);
      const nextCart =
        quantity <= 0
          ? await api.store.removeCartItem(itemId)
          : await api.store.updateCartItem(itemId, { quantity });
      setCart(nextCart);
    } catch (unknownError) {
      setError((unknownError as ApiError).message || "Unable to update the cart.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCartCheckout() {
    if (!session) {
      return;
    }

    try {
      setActionLoading("cart-checkout");
      setError(null);
      const launch = await api.store.createCartCheckout({
        market,
        surface: "mobile"
      });
      await Linking.openURL(launch.launchUrl);
    } catch (unknownError) {
      setError((unknownError as ApiError).message || "Unable to start checkout.");
      setActionLoading(null);
    }
  }

  async function handlePlanCheckout(planId: string) {
    if (!session) {
      return;
    }

    try {
      setActionLoading(planId);
      setError(null);
      const launch = await api.store.createSubscriptionCheckout({
        subscriptionPlanId: planId,
        market,
        surface: "mobile"
      });
      await Linking.openURL(launch.launchUrl);
    } catch (unknownError) {
      setError((unknownError as ApiError).message || "Unable to start plan checkout.");
      setActionLoading(null);
    }
  }

  if (!session) {
    return (
      <Screen routeTheme="store">
        <Surface routeTheme="store">
          <SectionTitle
            eyebrow="Store"
            title="Sign in to access commerce"
            subtitle="The mobile store is authenticated so carts, orders, and subscriptions stay attached to one user session."
          />
        </Surface>
      </Screen>
    );
  }

  return (
    <Screen routeTheme="store">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
        <Surface routeTheme="store">
          <SectionTitle
            eyebrow="Store"
            title="Products and memberships"
            subtitle="Browse digital products, compare plans, and start checkout."
          />
          <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
            {(["india", "global"] as const).map((option) => (
              <ActionButton
                key={option}
                label={option === "india" ? "India" : "Global"}
                onPress={() => setMarket(option)}
                variant={option === market ? "primary" : "secondary"}
              />
            ))}
          </View>
          {params.checkoutStatus ? (
            <Text style={{ color: theme.colors.textMuted, marginTop: 14 }}>
              Checkout return: {String(params.checkoutStatus)}
            </Text>
          ) : null}
          {error ? <StatusBanner routeTheme="store" tone="danger">{error}</StatusBanner> : null}
        </Surface>

        {loading ? <StatusBanner routeTheme="store">Loading store...</StatusBanner> : null}

        <Surface compact routeTheme="store">
          <Text style={{ fontSize: 18, fontWeight: "700", color: theme.colors.textStrong }}>Subscription</Text>
          <Text style={{ color: theme.colors.textMuted, marginTop: 8 }}>
            {subscription?.status === "active"
              ? `${subscription.planName} • ${formatMoney(subscription.currency, subscription.amountMinor)} / ${subscription.billingInterval}`
              : "No active subscription yet."}
          </Text>
        </Surface>

        {products.map((product) => {
          const price = product.activePrices.find((entry) => entry.market === market);

          return (
            <Surface compact key={product.id} routeTheme="store">
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 18, fontWeight: "700", color: theme.colors.textStrong }}>{product.title}</Text>
                <Text style={{ color: theme.colors.textMuted }}>{product.description}</Text>
                <Text style={{ color: theme.colors.textStrong, fontWeight: "700" }}>
                  {price ? formatMoney(price.currency, price.amountMinor) : "Unavailable"}
                </Text>
              </View>
              <View style={{ marginTop: 14 }}>
                <ActionButton
                  label={actionLoading === product.id ? "Adding..." : product.purchaseLabel ?? "Add to cart"}
                  onPress={() => void handleAddToCart(product)}
                  disabled={!price || actionLoading === product.id}
                />
              </View>
            </Surface>
          );
        })}

        {!loading && products.length === 0 ? (
          <EmptyState
            title="No products yet"
            description="Published digital products will appear here for the selected market."
          />
        ) : null}

        <Surface routeTheme="store">
          <SectionTitle
            eyebrow="Plans"
            title="Memberships"
            subtitle="Plan checkout stays separate from the product cart."
          />
          <View style={{ gap: 14 }}>
            {plans.map((plan) => {
              const price = plan.activePrices.find((entry) => entry.market === market);
              const active =
                subscription?.status === "active" && subscription.subscriptionPlanId === plan.id;

              return (
                <View key={plan.id} style={{ gap: 8 }}>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: theme.colors.textStrong }}>{plan.name}</Text>
                  <Text style={{ color: theme.colors.textMuted }}>{plan.description}</Text>
                  <Text style={{ color: theme.colors.textMuted }}>{plan.features.join(" • ")}</Text>
                  <Text style={{ color: theme.colors.textStrong, fontWeight: "700" }}>
                    {price
                      ? `${formatMoney(price.currency, price.amountMinor)} / ${plan.billingInterval}`
                      : "Unavailable"}
                  </Text>
                  <ActionButton
                    label={active ? "Current plan" : actionLoading === plan.id ? "Opening..." : "Subscribe"}
                    onPress={() => void handlePlanCheckout(plan.id)}
                    disabled={active || !price || actionLoading === plan.id}
                    variant={active ? "secondary" : "primary"}
                  />
                </View>
              );
            })}
          </View>
        </Surface>

        <Surface routeTheme="store">
          <SectionTitle
            eyebrow="Cart"
            title="Current cart"
            subtitle="This cart is scoped to the selected market."
          />
          {cart?.items.length ? (
            <View style={{ gap: 14 }}>
              {cart.items.map((item) => (
                <View key={item.id} style={{ gap: 8 }}>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: theme.colors.textStrong }}>
                    {item.productTitle}
                  </Text>
                  <Text style={{ color: theme.colors.textMuted }}>
                    {formatMoney(item.currency, item.totalAmountMinor)}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
                    <ActionButton
                      label="-"
                      onPress={() => void handleQuantity(item.id, item.quantity - 1)}
                      variant="secondary"
                    />
                    <ActionButton
                      label={`Qty ${item.quantity}`}
                      onPress={() => {}}
                      variant="secondary"
                      disabled
                    />
                    <ActionButton
                      label="+"
                      onPress={() => void handleQuantity(item.id, item.quantity + 1)}
                      variant="secondary"
                    />
                    <ActionButton
                      label="Remove"
                      onPress={() => void handleQuantity(item.id, 0)}
                      variant="secondary"
                    />
                  </View>
                </View>
              ))}

              <View style={{ gap: 10 }}>
                <Text style={{ color: theme.colors.textStrong, fontWeight: "700" }}>
                  Total: {formatMoney(cart.currency, cart.subtotalAmountMinor)}
                </Text>
                <ActionButton
                  label={actionLoading === "cart-checkout" ? "Opening checkout..." : "Checkout cart"}
                  onPress={() => void handleCartCheckout()}
                  disabled={actionLoading === "cart-checkout"}
                />
              </View>
            </View>
          ) : (
            <EmptyState
              title="Your cart is empty"
              description="Add a product above to start checkout for this market."
            />
          )}
        </Surface>
      </ScrollView>
    </Screen>
  );
}

function formatMoney(currency: string, amountMinor: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(amountMinor / 100);
}
