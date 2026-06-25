import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="admin-auth-shell" data-route-theme="admin">
      {children}
    </main>
  );
}
