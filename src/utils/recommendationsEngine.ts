import type { Metrics } from "../types/data";
import type { ImpactRow, Recommendation, TrendAnalysis } from "../types/intelligence";
import { formatCurrency, formatNumber, formatPercent } from "./formatters";

export const generateRecommendations = (
  metrics: Metrics,
  impactRows: ImpactRow[],
  absenceTrend: TrendAnalysis,
  costTrend: TrendAnalysis
): Recommendation[] => {
  const recommendations: Recommendation[] = [];
  const top = impactRows[0];

  if (metrics.diasNoSustituidos > 50 && metrics.porcentajeSustitucionDias < 0.6) {
    recommendations.push({
      id: "coverage-priority",
      title: "Priorizar ausencia no cubierta",
      explanation: "La vista filtrada combina baja cobertura y volumen relevante de dias no sustituidos.",
      evidence: `${formatNumber(metrics.diasNoSustituidos)} dias no sustituidos y cobertura ${formatPercent(metrics.porcentajeSustitucionDias)}.`,
      area: top?.label || "Conjunto filtrado",
      priority: "Alta prioridad",
      suggestedAction: "Revisar disponibilidad de bolsa y criterios de priorizacion de sustituciones en las categorias con mayor volumen no cubierto."
    });
  }

  if (metrics.totalNomina > 0 && metrics.porcentajeSustitucionDias >= 0.8) {
    recommendations.push({
      id: "high-coverage-cost",
      title: "Monitorizar coste con alta cobertura",
      explanation: "La cobertura es alta y existe coste de sustituciones, por lo que conviene vigilar el coste medio.",
      evidence: `${formatCurrency(metrics.totalNomina)} de coste total y ${formatCurrency(metrics.costeMedioDiaSustituido)} por dia sustituido.`,
      area: "Coste de sustituciones",
      priority: "Informativa",
      suggestedAction: "Monitorizar el coste por dia sustituido y valorar diferencias relevantes entre categorias o tipos de provision."
    });
  }

  if (impactRows.slice(0, 3).reduce((sum, row) => sum + row.porcentajeTotalDias, 0) > 0.45) {
    recommendations.push({
      id: "focused-impact",
      title: "Focalizar categorias de mayor impacto",
      explanation: "El absentismo se concentra en pocas categorias dentro de la vista filtrada.",
      evidence: `Top 3: ${impactRows.slice(0, 3).map((row) => row.label).join(", ") || "sin datos"}.`,
      area: "Categorias criticas",
      priority: "Prioridad media",
      suggestedAction: "Priorizar el analisis operativo en las categorias que concentran mayor impacto, evitando medidas generales poco focalizadas."
    });
  }

  if (absenceTrend.direction === "Ascendente") {
    recommendations.push({
      id: "uptrend-analysis",
      title: "Analizar incremento reciente",
      explanation: "La tendencia mensual reciente de dias de ausencia es ascendente.",
      evidence: `Variacion ultimos tres meses frente a los tres anteriores: ${formatPercent(absenceTrend.variation)}.`,
      area: "Serie mensual de absentismo",
      priority: "Prioridad media",
      suggestedAction: "Analizar si el incremento reciente responde a estacionalidad, acumulacion de procesos, permisos u otros factores organizativos observables."
    });
  }

  if (metrics.porcentajeSustitucionDias < 0.5 && metrics.totalNomina < metrics.diasAusenciaHastaFinP * Math.max(1, metrics.costeMedioDiaSustituido) * 0.25) {
    recommendations.push({
      id: "hidden-pressure",
      title: "Valorar presion asistencial no visible en nomina",
      explanation: "La baja cobertura puede generar impacto operativo aunque el coste de sustitucion sea reducido.",
      evidence: `${formatPercent(metrics.porcentajeSustitucionDias)} de cobertura y ${formatCurrency(metrics.totalNomina)} de coste total.`,
      area: "Ausencia no cubierta",
      priority: "Prioridad media",
      suggestedAction: "Valorar si la baja cobertura esta generando presion asistencial no visible en la nomina de sustituciones."
    });
  }

  if (costTrend.warnings.length || absenceTrend.warnings.length) {
    recommendations.push({
      id: "data-completeness",
      title: "Mejorar dimensiones de analisis",
      explanation: "La capacidad de inteligencia gestora mejora con dimensiones organizativas y fechas completas.",
      evidence: [...absenceTrend.warnings, ...costTrend.warnings][0] || "Avisos metodologicos disponibles.",
      area: "Calidad del dato",
      priority: "Informativa",
      suggestedAction: "Incorporar en futuros cortes columnas de unidad, servicio, direccion o centro para mejorar la capacidad de analisis gestor."
    });
  }

  const expensive = impactRows.find((row) => metrics.costeMedioDiaSustituido > 0 && row.costeDiaSustituido > metrics.costeMedioDiaSustituido * 1.25 && row.diasSustituidos >= 10);
  if (expensive) {
    recommendations.push({
      id: "high-day-cost",
      title: "Revisar coste medio elevado",
      explanation: "Existe una agrupacion con coste por dia sustituido superior a la media.",
      evidence: `${expensive.label}: ${formatCurrency(expensive.costeDiaSustituido)} por dia sustituido.`,
      area: expensive.label,
      priority: "Prioridad media",
      suggestedAction: "Revisar las categorias o modalidades de provision con coste medio por dia sustituido superior a la media."
    });
  }

  if (metrics.porcentajeAusenciasAbiertas > 0.1 && metrics.ausenciasAbiertas > 0) {
    recommendations.push({
      id: "open-absence-monitoring",
      title: "Monitorizar ausencias abiertas",
      explanation: "Las ausencias abiertas representan un volumen relevante de la vista filtrada.",
      evidence: `${formatNumber(metrics.ausenciasAbiertas)} ausencias abiertas, ${formatPercent(metrics.porcentajeAusenciasAbiertas)} del total.`,
      area: "Ausencias abiertas",
      priority: "Prioridad media",
      suggestedAction: "Monitorizar las ausencias abiertas, especialmente si concentran un volumen relevante de dias acumulados."
    });
  }

  return recommendations.slice(0, 8);
};
