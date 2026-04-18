"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import type { ApiError } from "@platform/types";
import { adminBrand, adminMetadata } from "../../../lib/brand";
import { useAdminSession } from "../../../lib/session";

export default function LoginPage() {
  const router = useRouter();
  const { session, signIn, signOut, status } = useAdminSession();
  const [email, setEmail] = useState(adminBrand.supportEmail);
  const [password, setPassword] = useState("dev-password");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "signed-in" && session && ["admin", "coach"].includes(session.user.role)) {
      router.replace("/dashboard");
    }
  }, [router, session, status]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const nextSession = await signIn({ email, password });

      if (!["admin", "coach"].includes(nextSession.user.role)) {
        await signOut();
        setError("This portal is only available to admins and coaches.");
        return;
      }

      router.replace("/dashboard");
    } catch (unknownError) {
      const apiError = unknownError as ApiError;
      setError(apiError.message || "Unable to sign in right now.");
    } finally {
      setSubmitting(false);
    }
  }

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
              <strong>Roles</strong> admin and coach
            </span>
            <span className="pill">
              <strong>Approval</strong> privileged signup requires admin review
            </span>
          </div>
        </div>

        <div className="admin-card">
          <p className="eyebrow">Sign In</p>
          <form className="stack-tight" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder={adminBrand.supportEmail}
                type="email"
                value={email}
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                type="password"
                value={password}
              />
            </div>
            {error ? <p className="error-banner">{error}</p> : null}
            <div className="button-row">
              <button className="button button-primary" disabled={submitting} type="submit">
                {submitting ? "Signing in..." : "Enter workspace"}
              </button>
              <Link className="button button-secondary" href="/request-access">
                Request access
              </Link>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
