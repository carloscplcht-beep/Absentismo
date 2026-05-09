import type { FilterState, Metrics } from "../types/data";
import type { ForecastResult, ImpactRow, TrendAnalysis } from "../types/intelligence";
import { formatCurrency, formatNumber, formatPercent } from "./formatters";
import { activeFilterCount } from "./methodologyUtils";

export const buildExecutiveNarrative = (
  metrics: Metrics,
  forecast: ForecastResult,
  impactRows: ImpactRow[],
  absenceTrend: TrendAnalysis,
  filters: FilterState
) => {
  if (!metrics.totalRegistros) {
    return "Con los filtros aplicados no hay registros suficientes para generar un resumen interpretativo. Revise los filtros o cargue un archivo con datos analiticos.";
  }
  const filtersText = activeFilterCount(filters) ? "Con los filtros aplicados" : "Con el conjunto de datos cargado";
  const top = impactRows.slice(0, 3).map((row) => row.label).join(", ") || "sin categorias destacadas";
  const forecastQuality =
    forecast.quality === "Baja"
      ? "La prevision es debil por falta de historico suficiente."
      : `La calidad de la prevision es ${forecast.quality.toLowerCase()}.`;
  return `${filtersText}, se registran ${formatNumber(metrics.ausenciasUnicas)} ausencias, que acumulan ${formatNumber(metrics.diasAusenciaHastaFinP)} dias de ausencia. De estos, ${formatNumber(metrics.diasSustituidosHastaFinP)} dias han sido sustituidos, lo que supone una cobertura por dias del ${formatPercent(metrics.porcentajeSustitucionDias)}. El coste total asociado a sustituciones asciende a ${formatCurrency(metrics.totalNomina)}. La prevision de cierre anual, calculada con metodologia ${forecast.method}, estima ${formatNumber(forecast.central.diasAusenciaHastaFinP)} dias de ausencia y ${formatCurrency(forecast.central.totalNomina)} de coste. La tendencia mensual del absentismo es ${absenceTrend.direction.toLowerCase()}. Las categorias con mayor impacto gestor son ${top}. ${forecastQuality}`;
};
