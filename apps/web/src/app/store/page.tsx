import Link from "next/link";
import { webSurfaceCopy } from "../../lib/site";

const categories = [
  "Fitness equipment",
  "Wellness essentials",
  "Recovery tools",
  "Apparel",
  "Supplements"
] as const;

export default function StorePage() {
  return (
    <section className="panel section">
      <span className="eyebrow">Store</span>
      <h1 style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: "clamp(2.4rem, 5vw, 4rem)", margin: "14px 0 10px" }}>
        Commerce shell for the product catalog
      </h1>
      <p className="muted" style={{ lineHeight: 1.75, maxWidth: "60ch" }}>
        This page is the starting point for search, product discovery, cart handoff, and future
        checkout flows connected to {webSurfaceCopy.brandName}.
      </p>

      <div className="surface-grid" style={{ marginTop: "24px" }}>
        {categories.map((category) => (
          <div className="surface-card" key={category}>
            <strong>{category}</strong>
            <p className="muted">Placeholder category lane for the eventual store catalog.</p>
          </div>
        ))}
      </div>

      <div className="hero-actions" style={{ marginTop: "22px" }}>
        <Link className="cta-pill" href="/">
          Back home
        </Link>
        <Link className="ghost-pill" href="/login">
          Sign in
        </Link>
      </div>
    </section>
  );
}
