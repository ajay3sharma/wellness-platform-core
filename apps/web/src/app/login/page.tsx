"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import type { ApiError } from "@platform/types";
import type { CSSProperties } from "react";
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
    <section className="panel section">
      <span className="eyebrow">Login</span>
      <h1
        style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: "clamp(2.4rem, 5vw, 4rem)",
          margin: "14px 0 10px"
        }}
      >
        Sign in or create your account
      </h1>
      <p className="muted" style={{ lineHeight: 1.75, maxWidth: "62ch" }}>
        Web commerce now uses the same JWT session model as the rest of {webSurfaceCopy.brandName},
        so orders, plans, and entitlements stay attached to one shared account.
      </p>

      {error ? (
        <div
          style={{
            marginTop: 18,
            padding: 14,
            borderRadius: 18,
            border: "1px solid rgba(169, 68, 66, 0.18)",
            background: "rgba(169, 68, 66, 0.08)",
            color: "#8a2c2b"
          }}
        >
          {error}
        </div>
      ) : null}

      <div className="surface-grid" style={{ marginTop: 24 }}>
        <form className="surface-card stack" onSubmit={handleSignIn}>
          <strong>Sign in</strong>
          <input
            onChange={(event) => setSignInState((current) => ({ ...current, email: event.target.value }))}
            placeholder="Email"
            style={fieldStyle}
            type="email"
            value={signInState.email}
          />
          <input
            onChange={(event) =>
              setSignInState((current) => ({ ...current, password: event.target.value }))
            }
            placeholder="Password"
            style={fieldStyle}
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
            style={fieldStyle}
            value={registerState.displayName}
          />
          <input
            onChange={(event) => setRegisterState((current) => ({ ...current, email: event.target.value }))}
            placeholder="Email"
            style={fieldStyle}
            type="email"
            value={registerState.email}
          />
          <input
            onChange={(event) =>
              setRegisterState((current) => ({ ...current, password: event.target.value }))
            }
            placeholder="Password"
            style={fieldStyle}
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

const fieldStyle: CSSProperties = {
  borderRadius: "18px",
  border: "1px solid rgba(28, 33, 38, 0.12)",
  background: "rgba(255, 255, 255, 0.82)",
  padding: "14px 16px"
};
