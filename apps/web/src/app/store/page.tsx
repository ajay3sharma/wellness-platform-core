"use client";

import { createApiClient } from "@platform/sdk";
import type {
  ApiError,
  Cart,
  CatalogProductListItem,
  Market,
  SubscriptionPlanDetail,
  UserSubscription
} from "@platform/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useWebSession } from "../../lib/session";
import { webSurfaceCopy } from "../../lib/site";

export default function StorePage() {
  const router = useRouter();
  const { session } = useWebSession();
  const [market, setMarket] = useState<Market>(webSurfaceCopy.defaultMarket);
  const [products, setProducts] = useState<CatalogProductListItem[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlanDetail[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const api = useMemo(
    () =>
      createApiClient({
        getAccessToken: () => session?.tokens.accessToken
      }),
    [session]
  );

  useEffect(() => {
    void loadStore();
  }, [api, market, session]);

  async function loadStore() {
    try {
      setLoading(true);
      setError(null);

      const [nextProducts, nextPlans] = await Promise.all([api.store.products(), api.store.plans()]);
      setProducts(nextProducts);
      setPlans(nextPlans);

      if (session) {
        const [nextCart, nextSubscription] = await Promise.all([
          api.store.cart(market),
          api.store.subscription()
        ]);
        setCart(nextCart);
        setSubscription(nextSubscription);
      } else {
        setCart(null);
        setSubscription(null);
      }
    } catch (unknownError) {
      setError((unknownError as ApiError).message || "Unable to load the store.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToCart(product: CatalogProductListItem) {
    if (!session) {
      router.push("/login");
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
      router.push("/login");
      return;
    }

    try {
      setActionLoading("cart-checkout");
      setError(null);
      const launch = await api.store.createCartCheckout({
        market,
        surface: "web"
      });
      globalThis.window.location.assign(launch.launchUrl);
    } catch (unknownError) {
      setError((unknownError as ApiError).message || "Unable to start checkout.");
      setActionLoading(null);
    }
  }

  async function handlePlanCheckout(planId: string) {
    if (!session) {
      router.push("/login");
      return;
    }

    try {
      setActionLoading(planId);
      setError(null);
      const launch = await api.store.createSubscriptionCheckout({
        subscriptionPlanId: planId,
        market,
        surface: "web"
      });
      globalThis.window.location.assign(launch.launchUrl);
    } catch (unknownError) {
      setError((unknownError as ApiError).message || "Unable to start the subscription checkout.");
      setActionLoading(null);
    }
  }

  return (
    <section className="panel section">
      <span className="eyebrow">Store</span>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          alignItems: "flex-start"
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: "clamp(2.4rem, 5vw, 4rem)",
              margin: "14px 0 10px"
            }}
          >
            Digital products and memberships
          </h1>
          <p className="muted" style={{ lineHeight: 1.75, maxWidth: "62ch" }}>
            Browse the live catalog for {webSurfaceCopy.brandName}, add one-time products to your
            cart, or start a subscription checkout for the current market.
          </p>
        </div>

        <div className="surface-card" style={{ minWidth: 240 }}>
          <strong>Market</strong>
          <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
            {(["india", "global"] as const).map((option) => (
              <button
                className={option === market ? "cta-pill" : "ghost-pill"}
                key={option}
                onClick={() => setMarket(option)}
                type="button"
              >
                {option === "india" ? "India / Razorpay" : "Global / Stripe"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error ? (
        <div
          style={{
            marginTop: 18,
            padding: 14,
            borderRadius: 18,
            border: "1px solid rgba(169, 68, 66, 0.18)",
            background: "rgba(169, 68, 66, 0.08)",
            color: "#8a2c2b"
          }}
        >
          {error}
        </div>
      ) : null}

      <div className="info-band" style={{ marginTop: 24 }}>
        <div className="metric-card">
          <strong style={{ display: "block", fontSize: "1.1rem" }}>Membership plans</strong>
          <p className="muted" style={{ lineHeight: 1.7 }}>
            Subscriptions activate through webhook-backed billing, so your account page reflects the
            confirmed source of truth instead of optimistic client state.
          </p>
        </div>
        <div className="note-card">
          <strong>{session ? "Signed in" : "Sign in for checkout"}</strong>
          <p className="muted" style={{ lineHeight: 1.7 }}>
            {session
              ? `Checkout, orders, and entitlements are attached to ${session.user.displayName}.`
              : "Catalog browse is public, but cart, checkout, and account actions require login."}
          </p>
          {!session ? (
            <div style={{ marginTop: 14 }}>
              <Link className="cta-pill" href="/login">
                Open login
              </Link>
            </div>
          ) : null}
        </div>
      </div>

      <div style={{ marginTop: 26 }}>
        <h2 style={headingStyle}>Digital Products</h2>
        <div className="surface-grid">
          {products.map((product) => {
            const price = product.activePrices.find((entry) => entry.market === market);

            return (
              <article className="surface-card" key={product.id}>
                <strong>{product.title}</strong>
                <p className="muted" style={{ lineHeight: 1.7 }}>
                  {product.description}
                </p>
                <p className="muted">
                  {product.category ? `${product.category} • ` : ""}
                  {product.tags.join(" • ")}
                </p>
                <p style={{ fontSize: "1.25rem", fontWeight: 700 }}>
                  {price ? formatMoney(price.currency, price.amountMinor) : "Unavailable"}
                </p>
                <div className="hero-actions" style={{ marginTop: 12 }}>
                  <button
                    className="cta-pill"
                    disabled={!price || actionLoading === product.id}
                    onClick={() => void handleAddToCart(product)}
                    type="button"
                  >
                    {actionLoading === product.id ? "Adding..." : product.purchaseLabel ?? "Add to cart"}
                  </button>
                  <Link className="ghost-pill" href={`/account`}>
                    View account
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 30 }}>
        <h2 style={headingStyle}>Membership Plans</h2>
        <div className="surface-grid">
          {plans.map((plan) => {
            const price = plan.activePrices.find((entry) => entry.market === market);
            const active = subscription?.status === "active" && subscription.subscriptionPlanId === plan.id;

            return (
              <article className="surface-card" key={plan.id}>
                <strong>{plan.name}</strong>
                <p className="muted" style={{ lineHeight: 1.7 }}>
                  {plan.description}
                </p>
                <p className="muted">
                  {plan.features.join(" • ")}
                </p>
                <p style={{ fontSize: "1.25rem", fontWeight: 700 }}>
                  {price ? `${formatMoney(price.currency, price.amountMinor)} / ${plan.billingInterval}` : "Unavailable"}
                </p>
                <div className="hero-actions" style={{ marginTop: 12 }}>
                  <button
                    className={active ? "ghost-pill" : "cta-pill"}
                    disabled={!price || active || actionLoading === plan.id}
                    onClick={() => void handlePlanCheckout(plan.id)}
                    type="button"
                  >
                    {active ? "Current plan" : actionLoading === plan.id ? "Redirecting..." : "Subscribe"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 30 }}>
        <h2 style={headingStyle}>Cart</h2>
        <article className="surface-card">
          {loading ? <p className="muted">Loading store...</p> : null}
          {!session ? (
            <p className="muted">Sign in to keep a cart, place orders, and start checkout.</p>
          ) : null}
          {session && cart?.items.length ? (
            <div className="stack">
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 16,
                    alignItems: "center",
                    padding: "14px 0",
                    borderBottom: "1px solid rgba(28, 33, 38, 0.08)"
                  }}
                >
                  <div>
                    <strong>{item.productTitle}</strong>
                    <p className="muted" style={{ margin: "6px 0 0" }}>
                      {formatMoney(item.currency, item.totalAmountMinor)}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <button
                      className="ghost-pill"
                      onClick={() => void handleQuantity(item.id, item.quantity - 1)}
                      type="button"
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      className="ghost-pill"
                      onClick={() => void handleQuantity(item.id, item.quantity + 1)}
                      type="button"
                    >
                      +
                    </button>
                    <button
                      className="ghost-pill"
                      onClick={() => void handleQuantity(item.id, 0)}
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 16,
                  flexWrap: "wrap",
                  marginTop: 18
                }}
              >
                <strong>Total: {formatMoney(cart.currency, cart.subtotalAmountMinor)}</strong>
                <button
                  className="cta-pill"
                  disabled={actionLoading === "cart-checkout"}
                  onClick={() => void handleCartCheckout()}
                  type="button"
                >
                  {actionLoading === "cart-checkout" ? "Opening checkout..." : "Checkout cart"}
                </button>
              </div>
            </div>
          ) : null}
          {session && !loading && !cart?.items.length ? (
            <p className="muted">Your cart is empty for the selected market.</p>
          ) : null}
        </article>
      </div>
    </section>
  );
}

function formatMoney(currency: string, amountMinor: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(amountMinor / 100);
}

const headingStyle = {
  margin: "0 0 14px",
  fontSize: "1.15rem",
  textTransform: "uppercase",
  letterSpacing: "0.12em"
} satisfies CSSProperties;
