import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { createSurfaceTheme, createThemeCssVariables, DEFAULT_THEME_MODE } from "@platform/ui";
import { webBrand, webSurfaceCopy, webTitleTemplate } from "../lib/site";
import { WebThemeProvider } from "../lib/theme";
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

const cssVariables: CSSProperties & Record<string, string> = createThemeCssVariables(
  createSurfaceTheme(webBrand, "web", DEFAULT_THEME_MODE)
);

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html data-theme={DEFAULT_THEME_MODE} lang="en" suppressHydrationWarning>
      <body data-theme={DEFAULT_THEME_MODE} style={cssVariables}>
        <WebThemeProvider>
          <WebSessionProvider>
            <SiteShell>{children}</SiteShell>
          </WebSessionProvider>
        </WebThemeProvider>
      </body>
    </html>
  );
}
