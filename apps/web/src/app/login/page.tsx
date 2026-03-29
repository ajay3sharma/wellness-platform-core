import Link from "next/link";
import { webSurfaceCopy } from "../../lib/site";

export default function LoginPage() {
  return (
    <section className="panel section">
      <span className="eyebrow">Login</span>
      <h1 style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: "clamp(2.4rem, 5vw, 4rem)", margin: "14px 0 10px" }}>
        Sign in to continue
      </h1>
      <p className="muted" style={{ lineHeight: 1.75, maxWidth: "60ch" }}>
        This route is the placeholder for the future custom JWT auth flow. It stays aligned with
        the same shared identity used across {webSurfaceCopy.brandName}.
      </p>

      <div className="surface-grid" style={{ marginTop: "22px" }}>
        <div className="surface-card">
          <strong>Email sign-in</strong>
          <p className="muted">Primary auth method for the first scaffold.</p>
        </div>
        <div className="surface-card">
          <strong>Session bootstrap</strong>
          <p className="muted">Future refresh-token and account handoff logic.</p>
        </div>
      </div>

      <div className="hero-actions" style={{ marginTop: "22px" }}>
        <Link className="cta-pill" href="/">
          Back home
        </Link>
        <Link className="ghost-pill" href="/account">
          Open account
        </Link>
      </div>
    </section>
  );
}
