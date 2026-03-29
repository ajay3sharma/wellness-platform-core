import type { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function SectionCard({ title, description, children }: SectionCardProps) {
  return (
    <section className="admin-card">
      <p className="eyebrow">{title}</p>
      <p className="muted" style={{ marginTop: 0 }}>
        {description}
      </p>
      <div className="stack-tight">{children}</div>
    </section>
  );
}
