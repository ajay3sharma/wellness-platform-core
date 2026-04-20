import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { webSurfaceCopy, webTheme, webTitleTemplate } from "../lib/site";
import { SiteShell } from "../components/site-shell";
import { WebSessionProvider } from "../lib/session";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: webSurfaceCopy.brandName,
    template: webTitleTemplate
  },
  description: webSurfaceCopy.description,
  metadataBase: new URL(webSurfaceCopy.publicUrl)
};

const cssVariables: CSSProperties & Record<string, string> = {
  "--brand-primary": webTheme.colors.primary,
  "--brand-secondary": webTheme.colors.secondary,
  "--brand-accent": webTheme.colors.accent,
  "--brand-surface": webTheme.colors.surface
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body style={cssVariables}>
        <WebSessionProvider>
          <SiteShell>{children}</SiteShell>
        </WebSessionProvider>
      </body>
    </html>
  );
}
