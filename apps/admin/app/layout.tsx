import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { createSurfaceTheme, createThemeCssVariables, DEFAULT_THEME_MODE } from "@platform/ui";
import { adminBrand, adminMetadata } from "../lib/brand";
import { AdminThemeProvider } from "../lib/theme";
import { AdminSessionProvider } from "../lib/session";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(adminBrand.domains.admin),
  title: {
    default: `${adminMetadata.appName} Admin`,
    template: `%s | ${adminMetadata.appName} Admin`
  },
  description: adminMetadata.description,
  applicationName: adminMetadata.appName,
  authors: [{ name: adminBrand.metadata.legalName }],
  openGraph: {
    title: `${adminMetadata.appName} Admin`,
    description: adminMetadata.description,
    siteName: adminMetadata.appName,
    url: adminBrand.domains.admin
  }
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  const themeStyle = createThemeCssVariables(
    createSurfaceTheme(adminBrand, "admin", DEFAULT_THEME_MODE)
  ) as CSSProperties;

  return (
    <html data-theme={DEFAULT_THEME_MODE} lang="en" suppressHydrationWarning>
      <body data-theme={DEFAULT_THEME_MODE} style={themeStyle}>
        <AdminThemeProvider>
          <AdminSessionProvider>{children}</AdminSessionProvider>
        </AdminThemeProvider>
      </body>
    </html>
  );
}
