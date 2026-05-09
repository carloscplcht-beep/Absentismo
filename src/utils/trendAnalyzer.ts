import type { Metrics, NormalizedRecord } from "../types/data";
import type { MonthlyMetric, TrendAnalysis } from "../types/intelligence";
import { calculateMetrics, median } from "./metricsCalculator";
import { cleanFinite, dateForMonthlyAnalysis, monthKeyFromDate, monthLabel, safeDivide } from "./methodologyUtils";

const emptyMetrics = (): Metrics => calculateMetrics([]);

export const buildMonthlySeries = (records: NormalizedRecord[], mode: "absence" | "cost" | "coverage" = "absence"): MonthlyMetric[] => {
  const groups = new Map<string, NormalizedRecord[]>();
  records.forEach((record) => {
    const date = dateForMonthlyAnalysis(record, mode);
    if (!date) return;
    const key = monthKeyFromDate(date);
    const group = groups.get(key);
    if (group) group.push(record);
    else groups.set(key, [record]);
  });

  const totalCost = records.reduce((sum, record) => sum + cleanFinite(record.totalNomina), 0);
  let accumulatedCost = 0;
  const rows: MonthlyMetric[] = Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, group]) => {
      const [year, month] = key.split("-").map(Number);
      const metrics = calculateMetrics(group);
      accumulatedCost += metrics.totalNomina;
      return {
        ...emptyMetrics(),
        ...metrics,
        key,
        label: monthLabel(key),
        year,
        month,
        costeMedioAusencia: metrics.totalRegistros ? metrics.totalNomina / metrics.totalRegistros : 0,
        costeMedioAusenciaCubierta: metrics.ausenciasConSuplente ? metrics.totalNomina / metrics.ausenciasConSuplente : 0,
        porcentajeCosteAcumulado: safeDivide(accumulatedCost, totalCost)
      } satisfies MonthlyMetric;
    });

  if (rows.length >= 4) {
    rows.forEach((row, index) => {
      if (index >= 2) {
        const slice = rows.slice(index - 2, index + 1);
        row.movingAverageDias = slice.reduce((sum, item) => sum + item.diasAusenciaHastaFinP, 0) / slice.length;
      }
    });
  }

  return rows;
};

export const trendFromSeries = (series: MonthlyMetric[], pick: (row: MonthlyMetric) => number = (row) => row.diasAusenciaHastaFinP) => {
  if (series.length < 6) return { direction: "No calculable" as const, variation: 0 };
  const last = series.slice(-3);
  const previous = series.slice(-6, -3);
  const lastMean = last.reduce((sum, row) => sum + cleanFinite(pick(row)), 0) / 3;
  const previousMean = previous.reduce((sum, row) => sum + cleanFinite(pick(row)), 0) / 3;
  const variation = safeDivide(lastMean - previousMean, previousMean);
  if (variation > 0.1) return { direction: "Ascendente" as const, variation };
  if (variation < -0.1) return { direction: "Descendente" as const, variation };
  return { direction: "Estable" as const, variation };
};

export const analyzeTrend = (
  records: NormalizedRecord[],
  mode: "absence" | "cost" | "coverage" = "absence",
  pick: (row: MonthlyMetric) => number = (row) => row.diasAusenciaHastaFinP
): TrendAnalysis => {
  const monthly = buildMonthlySeries(records, mode).map((row) => ({
    ...row,
    costeMedioDiaSustituido: row.diasSustituidosHastaFinP ? row.totalNomina / row.diasSustituidosHastaFinP : 0,
    costeMedioAusenciaCubierta: row.ausenciasConSuplente ? row.totalNomina / row.ausenciasConSuplente : 0,
    costeMedioAusencia: row.totalRegistros ? row.totalNomina / row.totalRegistros : 0,
    diasCadaAusenciaUnica: median(records.filter((record) => {
      const date = dateForMonthlyAnalysis(record, mode);
      return date ? monthKeyFromDate(date) === row.key : false;
    }).map((record) => record.diasAusHastaFinP))
  }));
  const trend = trendFromSeries(monthly, pick);
  return {
    monthly,
    direction: trend.direction,
    variation: trend.variation,
    hasMovingAverage: monthly.some((row) => row.movingAverageDias !== undefined),
    warnings: monthly.length ? (monthly.length < 6 ? ["Historico mensual insuficiente para tendencia robusta."] : []) : ["No hay fechas suficientes para construir la serie mensual."]
  };
};
