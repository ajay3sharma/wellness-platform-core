import Link from "next/link";
import type { ReactNode } from "react";
import { adminBrand, adminMetadata, adminTheme } from "../lib/brand";
import { getDemoUser } from "../lib/session";
import { getVisibleNavigation } from "../lib/navigation";

interface AdminShellProps {
  children: ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const user = getDemoUser();
  const visibleGroups = getVisibleNavigation(user.role).filter((group) => group.items.length > 0);
  const isCoach = user.role === "coach";

  return (
    <div className="admin-page-shell">
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
            <span className="pill">
              <strong>{user.role}</strong>
              {isCoach ? "coach access" : "admin access"}
            </span>
            <Link className="button button-secondary" href="/login">
              Sign out
            </Link>
          </div>
        </header>

        <div className="admin-grid">
          <aside className="admin-sidebar">
            <div className="stack">
              <div className="admin-card">
                <p className="eyebrow">Protected Shell</p>
                <h2 className="display-title" style={{ fontSize: "2rem" }}>
                  {adminTheme.headline}
                </h2>
                <p className="display-copy" style={{ fontSize: "0.98rem" }}>
                  {adminTheme.subheadline}
                </p>
              </div>

              <nav className="admin-nav" aria-label="Admin navigation">
                {visibleGroups.map((group) => (
                  <div className="admin-nav-group" key={group.label}>
                    <p className="admin-nav-label">{group.label}</p>
                    {group.items.map((item) => (
                      <Link className="admin-nav-link" href={item.href} key={item.href}>
                        <span>
                          <strong>{item.label}</strong>
                          <br />
                          <span className="muted">{item.description}</span>
                        </span>
                        <span aria-hidden="true">↗</span>
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
