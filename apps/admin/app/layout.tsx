import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { adminBrand, adminMetadata } from "../lib/brand";
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
  const themeStyle = {
    "--brand-primary": adminBrand.theme.primary,
    "--brand-accent": adminBrand.theme.accent,
    "--brand-surface": adminBrand.theme.surface
  } as CSSProperties;

  return (
    <html lang="en">
      <body style={themeStyle}>
        <AdminSessionProvider>{children}</AdminSessionProvider>
      </body>
    </html>
  );
}
