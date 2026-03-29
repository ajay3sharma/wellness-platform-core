import type { ReactNode } from "react";
import { AdminShell } from "../../components/admin-shell";

interface ShellLayoutProps {
  children: ReactNode;
}

export default function ShellLayout({ children }: ShellLayoutProps) {
  return <AdminShell>{children}</AdminShell>;
}
