import Link from "next/link";
import { webHighlights, webPillars, webStats } from "../lib/site";

export default function HomePage() {
  return (
    <div className="stack" data-route-theme="home">
      <section className="section-block">
        <div className="home-welcome">
          <h1>Good morning</h1>
          <p>Ready to nourish your mind and body today?</p>
        </div>

        <div className="focus-card">
          <span className="eyebrow">Today's focus</span>
          <div className="focus-quote">"The body achieves what the mind believes."</div>
          <p className="muted" style={{ margin: 0 }}>
            A calm place for training, reset, membership, and progress.
          </p>
          <div className="hero-actions" style={{ justifyContent: "center" }}>
            <Link className="cta-pill" href="/account">
              Open dashboard
            </Link>
            <Link className="ghost-pill" href="/store">
              Browse store
            </Link>
          </div>
        </div>

        <h2 className="journey-title">Your Wellness Journey</h2>
        <div className="journey-grid">
          <article className="journey-card" data-route-theme="workouts">
            <span className="route-orb">↯</span>
            <strong>{webStats[0]?.value ?? "4"}</strong>
            <span className="muted">{webStats[0]?.label ?? "Day streak"}</span>
          </article>
          <article className="journey-card" data-route-theme="progress">
            <span className="route-orb">↗</span>
            <strong>{webStats[1]?.value ?? "0/3"}</strong>
            <span className="muted">{webStats[1]?.label ?? "This week"}</span>
          </article>
          <article className="journey-card" data-route-theme="store">
            <span className="route-orb">◎</span>
            <strong>{webStats[2]?.value ?? "42"}</strong>
            <span className="muted">{webStats[2]?.label ?? "Total sessions"}</span>
          </article>
        </div>
      </section>

      <section className="panel section">
        <h2>What is available</h2>
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
          <h2>Account connected</h2>
          <p className="muted" style={{ lineHeight: 1.7 }}>
            Sign in once to keep membership, digital purchases, and order history attached to the
            same account.
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
              <p className="muted">Sign in or create a member account.</p>
              <Link href="/login">Open route</Link>
            </div>
            <div className="surface-card">
              <strong>Account</strong>
              <p className="muted">Profile, plan, products, and order history.</p>
              <Link href="/account">Open route</Link>
            </div>
            <div className="surface-card">
              <strong>Store</strong>
              <p className="muted">Digital products and memberships.</p>
              <Link href="/store">Open route</Link>
            </div>
            <div className="surface-card">
              <strong>Home</strong>
              <p className="muted">Return to the overview.</p>
              <Link href="/">Back home</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
