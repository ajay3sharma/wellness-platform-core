"use client";

import { createApiClient } from "@platform/sdk";
import type { ApiError, EntitlementSnapshot, OrderRecord, UserSubscription } from "@platform/types";
import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useWebSession } from "../../lib/session";
import { webSurfaceCopy } from "../../lib/site";

export default function AccountPage() {
  const { session, status } = useWebSession();
  const api = useMemo(
    () =>
      createApiClient({
        getAccessToken: () => session?.tokens.accessToken
      }),
    [session]
  );
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [entitlements, setEntitlements] = useState<EntitlementSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }

    void (async () => {
      try {
        setLoading(true);
        setError(null);
        const [nextOrders, nextSubscription, nextEntitlements] = await Promise.all([
          api.store.orders(),
          api.store.subscription(),
          api.store.entitlements()
        ]);
        setOrders(nextOrders);
        setSubscription(nextSubscription);
        setEntitlements(nextEntitlements);
      } catch (unknownError) {
        setError((unknownError as ApiError).message || "Unable to load the account view.");
      } finally {
        setLoading(false);
      }
    })();
  }, [api, session]);

  if (status === "booting") {
    return (
      <section className="panel section">
        <span className="eyebrow">Account</span>
        <p className="muted">Restoring your session...</p>
      </section>
    );
  }

  if (!session) {
    return (
      <section className="panel section">
        <span className="eyebrow">Account</span>
        <h1
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: "clamp(2.4rem, 5vw, 4rem)",
            margin: "14px 0 10px"
          }}
        >
          Sign in to view orders and plans
        </h1>
        <p className="muted" style={{ lineHeight: 1.75, maxWidth: "60ch" }}>
          The account route now reflects live order history, entitlements, and subscription status
          for {webSurfaceCopy.brandName}.
        </p>
        <div className="hero-actions" style={{ marginTop: 22 }}>
          <Link className="cta-pill" href="/login">
            Open login
          </Link>
          <Link className="ghost-pill" href="/store">
            Browse store
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="panel section">
      <span className="eyebrow">Account</span>
      <h1
        style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: "clamp(2.4rem, 5vw, 4rem)",
          margin: "14px 0 10px"
        }}
      >
        Orders, entitlements, and subscription state
      </h1>
      <p className="muted" style={{ lineHeight: 1.75, maxWidth: "62ch" }}>
        This account is connected to the shared auth layer, so commerce state stays aligned with the
        same user identity used across the rest of the platform.
      </p>

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

      <div className="feature-grid" style={{ marginTop: 24 }}>
        <article className="feature-card">
          <h3>Profile</h3>
          <p>{session.user.displayName}</p>
          <p className="muted">{session.user.email}</p>
        </article>
        <article className="feature-card">
          <h3>Current Plan</h3>
          <p>{subscription?.status === "active" ? subscription.planName : "No active subscription"}</p>
          <p className="muted">
            {subscription?.status ? `Status: ${subscription.status}` : "You are currently on the free tier."}
          </p>
        </article>
        <article className="feature-card">
          <h3>Owned Products</h3>
          <p>{entitlements?.ownedProducts.length ?? 0}</p>
          <p className="muted">Digital purchases tied to this account.</p>
        </article>
      </div>

      <div className="info-band" style={{ marginTop: 24 }}>
        <div className="surface-card">
          <strong>Subscription</strong>
          {loading ? <p className="muted">Loading subscription...</p> : null}
          {subscription ? (
            <div className="stack" style={{ marginTop: 14 }}>
              <p style={{ margin: 0 }}>{subscription.planName}</p>
              <p className="muted" style={{ margin: 0 }}>
                {formatMoney(subscription.currency, subscription.amountMinor)} / {subscription.billingInterval}
              </p>
              <p className="muted" style={{ margin: 0 }}>
                Current period end: {subscription.currentPeriodEnd ?? "Waiting for provider sync"}
              </p>
            </div>
          ) : !loading ? (
            <p className="muted">No subscription has been activated yet.</p>
          ) : null}
        </div>

        <div className="surface-card">
          <strong>Entitlements</strong>
          {loading ? <p className="muted">Loading entitlements...</p> : null}
          {!loading && entitlements ? (
            <div className="stack" style={{ marginTop: 14 }}>
              <p style={{ margin: 0 }}>User plan: {entitlements.userPlan}</p>
              {entitlements.ownedProducts.length ? (
                entitlements.ownedProducts.map((item) => (
                  <p className="muted" key={item.productId} style={{ margin: 0 }}>
                    {item.title}
                  </p>
                ))
              ) : (
                <p className="muted" style={{ margin: 0 }}>
                  No purchased products yet.
                </p>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <div style={{ marginTop: 28 }}>
        <h2 style={headingStyle}>Order History</h2>
        <div className="surface-grid">
          {orders.map((order) => (
            <article className="surface-card" key={order.id}>
              <strong>{order.id.slice(0, 12)}</strong>
              <p className="muted">{order.status}</p>
              <p>{formatMoney(order.currency, order.amountMinor)}</p>
              <p className="muted">{new Date(order.createdAt).toLocaleString()}</p>
              <div className="stack">
                {order.items.map((item) => (
                  <span className="muted" key={item.id}>
                    {item.title} × {item.quantity}
                  </span>
                ))}
              </div>
            </article>
          ))}
          {!loading && orders.length === 0 ? (
            <article className="surface-card">
              <strong>No orders yet</strong>
              <p className="muted">Completed checkouts will appear here after webhook confirmation.</p>
            </article>
          ) : null}
        </div>
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
