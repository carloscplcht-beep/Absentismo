import type { TrendAnalysis } from "../types/intelligence";
import { formatCurrency, formatNumber, formatPercent } from "../utils/formatters";
import { ChartCard } from "./ChartCard";
import { KPICard } from "./KPICard";
import { TrendChart } from "./TrendChart";

type TrendSectionProps = {
  title: string;
  trend: TrendAnalysis;
  mode: "absence" | "cost" | "coverage";
};

export function TrendSection({ title, trend, mode }: TrendSectionProps) {
  const last = trend.monthly[trend.monthly.length - 1];
  const peak = [...trend.monthly].sort((a, b) => {
    const left = mode === "cost" ? a.totalNomina : mode === "coverage" ? a.diasNoSustituidos : a.diasAusenciaHastaFinP;
    const right = mode === "cost" ? b.totalNomina : mode === "coverage" ? b.diasNoSustituidos : b.diasAusenciaHastaFinP;
    return right - left;
  })[0];
  return (
    <section className="content-stack">
      <div className="section-title-row">
        <div>
          <span>Serie mensual</span>
          <h2>{title}</h2>
        </div>
        <span className={`status-pill status-pill--${trend.direction === "Ascendente" ? "warn" : trend.direction === "Descendente" ? "good" : "warn"}`}>
          {trend.direction}
        </span>
      </div>
      <div className="kpi-grid kpi-grid--compact">
        <KPICard label="Meses con datos" value={formatNumber(trend.monthly.length)} detail={last ? `Ultimo mes: ${last.label}` : "Sin mes"} />
        <KPICard label="Variacion reciente" value={formatPercent(trend.variation)} detail="Ultimos 3 meses vs 3 anteriores" />
        <KPICard
          label={mode === "cost" ? "Coste ultimo mes" : mode === "coverage" ? "Cobertura ultimo mes" : "Dias ultimo mes"}
          value={mode === "cost" ? formatCurrency(last?.totalNomina ?? 0, true) : mode === "coverage" ? formatPercent(last?.porcentajeSustitucionDias ?? 0) : formatNumber(last?.diasAusenciaHastaFinP ?? 0)}
        />
        <KPICard
          label={mode === "cost" ? "Mes con mayor coste" : mode === "coverage" ? "Mayor no cobertura" : "Mes con mas dias"}
          value={peak ? peak.label : "Sin datos"}
          detail={mode === "cost" ? formatCurrency(peak?.totalNomina ?? 0, true) : mode === "coverage" ? formatNumber(peak?.diasNoSustituidos ?? 0) : formatNumber(peak?.diasAusenciaHastaFinP ?? 0)}
        />
      </div>
      {trend.warnings.map((warning) => <div className="info-banner" key={warning}>{warning}</div>)}
      <ChartCard title={title} subtitle={trend.hasMovingAverage ? "Incluye media movil de 3 meses cuando hay datos suficientes" : "Serie mensual basada en fechas disponibles"}>
        <TrendChart data={trend.monthly} mode={mode} />
      </ChartCard>
    </section>
  );
}
