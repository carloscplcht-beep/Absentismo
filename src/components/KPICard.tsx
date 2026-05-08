import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

type KPICardProps = {
  label: string;
  value: string;
  detail?: string;
  tone?: "neutral" | "good" | "warn" | "bad";
  icon?: ReactNode;
  trend?: "up" | "down";
};

export function KPICard({ label, value, detail, tone = "neutral", icon, trend }: KPICardProps) {
  return (
    <article className={`kpi-card kpi-card--${tone}`}>
      <div className="kpi-card__top">
        <span className="kpi-card__label">{label}</span>
        {icon ? <span className="kpi-card__icon">{icon}</span> : null}
      </div>
      <strong>{value}</strong>
      <div className="kpi-card__detail">
        {trend === "up" ? <ArrowUpRight size={15} /> : null}
        {trend === "down" ? <ArrowDownRight size={15} /> : null}
        <span>{detail ?? " "}</span>
      </div>
    </article>
  );
}
