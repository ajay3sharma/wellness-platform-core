"use client";

import { createApiClient } from "@platform/sdk";
import type {
  ApiError,
  CatalogProductListItem,
  OrderRecord,
  SaveCatalogProductRequest,
  SaveSubscriptionPlanRequest,
  SubscriptionPlanDetail,
  UserPlan,
  UserSubscription
} from "@platform/types";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAdminSession } from "../lib/session";

type CommerceSection = "products" | "plans" | "orders" | "subscriptions";

interface ProductFormState {
  title: string;
  description: string;
  category: string;
  tags: string;
  coverImageUrl: string;
  purchaseLabel: string;
  indiaPrice: string;
  globalPrice: string;
}

interface PlanFormState {
  name: string;
  description: string;
  userPlan: UserPlan;
  billingInterval: "month" | "year";
  features: string;
  indiaPrice: string;
  globalPrice: string;
}

const sections: Array<{ key: CommerceSection; label: string }> = [
  { key: "products", label: "Products" },
  { key: "plans", label: "Plans" },
  { key: "orders", label: "Orders" },
  { key: "subscriptions", label: "Subscriptions" }
];

function createProductForm(): ProductFormState {
  return {
    title: "",
    description: "",
    category: "",
    tags: "",
    coverImageUrl: "",
    purchaseLabel: "Add to cart",
    indiaPrice: "99900",
    globalPrice: "1900"
  };
}

function createPlanForm(): PlanFormState {
  return {
    name: "",
    description: "",
    userPlan: "plus",
    billingInterval: "month",
    features: "",
    indiaPrice: "149900",
    globalPrice: "2900"
  };
}

export function CommerceStudio() {
  const { session } = useAdminSession();
  const api = useMemo(
    () =>
      createApiClient({
        getAccessToken: () => session?.tokens.accessToken
      }),
    [session]
  );

  const [currentSection, setCurrentSection] = useState<CommerceSection>("products");
  const [products, setProducts] = useState<CatalogProductListItem[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlanDetail[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [productForm, setProductForm] = useState<ProductFormState>(createProductForm);
  const [planForm, setPlanForm] = useState<PlanFormState>(createPlanForm);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session || session.user.role !== "admin") {
      setLoading(false);
      return;
    }

    void loadCommerce();
  }, [api, session]);

  async function loadCommerce() {
    if (!session || session.user.role !== "admin") {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [nextProducts, nextPlans, nextOrders, nextSubscriptions] = await Promise.all([
        api.adminCommerce.products.list(),
        api.adminCommerce.plans.list(),
        api.adminCommerce.orders.list(),
        api.adminCommerce.subscriptions.list()
      ]);

      setProducts(nextProducts);
      setPlans(nextPlans);
      setOrders(nextOrders);
      setSubscriptions(nextSubscriptions);
    } catch (unknownError) {
      setError((unknownError as ApiError).message || "Unable to load commerce data.");
    } finally {
      setLoading(false);
    }
  }

  function resetProductForm() {
    setEditingProductId(null);
    setProductForm(createProductForm());
  }

  function resetPlanForm() {
    setEditingPlanId(null);
    setPlanForm(createPlanForm());
  }

  function startEditProduct(product: CatalogProductListItem) {
    setEditingProductId(product.id);
    setProductForm({
      title: product.title,
      description: product.description,
      category: product.category ?? "",
      tags: product.tags.join(", "),
      coverImageUrl: product.coverImageUrl ?? "",
      purchaseLabel: product.purchaseLabel ?? "",
      indiaPrice: String(product.activePrices.find((price) => price.market === "india")?.amountMinor ?? ""),
      globalPrice: String(product.activePrices.find((price) => price.market === "global")?.amountMinor ?? "")
    });
  }

  function startEditPlan(plan: SubscriptionPlanDetail) {
    setEditingPlanId(plan.id);
    setPlanForm({
      name: plan.name,
      description: plan.description,
      userPlan: plan.userPlan,
      billingInterval: plan.billingInterval,
      features: plan.features.join(", "),
      indiaPrice: String(plan.activePrices.find((price) => price.market === "india")?.amountMinor ?? ""),
      globalPrice: String(plan.activePrices.find((price) => price.market === "global")?.amountMinor ?? "")
    });
  }

  async function handleProductSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload: SaveCatalogProductRequest = {
        title: productForm.title,
        description: productForm.description,
        category: productForm.category || null,
        tags: productForm.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        coverImageUrl: productForm.coverImageUrl || null,
        purchaseLabel: productForm.purchaseLabel || null,
        prices: [
          {
            market: "india",
            amountMinor: Number(productForm.indiaPrice)
          },
          {
            market: "global",
            amountMinor: Number(productForm.globalPrice)
          }
        ]
      };

      if (editingProductId) {
        await api.adminCommerce.products.update(editingProductId, payload);
      } else {
        await api.adminCommerce.products.create(payload);
      }

      await loadCommerce();
      resetProductForm();
    } catch (unknownError) {
      setError((unknownError as ApiError).message || "Unable to save product.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePlanSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload: SaveSubscriptionPlanRequest = {
        name: planForm.name,
        description: planForm.description,
        userPlan: planForm.userPlan,
        billingInterval: planForm.billingInterval,
        features: planForm.features.split(",").map((feature) => feature.trim()).filter(Boolean),
        prices: [
          {
            market: "india",
            amountMinor: Number(planForm.indiaPrice)
          },
          {
            market: "global",
            amountMinor: Number(planForm.globalPrice)
          }
        ]
      };

      if (editingPlanId) {
        await api.adminCommerce.plans.update(editingPlanId, payload);
      } else {
        await api.adminCommerce.plans.create(payload);
      }

      await loadCommerce();
      resetPlanForm();
    } catch (unknownError) {
      setError((unknownError as ApiError).message || "Unable to save plan.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleProductPublish(product: CatalogProductListItem) {
    try {
      if (product.status === "published") {
        await api.adminCommerce.products.unpublish(product.id);
      } else {
        await api.adminCommerce.products.publish(product.id);
      }
      await loadCommerce();
    } catch (unknownError) {
      setError((unknownError as ApiError).message || "Unable to update product status.");
    }
  }

  async function togglePlanPublish(plan: SubscriptionPlanDetail) {
    try {
      if (plan.status === "published") {
        await api.adminCommerce.plans.unpublish(plan.id);
      } else {
        await api.adminCommerce.plans.publish(plan.id);
      }
      await loadCommerce();
    } catch (unknownError) {
      setError((unknownError as ApiError).message || "Unable to update plan status.");
    }
  }

  if (!session) {
    return null;
  }

  if (session.user.role !== "admin") {
    return (
      <div className="stack">
        <section className="hero">
          <div className="hero-panel">
            <p className="eyebrow">Commerce</p>
            <h1 className="display-title">Admin-only workspace</h1>
            <p className="display-copy">
              Product, pricing, and billing operations stay reserved for admins in Phase 3.
            </p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="stack">
      <section className="hero">
        <div className="hero-panel">
          <p className="eyebrow">Commerce Studio</p>
          <h1 className="display-title">Manage products, plans, and billing operations.</h1>
          <p className="display-copy">
            Phase 3 turns the commerce workspace into a real source of truth for digital catalog,
            subscriptions, and operational monitoring.
          </p>
          {error ? <p style={{ color: "#8a2c2b" }}>{error}</p> : null}
        </div>

        <div className="hero-grid">
          <div className="metric-card">
            <strong>{products.filter((item) => item.status === "published").length}</strong>
            <span>Published products</span>
          </div>
          <div className="metric-card">
            <strong>{plans.filter((item) => item.status === "published").length}</strong>
            <span>Published plans</span>
          </div>
          <div className="metric-card">
            <strong>{orders.filter((item) => item.status === "paid").length}</strong>
            <span>Paid orders</span>
          </div>
          <div className="metric-card">
            <strong>{subscriptions.filter((item) => item.status === "active").length}</strong>
            <span>Active subscriptions</span>
          </div>
        </div>
      </section>

      <section className="admin-card">
        <p className="eyebrow">Workspace</p>
        <div className="pill-row">
          {sections.map((section) => (
            <button
              className="button"
              data-variant={currentSection === section.key ? "primary" : "secondary"}
              key={section.key}
              onClick={() => setCurrentSection(section.key)}
              type="button"
            >
              {section.label}
            </button>
          ))}
        </div>
      </section>

      {currentSection === "products" ? (
        <section className="split-grid">
          <div className="admin-card">
            <p className="eyebrow">{editingProductId ? "Edit product" : "New product"}</p>
            <form className="stack-tight" onSubmit={handleProductSubmit}>
              <div className="field">
                <label htmlFor="product-title">Title</label>
                <input
                  id="product-title"
                  onChange={(event) => setProductForm((current) => ({ ...current, title: event.target.value }))}
                  value={productForm.title}
                />
              </div>
              <div className="field">
                <label htmlFor="product-description">Description</label>
                <textarea
                  id="product-description"
                  onChange={(event) =>
                    setProductForm((current) => ({ ...current, description: event.target.value }))
                  }
                  rows={4}
                  value={productForm.description}
                />
              </div>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="product-category">Category</label>
                  <input
                    id="product-category"
                    onChange={(event) =>
                      setProductForm((current) => ({ ...current, category: event.target.value }))
                    }
                    value={productForm.category}
                  />
                </div>
                <div className="field">
                  <label htmlFor="product-tags">Tags</label>
                  <input
                    id="product-tags"
                    onChange={(event) => setProductForm((current) => ({ ...current, tags: event.target.value }))}
                    placeholder="mobility, recovery"
                    value={productForm.tags}
                  />
                </div>
              </div>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="product-cover">Cover image URL</label>
                  <input
                    id="product-cover"
                    onChange={(event) =>
                      setProductForm((current) => ({ ...current, coverImageUrl: event.target.value }))
                    }
                    value={productForm.coverImageUrl}
                  />
                </div>
                <div className="field">
                  <label htmlFor="product-label">Purchase label</label>
                  <input
                    id="product-label"
                    onChange={(event) =>
                      setProductForm((current) => ({ ...current, purchaseLabel: event.target.value }))
                    }
                    value={productForm.purchaseLabel}
                  />
                </div>
              </div>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="product-india-price">India price (minor)</label>
                  <input
                    id="product-india-price"
                    onChange={(event) =>
                      setProductForm((current) => ({ ...current, indiaPrice: event.target.value }))
                    }
                    type="number"
                    value={productForm.indiaPrice}
                  />
                </div>
                <div className="field">
                  <label htmlFor="product-global-price">Global price (minor)</label>
                  <input
                    id="product-global-price"
                    onChange={(event) =>
                      setProductForm((current) => ({ ...current, globalPrice: event.target.value }))
                    }
                    type="number"
                    value={productForm.globalPrice}
                  />
                </div>
              </div>
              <div className="button-row">
                <button className="button button-primary" disabled={saving} type="submit">
                  {saving ? "Saving..." : editingProductId ? "Update product" : "Create product"}
                </button>
                <button className="button button-secondary" onClick={resetProductForm} type="button">
                  Reset form
                </button>
              </div>
            </form>
          </div>

          <div className="admin-card">
            <p className="eyebrow">Product catalog</p>
            {loading ? <p className="muted">Loading products...</p> : null}
            <div className="stack-tight">
              {products.map((product) => (
                <div className="exercise-card" key={product.id}>
                  <div className="button-row">
                    <div>
                      <strong>{product.title}</strong>
                      <p className="muted" style={{ marginTop: 6 }}>
                        {product.category ?? "Uncategorized"}
                      </p>
                    </div>
                    <span className="status">{product.status}</span>
                  </div>
                  <p className="muted">{product.description}</p>
                  <div className="pill-row">
                    {product.activePrices.map((price) => (
                      <span className="pill" key={price.id}>
                        {price.market}: {formatMoney(price.currency, price.amountMinor)}
                      </span>
                    ))}
                  </div>
                  <div className="button-row">
                    <button className="button button-secondary" onClick={() => startEditProduct(product)} type="button">
                      Edit
                    </button>
                    <button
                      className="button button-primary"
                      onClick={() => void toggleProductPublish(product)}
                      type="button"
                    >
                      {product.status === "published" ? "Unpublish" : "Publish"}
                    </button>
                  </div>
                </div>
              ))}
              {!loading && products.length === 0 ? <p className="muted">No products created yet.</p> : null}
            </div>
          </div>
        </section>
      ) : null}

      {currentSection === "plans" ? (
        <section className="split-grid">
          <div className="admin-card">
            <p className="eyebrow">{editingPlanId ? "Edit plan" : "New plan"}</p>
            <form className="stack-tight" onSubmit={handlePlanSubmit}>
              <div className="field">
                <label htmlFor="plan-name">Name</label>
                <input
                  id="plan-name"
                  onChange={(event) => setPlanForm((current) => ({ ...current, name: event.target.value }))}
                  value={planForm.name}
                />
              </div>
              <div className="field">
                <label htmlFor="plan-description">Description</label>
                <textarea
                  id="plan-description"
                  onChange={(event) =>
                    setPlanForm((current) => ({ ...current, description: event.target.value }))
                  }
                  rows={4}
                  value={planForm.description}
                />
              </div>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="plan-user-plan">Mapped user plan</label>
                  <select
                    id="plan-user-plan"
                    onChange={(event) =>
                      setPlanForm((current) => ({
                        ...current,
                        userPlan: event.target.value as UserPlan
                      }))
                    }
                    value={planForm.userPlan}
                  >
                    <option value="free">free</option>
                    <option value="plus">plus</option>
                    <option value="pro">pro</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="plan-interval">Billing interval</label>
                  <select
                    id="plan-interval"
                    onChange={(event) =>
                      setPlanForm((current) => ({
                        ...current,
                        billingInterval: event.target.value as "month" | "year"
                      }))
                    }
                    value={planForm.billingInterval}
                  >
                    <option value="month">month</option>
                    <option value="year">year</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label htmlFor="plan-features">Features</label>
                <input
                  id="plan-features"
                  onChange={(event) =>
                    setPlanForm((current) => ({ ...current, features: event.target.value }))
                  }
                  placeholder="priority access, premium library"
                  value={planForm.features}
                />
              </div>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="plan-india-price">India price (minor)</label>
                  <input
                    id="plan-india-price"
                    onChange={(event) =>
                      setPlanForm((current) => ({ ...current, indiaPrice: event.target.value }))
                    }
                    type="number"
                    value={planForm.indiaPrice}
                  />
                </div>
                <div className="field">
                  <label htmlFor="plan-global-price">Global price (minor)</label>
                  <input
                    id="plan-global-price"
                    onChange={(event) =>
                      setPlanForm((current) => ({ ...current, globalPrice: event.target.value }))
                    }
                    type="number"
                    value={planForm.globalPrice}
                  />
                </div>
              </div>
              <div className="button-row">
                <button className="button button-primary" disabled={saving} type="submit">
                  {saving ? "Saving..." : editingPlanId ? "Update plan" : "Create plan"}
                </button>
                <button className="button button-secondary" onClick={resetPlanForm} type="button">
                  Reset form
                </button>
              </div>
            </form>
          </div>

          <div className="admin-card">
            <p className="eyebrow">Plan catalog</p>
            {loading ? <p className="muted">Loading plans...</p> : null}
            <div className="stack-tight">
              {plans.map((plan) => (
                <div className="exercise-card" key={plan.id}>
                  <div className="button-row">
                    <div>
                      <strong>{plan.name}</strong>
                      <p className="muted" style={{ marginTop: 6 }}>
                        {plan.userPlan} • {plan.billingInterval}
                      </p>
                    </div>
                    <span className="status">{plan.status}</span>
                  </div>
                  <p className="muted">{plan.description}</p>
                  <div className="pill-row">
                    {plan.activePrices.map((price) => (
                      <span className="pill" key={price.id}>
                        {price.market}: {formatMoney(price.currency, price.amountMinor)}
                      </span>
                    ))}
                  </div>
                  <div className="button-row">
                    <button className="button button-secondary" onClick={() => startEditPlan(plan)} type="button">
                      Edit
                    </button>
                    <button
                      className="button button-primary"
                      onClick={() => void togglePlanPublish(plan)}
                      type="button"
                    >
                      {plan.status === "published" ? "Unpublish" : "Publish"}
                    </button>
                  </div>
                </div>
              ))}
              {!loading && plans.length === 0 ? <p className="muted">No subscription plans created yet.</p> : null}
            </div>
          </div>
        </section>
      ) : null}

      {currentSection === "orders" ? (
        <section className="admin-card">
          <p className="eyebrow">Orders</p>
          {loading ? <p className="muted">Loading orders...</p> : null}
          <div className="stack-tight">
            {orders.map((order) => (
              <div className="exercise-card" key={order.id}>
                <div className="button-row">
                  <div>
                    <strong>{order.userDisplayName ?? order.userEmail ?? order.userId}</strong>
                    <p className="muted" style={{ marginTop: 6 }}>
                      {order.id.slice(0, 12)} • {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="status">{order.status}</span>
                </div>
                <p className="muted">
                  {order.provider} • {order.market} • {formatMoney(order.currency, order.amountMinor)}
                </p>
                <div className="pill-row">
                  {order.items.map((item) => (
                    <span className="pill" key={item.id}>
                      {item.title} × {item.quantity}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {!loading && orders.length === 0 ? <p className="muted">No orders yet.</p> : null}
          </div>
        </section>
      ) : null}

      {currentSection === "subscriptions" ? (
        <section className="admin-card">
          <p className="eyebrow">Subscriptions</p>
          {loading ? <p className="muted">Loading subscriptions...</p> : null}
          <div className="stack-tight">
            {subscriptions.map((subscription) => (
              <div className="exercise-card" key={subscription.id}>
                <div className="button-row">
                  <div>
                    <strong>{subscription.userDisplayName ?? subscription.userEmail ?? subscription.userId}</strong>
                    <p className="muted" style={{ marginTop: 6 }}>
                      {subscription.planName} • {subscription.userPlan}
                    </p>
                  </div>
                  <span className="status">{subscription.status}</span>
                </div>
                <p className="muted">
                  {subscription.provider} • {subscription.market} •{" "}
                  {formatMoney(subscription.currency, subscription.amountMinor)} / {subscription.billingInterval}
                </p>
                <p className="muted">
                  Current period end: {subscription.currentPeriodEnd ?? "Waiting for webhook sync"}
                </p>
              </div>
            ))}
            {!loading && subscriptions.length === 0 ? <p className="muted">No subscriptions yet.</p> : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function formatMoney(currency: string, amountMinor: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(amountMinor / 100);
}
