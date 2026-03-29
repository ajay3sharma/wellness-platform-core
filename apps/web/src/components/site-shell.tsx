import Link from "next/link";
import type { ReactNode } from "react";
import { webAppMetadata, webNavigation, webSurfaceCopy } from "../lib/site";

interface SiteShellProps {
  children: ReactNode;
}

export function SiteShell({ children }: SiteShellProps) {
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

        <Link className="cta-pill" href="/login">
          Sign in
        </Link>
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
