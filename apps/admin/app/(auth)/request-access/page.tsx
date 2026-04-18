"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { ApiError, Role } from "@platform/types";
import { adminBrand } from "../../../lib/brand";
import { useAdminSession } from "../../../lib/session";

const requestedRoles: Role[] = ["coach", "admin"];

export default function RequestAccessPage() {
  const { requestAccess } = useAdminSession();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("dev-password");
  const [role, setRole] = useState<Role>("coach");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const result = await requestAccess({
        displayName,
        email,
        password,
        role
      });

      setMessage(result.message);
      setDisplayName("");
      setEmail("");
      setPassword("dev-password");
      setRole("coach");
    } catch (unknownError) {
      const apiError = unknownError as ApiError;
      setError(apiError.message || "Unable to submit access request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="admin-auth-card">
      <div className="auth-grid">
        <div className="stack">
          <p className="eyebrow">Privileged Access</p>
          <h1 className="display-title">Request coach or admin access.</h1>
          <p className="display-copy">
            Submit your details and an existing admin will review the request before the account can sign in.
          </p>
          <div className="pill-row">
            <span className="pill">
              <strong>Brand</strong> {adminBrand.productName}
            </span>
            <span className="pill">
              <strong>Roles</strong> coach or admin
            </span>
            <span className="pill">
              <strong>Activation</strong> pending approval
            </span>
          </div>
        </div>

        <div className="admin-card">
          <p className="eyebrow">Request access</p>
          <form className="stack-tight" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="displayName">Display name</label>
              <input
                id="displayName"
                name="displayName"
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Coach Aarya"
                type="text"
                value={displayName}
              />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="coach@example.com"
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
            <div className="field">
              <label htmlFor="role">Requested role</label>
              <select id="role" name="role" onChange={(event) => setRole(event.target.value as Role)} value={role}>
                {requestedRoles.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            {message ? <p className="success-banner">{message}</p> : null}
            {error ? <p className="error-banner">{error}</p> : null}
            <div className="button-row">
              <button className="button button-primary" disabled={submitting} type="submit">
                {submitting ? "Submitting..." : "Submit request"}
              </button>
              <Link className="button button-secondary" href="/login">
                Back to sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
