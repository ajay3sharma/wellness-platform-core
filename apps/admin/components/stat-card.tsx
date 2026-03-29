import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string;
  detail: string;
  icon?: ReactNode;
}

export function StatCard({ label, value, detail, icon }: StatCardProps) {
  return (
    <article className="admin-card metric">
      <div className="button-row" style={{ justifyContent: "space-between" }}>
        <p className="eyebrow" style={{ margin: 0 }}>
          {label}
        </p>
        {icon}
      </div>
      <strong className="metric-value">{value}</strong>
      <span className="metric-label">{detail}</span>
    </article>
  );
}
