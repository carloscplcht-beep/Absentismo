import type { Metrics, NormalizedRecord } from "../types/data";
import type { ForecastMethod, ForecastQuality, ForecastResult, MonthlyMetric } from "../types/intelligence";
import { calculateMetrics } from "./metricsCalculator";
import { buildMonthlySeries, trendFromSeries } from "./trendAnalyzer";
import { clamp, cleanFinite, dateForMonthlyAnalysis, monthKeyFromDate, monthLabel } from "./methodologyUtils";

const scaleMetrics = (metrics: Metrics, factor: number): Metrics => ({
  totalRegistros: Math.round(metrics.totalRegistros * factor),
  ausenciasUnicas: Math.round(metrics.ausenciasUnicas * factor),
  personasAusentesUnicas: Math.round(metrics.personasAusentesUnicas * factor),
  suplentesUnicos: Math.round(metrics.suplentesUnicos * factor),
  diasAusencia: metrics.diasAusencia * factor,
  diasAusenciaHastaFinP: metrics.diasAusenciaHastaFinP * factor,
  diasSustituidos: metrics.diasSustituidos * factor,
  diasSustituidosHastaFinP: metrics.diasSustituidosHastaFinP * factor,
  diasNoSustituidos: Math.max(0, metrics.diasAusenciaHastaFinP * factor - metrics.diasSustituidosHastaFinP * factor),
  porcentajeSustitucionDias: metrics.diasAusenciaHastaFinP ? metrics.diasSustituidosHastaFinP / metrics.diasAusenciaHastaFinP : 0,
  ausenciasConSuplente: Math.round(metrics.ausenciasConSuplente * factor),
  ausenciasSinSuplente: Math.round(metrics.ausenciasSinSuplente * factor),
  porcentajeAusenciasConSuplente: metrics.ausenciasUnicas ? metrics.ausenciasConSuplente / metrics.ausenciasUnicas : 0,
  brutoNomina: metrics.brutoNomina * factor,
  cuotaPatronal: metrics.cuotaPatronal * factor,
  totalNomina: metrics.totalNomina * factor,
  costeMedioDiaSustituido: metrics.diasSustituidosHastaFinP ? metrics.totalNomina / metrics.diasSustituidosHastaFinP : 0,
  costeMedioDiaAusencia: metrics.diasAusenciaHastaFinP ? metrics.totalNomina / metrics.diasAusenciaHastaFinP : 0,
  costeMedioAusencia: metrics.ausenciasUnicas ? metrics.totalNomina / metrics.ausenciasUnicas : 0,
  costeMedioAusenciaCubierta: metrics.ausenciasConSuplente ? metrics.totalNomina / metrics.ausenciasConSuplente : 0,
  ausenciasAbiertas: Math.round(metrics.ausenciasAbiertas * factor),
  porcentajeAusenciasAbiertas: metrics.totalRegistros ? metrics.ausenciasAbiertas / metrics.totalRegistros : 0
});

const addMetrics = (metrics: Metrics[]): Metrics => {
  const total = calculateMetrics([]);
  metrics.forEach((item) => {
    total.totalRegistros += item.totalRegistros;
    total.ausenciasUnicas += item.ausenciasUnicas;
    total.personasAusentesUnicas += item.personasAusentesUnicas;
    total.suplentesUnicos += item.suplentesUnicos;
    total.diasAusencia += item.diasAusencia;
    total.diasAusenciaHastaFinP += item.diasAusenciaHastaFinP;
    total.diasSustituidos += item.diasSustituidos;
    total.diasSustituidosHastaFinP += item.diasSustituidosHastaFinP;
    total.ausenciasConSuplente += item.ausenciasConSuplente;
    total.ausenciasSinSuplente += item.ausenciasSinSuplente;
    total.brutoNomina += item.brutoNomina;
    total.cuotaPatronal += item.cuotaPatronal;
    total.totalNomina += item.totalNomina;
    total.ausenciasAbiertas += item.ausenciasAbiertas;
  });
  total.diasNoSustituidos = Math.max(0, total.diasAusenciaHastaFinP - total.diasSustituidosHastaFinP);
  total.porcentajeSustitucionDias = total.diasAusenciaHastaFinP ? total.diasSustituidosHastaFinP / total.diasAusenciaHastaFinP : 0;
  total.porcentajeAusenciasConSuplente = total.ausenciasUnicas ? total.ausenciasConSuplente / total.ausenciasUnicas : 0;
  total.costeMedioDiaSustituido = total.diasSustituidosHastaFinP ? total.totalNomina / total.diasSustituidosHastaFinP : 0;
  total.costeMedioDiaAusencia = total.diasAusenciaHastaFinP ? total.totalNomina / total.diasAusenciaHastaFinP : 0;
  total.costeMedioAusencia = total.ausenciasUnicas ? total.totalNomina / total.ausenciasUnicas : 0;
  total.costeMedioAusenciaCubierta = total.ausenciasConSuplente ? total.totalNomina / total.ausenciasConSuplente : 0;
  total.porcentajeAusenciasAbiertas = total.totalRegistros ? total.ausenciasAbiertas / total.totalRegistros : 0;
  return total;
};

const latestYearRecords = (records: NormalizedRecord[], latestYear: number) =>
  records.filter((record) => {
    const date = dateForMonthlyAnalysis(record, "absence");
    return date?.getFullYear() === latestYear;
  });

const qualityFor = (months: number): ForecastQuality => {
  if (months >= 18) return "Alta";
  if (months >= 6) return "Media";
  return "Baja";
};

const methodFor = (series: MonthlyMetric[]): ForecastMethod => {
  const years = new Set(series.map((row) => row.year));
  if (series.length >= 18 && years.size > 1) return "Estacionalidad historica";
  if (series.length >= 6) return "Tendencia reciente";
  return "Proyeccion lineal simple";
};

const seasonalForecast = (series: MonthlyMetric[], latestYear: number, lastMonth: number, currentYearMetrics: Metrics) => {
  const missingMonths = Array.from({ length: 12 - lastMonth }, (_, index) => lastMonth + index + 1);
  const projections = missingMonths.map((month) => {
    const history = series.filter((row) => row.year < latestYear && row.month === month);
    if (!history.length) return null;
    return scaleMetrics(addMetrics(history), 1 / history.length);
  });
  if (projections.some((item) => !item)) return null;
  return addMetrics([currentYearMetrics, ...(projections as Metrics[])]);
};

const projectedSeries = (series: MonthlyMetric[], latestYear: number, lastMonth: number, central: Metrics) => {
  const current = series
    .filter((row) => row.year === latestYear)
    .map((row) => ({ key: row.key, label: row.label, diasAusencia: row.diasAusenciaHastaFinP, totalNomina: row.totalNomina, real: true }));
  if (lastMonth >= 12) return current;
  const remaining = 12 - lastMonth;
  const actualDias = current.reduce((sum, row) => sum + row.diasAusencia, 0);
  const actualCost = current.reduce((sum, row) => sum + row.totalNomina, 0);
  const monthlyDias = Math.max(0, central.diasAusenciaHastaFinP - actualDias) / remaining;
  const monthlyCost = Math.max(0, central.totalNomina - actualCost) / remaining;
  const projection = Array.from({ length: remaining }, (_, index) => {
    const month = lastMonth + index + 1;
    const key = `${latestYear}-${String(month).padStart(2, "0")}`;
    return { key, label: monthLabel(key), diasAusencia: monthlyDias, totalNomina: monthlyCost, real: false };
  });
  return [...current, ...projection];
};

export const calculateForecast = (records: NormalizedRecord[]): ForecastResult => {
  const series = buildMonthlySeries(records, "absence");
  if (!series.length) {
    const empty = calculateMetrics([]);
    return {
      method: "Proyeccion lineal simple",
      quality: "Baja",
      monthsWithData: 0,
      lastMonthLabel: "No calculable",
      accumulated: empty,
      central: empty,
      low: empty,
      high: empty,
      scenarios: [
        { label: "Bajo", factor: 0.9, metrics: empty },
        { label: "Central", factor: 1, metrics: empty },
        { label: "Alto", factor: 1.1, metrics: empty }
      ],
      projectedSeries: [],
      warnings: ["No hay meses con datos suficientes para calcular prevision anual."]
    };
  }

  const latest = series[series.length - 1];
  const currentRecords = latestYearRecords(records, latest.year);
  const currentSeries = series.filter((row) => row.year === latest.year);
  const accumulated = calculateMetrics(currentRecords);
  const baseFactor = currentSeries.length ? 12 / currentSeries.length : 1;
  let method = methodFor(series);
  let central = scaleMetrics(accumulated, baseFactor);
  const warnings: string[] = [];

  if (method === "Tendencia reciente") {
    const trend = trendFromSeries(series, (row) => row.diasAusenciaHastaFinP);
    const adjustment = clamp(trend.variation, -0.2, 0.2);
    central = scaleMetrics(accumulated, baseFactor * (1 + adjustment));
  }

  if (method === "Estacionalidad historica") {
    const seasonal = seasonalForecast(series, latest.year, latest.month, accumulated);
    if (seasonal) {
      central = seasonal;
    } else {
      method = series.length >= 6 ? "Tendencia reciente" : "Proyeccion lineal simple";
      warnings.push("La estacionalidad no se ha podido completar para algun mes; se usa el metodo alternativo mas robusto.");
      if (method === "Tendencia reciente") {
        const trend = trendFromSeries(series, (row) => row.diasAusenciaHastaFinP);
        central = scaleMetrics(accumulated, baseFactor * (1 + clamp(trend.variation, -0.2, 0.2)));
      }
    }
  }

  const low = scaleMetrics(central, 0.9);
  const high = scaleMetrics(central, 1.1);
  return {
    method,
    quality: qualityFor(series.length),
    monthsWithData: series.length,
    lastMonthLabel: latest.label,
    accumulated,
    central,
    low,
    high,
    scenarios: [
      { label: "Bajo", factor: 0.9, metrics: low },
      { label: "Central", factor: 1, metrics: central },
      { label: "Alto", factor: 1.1, metrics: high }
    ],
    projectedSeries: projectedSeries(series, latest.year, latest.month, central).map((point) => ({
      ...point,
      diasAusencia: cleanFinite(point.diasAusencia),
      totalNomina: cleanFinite(point.totalNomina)
    })),
    warnings: [
      ...warnings,
      ...(series.length < 6 ? ["Prevision con calidad baja por disponer de menos de seis meses con datos."] : []),
      "Esta prevision es una estimacion gestora orientativa basada en los datos cargados y no debe interpretarse como una prediccion determinista."
    ]
  };
};
