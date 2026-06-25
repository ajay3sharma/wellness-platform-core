"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import type { ApiError } from "@platform/types";
import { useWebSession } from "../../lib/session";
import { webSurfaceCopy } from "../../lib/site";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, registerUser, status } = useWebSession();
  const [signInState, setSignInState] = useState({
    email: "",
    password: ""
  });
  const [registerState, setRegisterState] = useState({
    displayName: "",
    email: "",
    password: ""
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "signed-in") {
      router.replace("/account");
    }
  }, [router, status]);

  async function handleSignIn(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await signIn(signInState);
      router.push("/account");
    } catch (unknownError) {
      setError((unknownError as ApiError).message || "Unable to sign in.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRegister(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await registerUser(registerState);
      router.push("/account");
    } catch (unknownError) {
      setError((unknownError as ApiError).message || "Unable to create your account.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel section" data-route-theme="profile">
      <span className="eyebrow">Login</span>
      <h1 className="section-title">Sign in or create your account</h1>
      <p className="lead-copy" style={{ maxWidth: "62ch" }}>
        Use one {webSurfaceCopy.brandName} account for orders, plans, products, and membership access.
      </p>

      {error ? <div className="alert-banner">{error}</div> : null}

      <div className="surface-grid" style={{ marginTop: 24 }}>
        <form className="surface-card stack" onSubmit={handleSignIn}>
          <strong>Sign in</strong>
          <input
            onChange={(event) => setSignInState((current) => ({ ...current, email: event.target.value }))}
            placeholder="Email"
            className="field-input"
            type="email"
            value={signInState.email}
          />
          <input
            onChange={(event) =>
              setSignInState((current) => ({ ...current, password: event.target.value }))
            }
            placeholder="Password"
            className="field-input"
            type="password"
            value={signInState.password}
          />
          <button className="cta-pill" disabled={saving} type="submit">
            {saving ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <form className="surface-card stack" onSubmit={handleRegister}>
          <strong>Create account</strong>
          <input
            onChange={(event) =>
              setRegisterState((current) => ({ ...current, displayName: event.target.value }))
            }
            placeholder="Display name"
            className="field-input"
            value={registerState.displayName}
          />
          <input
            onChange={(event) => setRegisterState((current) => ({ ...current, email: event.target.value }))}
            placeholder="Email"
            className="field-input"
            type="email"
            value={registerState.email}
          />
          <input
            onChange={(event) =>
              setRegisterState((current) => ({ ...current, password: event.target.value }))
            }
            placeholder="Password"
            className="field-input"
            type="password"
            value={registerState.password}
          />
          <button className="cta-pill" disabled={saving} type="submit">
            {saving ? "Creating..." : "Create account"}
          </button>
        </form>
      </div>

      <div className="hero-actions" style={{ marginTop: 22 }}>
        <Link className="ghost-pill" href="/store">
          Browse store
        </Link>
      </div>
    </section>
  );
}
