import Link from "next/link";
import { webSurfaceCopy } from "../../lib/site";

export default function AccountPage() {
  return (
    <section className="panel section">
      <span className="eyebrow">Account</span>
      <h1 style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: "clamp(2.4rem, 5vw, 4rem)", margin: "14px 0 10px" }}>
        A clear home for profile and plans
      </h1>
      <p className="muted" style={{ lineHeight: 1.75, maxWidth: "60ch" }}>
        The account route will eventually surface user details, entitlements, progress summaries,
        and subscription state for {webSurfaceCopy.brandName}.
      </p>

      <div className="feature-grid" style={{ marginTop: "24px" }}>
        <article className="feature-card">
          <h3>Profile</h3>
          <p>Basic identity and preferences.</p>
        </article>
        <article className="feature-card">
          <h3>Plan</h3>
          <p>Subscription and membership state.</p>
        </article>
        <article className="feature-card">
          <h3>Progress</h3>
          <p>Workout and recovery history.</p>
        </article>
      </div>

      <div className="hero-actions" style={{ marginTop: "22px" }}>
        <Link className="cta-pill" href="/">
          Back home
        </Link>
        <Link className="ghost-pill" href="/store">
          Visit store
        </Link>
      </div>
    </section>
  );
}
