import Link from "next/link";
import { webHighlights, webPillars, webStats, webSurfaceCopy } from "../lib/site";

export default function HomePage() {
  return (
    <div className="stack">
      <section className="hero">
        <div className="panel hero-copy">
          <span className="eyebrow">White-label wellness platform</span>
          <h1>{webSurfaceCopy.headline}</h1>
          <p>{webSurfaceCopy.description}</p>
          <div className="hero-actions">
            <Link className="cta-pill" href="/account">
              Open dashboard
            </Link>
            <Link className="ghost-pill" href="/store">
              Browse store
            </Link>
          </div>
        </div>

        <aside className="panel hero-side">
          <div className="stat-grid">
            {webStats.map((stat) => (
              <div className="stat-card" key={stat.label}>
                <strong>{stat.value}</strong>
                <span className="muted">{stat.label}</span>
              </div>
            ))}
          </div>

          <div className="note-card">
            <div className="eyebrow">Current brand</div>
            <h3 style={{ margin: "12px 0 8px" }}>{webSurfaceCopy.brandName}</h3>
            <p className="muted" style={{ margin: 0, lineHeight: 1.7 }}>
              The web shell reads its identity from shared brand config, so the same codebase can
              rebrand without rewriting the UI.
            </p>
          </div>
        </aside>
      </section>

      <section className="panel section">
        <h2>What this shell already frames</h2>
        <div className="feature-grid">
          {webPillars.map((item) => (
            <article className="feature-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="info-band">
        <div className="panel metric-card">
          <h2>Shared foundation</h2>
          <p className="muted" style={{ lineHeight: 1.7 }}>
            Auth, config, and SDK contracts are designed to stay shared across web, admin, mobile,
            and API. The web surface uses the same brand and runtime config as the other apps.
          </p>
          <div className="stack">
            {webHighlights.map((item) => (
              <div key={item} className="surface-card">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="panel section">
          <h2>Next routes</h2>
          <div className="surface-grid">
            <div className="surface-card">
              <strong>Login</strong>
              <p className="muted">Auth entry point and future JWT session handoff.</p>
              <Link href="/login">Open route</Link>
            </div>
            <div className="surface-card">
              <strong>Account</strong>
              <p className="muted">Profile, plan, and entitlement placeholder shell.</p>
              <Link href="/account">Open route</Link>
            </div>
            <div className="surface-card">
              <strong>Store</strong>
              <p className="muted">Catalog and commerce placeholder shell.</p>
              <Link href="/store">Open route</Link>
            </div>
            <div className="surface-card">
              <strong>Brand-ready layout</strong>
              <p className="muted">All page identity comes from shared brand metadata.</p>
              <Link href="/">Back home</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
