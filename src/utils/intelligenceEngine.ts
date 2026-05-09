import type { FilterState, NormalizedRecord, ParsedWorkbook } from "../types/data";
import type { IntelligenceResult } from "../types/intelligence";
import { aggregateBy, topN } from "./aggregations";
import { generateAlerts } from "./alertRules";
import { buildExecutiveNarrative } from "./executiveNarrative";
import { calculateForecast } from "./forecastCalculator";
import { calculateImpactIndex } from "./impactIndex";
import { calculateMetrics } from "./metricsCalculator";
import { methodologyNotes } from "./methodologyUtils";
import { generateRecommendations } from "./recommendationsEngine";
import { defaultScenario, simulateScenario } from "./scenarioSimulator";
import { analyzeTrend } from "./trendAnalyzer";

export const calculateUncoveredSummary = (records: NormalizedRecord[], parsed: ParsedWorkbook) => {
  const metrics = calculateMetrics(records);
  const costeTeoricoCobertura = metrics.diasNoSustituidos * metrics.costeMedioDiaSustituido;
  const baseRankings = {
    "Categoria centralizada": topN(aggregateBy(records, (record) => record.categoriaCentralizada), (row) => row.diasNoSustituidos, 8),
    "Categoria nombramiento": topN(aggregateBy(records, (record) => record.categoriaNombramiento), (row) => row.diasNoSustituidos, 8),
    Ambito: topN(aggregateBy(records, (record) => record.ambito), (row) => row.diasNoSustituidos, 8),
    "Tipo de personal": topN(aggregateBy(records, (record) => record.tipoPersonal), (row) => row.diasNoSustituidos, 8),
    "Tipo de ausencia": topN(aggregateBy(records, (record) => record.tipoAusencia), (row) => row.diasNoSustituidos, 8),
    "Relacion juridica": topN(aggregateBy(records, (record) => record.relJuridica), (row) => row.diasNoSustituidos, 8)
  };
  const dynamicRankings = Object.fromEntries(
    parsed.dynamicDimensions.map((dimension) => [
      dimension,
      topN(aggregateBy(records, (record) => String(record.raw[dimension] ?? "Sin datos")), (row) => row.diasNoSustituidos, 8)
    ])
  );
  return {
    metrics,
    porcentajeNoCubierto: metrics.diasAusenciaHastaFinP ? metrics.diasNoSustituidos / metrics.diasAusenciaHastaFinP : 0,
    costeTeoricoCobertura,
    rankings: { ...baseRankings, ...dynamicRankings },
    warnings: parsed.dynamicDimensions.length
      ? []
      : ["El archivo no contiene unidad, servicio, direccion o centro; se muestra ausencia no cubierta por las dimensiones disponibles."]
  };
};

export const buildIntelligence = (records: NormalizedRecord[], parsed: ParsedWorkbook, filters: FilterState): IntelligenceResult => {
  const metrics = calculateMetrics(records);
  const absenceTrend = analyzeTrend(records, "absence", (row) => row.diasAusenciaHastaFinP);
  const costTrend = analyzeTrend(records, "cost", (row) => row.totalNomina);
  const coverageTrend = analyzeTrend(records, "coverage", (row) => row.porcentajeSustitucionDias);
  const forecast = calculateForecast(records);
  const impactRows = calculateImpactIndex(records, "categoriaCentralizada");
  const categoryRows = aggregateBy(records, (record) => record.categoriaCentralizada);
  const alerts = generateAlerts(metrics, categoryRows, absenceTrend, costTrend, parsed);
  const uncovered = calculateUncoveredSummary(records, parsed);
  const scenario = simulateScenario(metrics, forecast.central, defaultScenario);
  const recommendations = generateRecommendations(metrics, impactRows, absenceTrend, costTrend);
  return {
    absenceTrend,
    costTrend,
    coverageTrend,
    forecast,
    alerts,
    impactRows,
    uncovered,
    scenarioDefaults: defaultScenario,
    scenario,
    recommendations,
    narrative: buildExecutiveNarrative(metrics, forecast, impactRows, absenceTrend, filters),
    methodologyNotes
  };
};
