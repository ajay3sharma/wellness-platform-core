import Link from "next/link";
import { adminBrand, adminMetadata } from "../../../lib/brand";

export default function LoginPage() {
  return (
    <section className="admin-auth-card">
      <div className="auth-grid">
        <div className="stack">
          <p className="eyebrow">Admin Access</p>
          <h1 className="display-title">{adminMetadata.headline}</h1>
          <p className="display-copy">{adminMetadata.description}</p>
          <div className="pill-row">
            <span className="pill">
              <strong>Brand</strong> {adminBrand.productName}
            </span>
            <span className="pill">
              <strong>Role-aware</strong> admin and coach access
            </span>
            <span className="pill">
              <strong>Protected</strong> JWT scaffold next
            </span>
          </div>
        </div>

        <div className="admin-card">
          <p className="eyebrow">Sign In</p>
          <form className="stack-tight">
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" placeholder={adminBrand.supportEmail} type="email" />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" placeholder="••••••••" type="password" />
            </div>
            <div className="button-row">
              <Link className="button button-primary" href="/dashboard">
                Enter admin shell
              </Link>
              <Link className="button button-secondary" href="/dashboard">
                Demo access
              </Link>
            </div>
          </form>
          <p className="muted" style={{ marginBottom: 0 }}>
            This page is a scaffold only. The real JWT auth flow will wire in later through the API.
          </p>
        </div>
      </div>
    </section>
  );
}
