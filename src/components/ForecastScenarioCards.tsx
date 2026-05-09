import type { ForecastResult } from "../types/intelligence";
import { formatCurrency, formatNumber, formatPercent } from "../utils/formatters";
import { KPICard } from "./KPICard";

export function ForecastScenarioCards({ forecast }: { forecast: ForecastResult }) {
  return (
    <div className="kpi-grid">
      <KPICard label="Prevision dias ausencia" value={formatNumber(forecast.central.diasAusenciaHastaFinP)} detail={`Metodo: ${forecast.method}`} />
      <KPICard label="Prevision coste total" value={formatCurrency(forecast.central.totalNomina, true)} detail={formatCurrency(forecast.central.totalNomina)} />
      <KPICard label="Prevision dias no sustituidos" value={formatNumber(forecast.central.diasNoSustituidos)} tone={forecast.central.diasNoSustituidos ? "warn" : "good"} />
      <KPICard label="Cobertura prevista" value={formatPercent(forecast.central.porcentajeSustitucionDias)} />
      <KPICard label="Meses con datos" value={formatNumber(forecast.monthsWithData)} detail={`Ultimo mes: ${forecast.lastMonthLabel}`} />
      <KPICard label="Calidad de prevision" value={forecast.quality} detail="Alta 18+ meses, media 6+, baja <6" />
    </div>
  );
}
