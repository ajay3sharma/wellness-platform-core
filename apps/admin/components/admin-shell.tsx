"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { adminBrand, adminMetadata } from "../lib/brand";
import { ThemeModeToggle } from "./theme-mode-toggle";
import { getVisibleNavigation } from "../lib/navigation";
import { useAdminSession } from "../lib/session";

interface AdminShellProps {
  children: ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const { session, status, signOut } = useAdminSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "signed-out") {
      router.replace("/login");
      return;
    }

    if (status === "signed-in" && session && !["admin", "coach"].includes(session.user.role)) {
      void signOut().then(() => router.replace("/login"));
    }
  }, [router, session, signOut, status]);

  if (status !== "signed-in" || !session || !["admin", "coach"].includes(session.user.role)) {
    return (
      <div className="admin-page-shell">
        <div className="admin-card">
          <h1 className="display-title" style={{ fontSize: "1.6rem" }}>Preparing workspace</h1>
          <p className="display-copy">Checking access and restoring the current session.</p>
        </div>
      </div>
    );
  }

  const user = session.user;
  const visibleGroups = getVisibleNavigation(user.role).filter((group) => group.items.length > 0);
  const isCoach = user.role === "coach";
  const routeTheme = pathname.startsWith("/commerce")
    ? "store"
    : pathname.startsWith("/content")
      ? "workouts"
      : "admin";

  return (
    <div className="admin-page-shell" data-route-theme={routeTheme}>
      <div className="admin-shell-panel">
        <header className="admin-header">
          <div className="brand-lockup">
            <span className="brand-mark">
              <span className="brand-badge">{adminBrand.shortName.slice(0, 1)}</span>
              {adminBrand.productName}
            </span>
            <strong>{adminMetadata.headline}</strong>
            <span className="muted">{adminMetadata.subheadline}</span>
          </div>

          <div className="button-row">
            <ThemeModeToggle />
            <span className="pill">
              <strong>{user.role}</strong>
              {isCoach ? "coach access" : "admin access"}
            </span>
            <span className="pill">
              <strong>Signed in</strong>
              {user.displayName}
            </span>
            <button
              className="button button-secondary"
              onClick={() => {
                void signOut().then(() => router.replace("/login"));
              }}
              type="button"
            >
              Sign out
            </button>
          </div>
        </header>

        <div className="admin-grid">
          <aside className="admin-sidebar">
            <div className="stack">
              <div>
                <p className="eyebrow">Workspace</p>
                <p className="muted" style={{ margin: 0, lineHeight: 1.45 }}>
                  {adminMetadata.subheadline}
                </p>
              </div>

              <nav className="admin-nav" aria-label="Admin navigation">
                {visibleGroups.map((group) => (
                  <div className="admin-nav-group" key={group.label}>
                    <p className="admin-nav-label">{group.label}</p>
                    {group.items.map((item) => (
                      <Link
                        className="admin-nav-link"
                        data-active={pathname === item.href}
                        href={item.href}
                        key={item.href}
                      >
                        <span>
                          <strong>{item.label}</strong>
                          <br />
                          <span className="muted">{item.description}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                ))}
              </nav>
            </div>
          </aside>

          <main className="admin-main">{children}</main>
        </div>
      </div>
    </div>
  );
}
