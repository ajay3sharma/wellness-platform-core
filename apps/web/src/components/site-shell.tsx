"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { webAppMetadata, webNavigation, webSurfaceCopy } from "../lib/site";
import { useWebSession } from "../lib/session";

interface SiteShellProps {
  children: ReactNode;
}

export function SiteShell({ children }: SiteShellProps) {
  const router = useRouter();
  const { session, status, signOut } = useWebSession();

  return (
    <div className="site-shell">
      <header className="topbar">
        <Link className="brand-lockup" href="/">
          <span className="brand-mark" aria-hidden="true">
            {webSurfaceCopy.brandName.slice(0, 2).toUpperCase()}
          </span>
          <span>
            <strong>{webSurfaceCopy.brandName}</strong>
            <small>{webAppMetadata.subheadline}</small>
          </span>
        </Link>

        <nav className="nav">
          {webNavigation.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        {status === "signed-in" && session ? (
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span className="muted" style={{ fontSize: "0.95rem" }}>
              {session.user.displayName}
            </span>
            <button
              className="ghost-pill"
              onClick={() => {
                void signOut().then(() => router.push("/login"));
              }}
              type="button"
            >
              Sign out
            </button>
          </div>
        ) : (
          <Link className="cta-pill" href="/login">
            Sign in
          </Link>
        )}
      </header>

      <main className="main-frame">{children}</main>

      <footer className="footer">
        <p>
          Built for a white-label platform. Public surface for {webSurfaceCopy.brandName} at{" "}
          {webSurfaceCopy.publicUrl}.
        </p>
      </footer>
    </div>
  );
}
