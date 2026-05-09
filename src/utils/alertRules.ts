import type { AggregateRow, Metrics, ParsedWorkbook } from "../types/data";
import type { ManagerAlert, TrendAnalysis } from "../types/intelligence";
import { formatCurrency, formatNumber, formatPercent } from "./formatters";

const alert = (
  id: string,
  title: string,
  priority: ManagerAlert["priority"],
  area: string,
  explanation: string,
  evidence: string,
  suggestedAction: string,
  type: string
): ManagerAlert => ({ id, title, priority, area, explanation, evidence, suggestedAction, type });

export const generateAlerts = (
  metrics: Metrics,
  categoryRows: AggregateRow[],
  absenceTrend: TrendAnalysis,
  costTrend: TrendAnalysis,
  parsed: ParsedWorkbook
): ManagerAlert[] => {
  const alerts: ManagerAlert[] = [];
  if (metrics.diasAusenciaHastaFinP > 100 && metrics.porcentajeSustitucionDias < 0.5) {
    alerts.push(alert(
      "global-low-coverage",
      "Baja cobertura global",
      "Alta prioridad",
      "Conjunto filtrado",
      "La cobertura por dias se situa por debajo del 50% con volumen relevante de ausencia.",
      `${formatPercent(metrics.porcentajeSustitucionDias)} de cobertura y ${formatNumber(metrics.diasAusenciaHastaFinP)} dias de ausencia.`,
      "Revisar criterios de priorizacion de sustituciones y categorias con mayor ausencia no cubierta.",
      "Cobertura"
    ));
  }

  categoryRows.filter((row) => row.diasAusencia > 50 && row.porcentajeSustitucion < 0.5).slice(0, 5).forEach((row, index) => {
    alerts.push(alert(
      `category-low-coverage-${index}`,
      "Baja cobertura por categoria",
      "Alta prioridad",
      row.label,
      "Categoria con menos del 50% de cobertura y mas de 50 dias de ausencia.",
      `${formatPercent(row.porcentajeSustitucion)} de cobertura y ${formatNumber(row.diasAusencia)} dias.`,
      "Analizar disponibilidad de suplentes y prioridad gestora de cobertura en esta categoria.",
      "Cobertura por categoria"
    ));
  });

  categoryRows.filter((row) => row.porcentajeTotalCoste > 0.2 && metrics.totalNomina > 0).slice(0, 4).forEach((row, index) => {
    alerts.push(alert(
      `cost-concentration-${index}`,
      "Alta concentracion de coste",
      row.porcentajeTotalCoste > 0.35 ? "Alta prioridad" : "Prioridad media",
      row.label,
      "Una categoria concentra mas del 20% del coste total filtrado.",
      `${formatPercent(row.porcentajeTotalCoste)} del coste: ${formatCurrency(row.totalNomina)}.`,
      "Monitorizar coste por dia sustituido y modalidad de provision asociada.",
      "Coste"
    ));
  });

  categoryRows.filter((row) => metrics.diasNoSustituidos > 0 && row.diasNoSustituidos / metrics.diasNoSustituidos > 0.2 && row.diasNoSustituidos > 20).slice(0, 4).forEach((row, index) => {
    alerts.push(alert(
      `uncovered-concentration-${index}`,
      "Concentracion de dias no sustituidos",
      "Alta prioridad",
      row.label,
      "Una categoria concentra mas del 20% de los dias no sustituidos.",
      `${formatNumber(row.diasNoSustituidos)} dias no sustituidos.`,
      "Priorizar analisis de impacto asistencial potencial en esta categoria.",
      "Ausencia no cubierta"
    ));
  });

  categoryRows.filter((row) => row.diasSustituidos >= 10 && metrics.costeMedioDiaSustituido > 0 && row.costeDiaSustituido > metrics.costeMedioDiaSustituido * 1.25).slice(0, 5).forEach((row, index) => {
    alerts.push(alert(
      `high-cost-day-${index}`,
      "Coste por dia sustituido elevado",
      "Prioridad media",
      row.label,
      "El coste por dia sustituido supera en mas del 25% la media global con volumen minimo de dias sustituidos.",
      `${formatCurrency(row.costeDiaSustituido)} frente a media ${formatCurrency(metrics.costeMedioDiaSustituido)}.`,
      "Revisar si existen diferencias por categoria o tipo de provision.",
      "Coste medio"
    ));
  });

  if (absenceTrend.monthly.length >= 6 && absenceTrend.variation > 0.15) {
    alerts.push(alert(
      "absence-uptrend",
      "Tendencia ascendente de absentismo",
      "Prioridad media",
      "Serie mensual",
      "Los ultimos tres meses superan en mas del 15% a los tres meses anteriores.",
      `Variacion reciente: ${formatPercent(absenceTrend.variation)}.`,
      "Analizar si el incremento responde a estacionalidad u otros factores organizativos observables.",
      "Tendencia"
    ));
  }

  if (costTrend.monthly.length >= 6 && costTrend.variation > 0.15) {
    alerts.push(alert(
      "cost-uptrend",
      "Incremento reciente de coste",
      "Prioridad media",
      "Serie mensual de coste",
      "Los ultimos tres meses superan en mas del 15% el coste de los tres meses anteriores.",
      `Variacion reciente: ${formatPercent(costTrend.variation)}.`,
      "Monitorizar categorias y provisiones que explican el incremento.",
      "Coste"
    ));
  }

  const top3 = categoryRows.slice(0, 3);
  const top3Days = top3.reduce((sum, row) => sum + row.diasAusencia, 0);
  const top3Cost = top3.reduce((sum, row) => sum + row.totalNomina, 0);
  if (metrics.diasAusenciaHastaFinP > 100 && top3Days / metrics.diasAusenciaHastaFinP > 0.5) {
    alerts.push(alert(
      "top3-days",
      "Concentracion top 3 de dias",
      "Prioridad media",
      "Top 3 categorias",
      "Las tres principales categorias acumulan mas del 50% de los dias de ausencia.",
      `${formatPercent(top3Days / metrics.diasAusenciaHastaFinP)} de los dias.`,
      "Focalizar el analisis operativo antes de adoptar medidas generales.",
      "Concentracion"
    ));
  }
  if (metrics.totalNomina > 0 && top3Cost / metrics.totalNomina > 0.5) {
    alerts.push(alert(
      "top3-cost",
      "Concentracion top 3 de coste",
      "Informativa",
      "Top 3 categorias",
      "Las tres principales categorias acumulan mas del 50% del coste.",
      `${formatPercent(top3Cost / metrics.totalNomina)} del coste.`,
      "Revisar el peso economico de las categorias principales en el seguimiento mensual.",
      "Concentracion"
    ));
  }

  if (parsed.warnings.length || absenceTrend.warnings.length || costTrend.warnings.length) {
    alerts.push(alert(
      "data-quality",
      "Limitaciones de calidad de dato",
      "Informativa",
      "Modelo de datos",
      "Existen avisos metodologicos o columnas no disponibles que pueden limitar tendencias, coste o prevision.",
      [...parsed.warnings, ...absenceTrend.warnings, ...costTrend.warnings].slice(0, 2).join(" "),
      "Incorporar columnas de fecha y dimensiones gestoras en futuros cortes si procede.",
      "Calidad del dato"
    ));
  }

  if (metrics.totalRegistros > 30 && metrics.porcentajeAusenciasAbiertas > 0.1) {
    alerts.push(alert(
      "open-absences",
      "Ausencias abiertas relevantes",
      "Prioridad media",
      "Conjunto filtrado",
      "Las ausencias abiertas representan mas del 10% de los registros filtrados.",
      `${formatNumber(metrics.ausenciasAbiertas)} abiertas, ${formatPercent(metrics.porcentajeAusenciasAbiertas)} del total.`,
      "Monitorizar su evolucion y priorizar las que acumulen mas dias.",
      "Ausencias abiertas"
    ));
  }

  return alerts.slice(0, 18);
};
