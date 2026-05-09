import type { Metrics } from "../types/data";
import type { ScenarioInput, ScenarioOutput } from "../types/intelligence";
import { clamp } from "./methodologyUtils";

export const defaultScenario: ScenarioInput = {
  coverageIncrease: 10,
  absenceReduction: 5,
  costVariation: 0
};

export const simulateScenario = (metrics: Metrics, forecast: Metrics, input: ScenarioInput): ScenarioOutput => {
  const absenceFactor = 1 - clamp(input.absenceReduction, -50, 80) / 100;
  const costFactor = 1 + clamp(input.costVariation, -90, 200) / 100;
  const diasAusencia = Math.max(0, forecast.diasAusenciaHastaFinP * absenceFactor);
  const targetCoverage = clamp(forecast.porcentajeSustitucionDias + clamp(input.coverageIncrease, -100, 100) / 100, 0, 1);
  const diasSustituidos = Math.min(diasAusencia, Math.max(0, diasAusencia * targetCoverage));
  const diasNoSustituidos = Math.max(0, diasAusencia - diasSustituidos);
  const costeMedio = Math.max(0, metrics.costeMedioDiaSustituido || forecast.costeMedioDiaSustituido || 0);
  const costeTotalEstimado = Math.max(0, diasSustituidos * costeMedio * costFactor);
  const baseProjectedSustituidos = Math.max(0, Math.min(forecast.diasSustituidosHastaFinP, forecast.diasAusenciaHastaFinP));
  const costeTeoricoAdicional = Math.max(0, diasSustituidos - baseProjectedSustituidos) * costeMedio * costFactor;
  return {
    input,
    diasAusencia,
    diasSustituidos,
    diasNoSustituidos,
    nuevaCobertura: diasAusencia ? diasSustituidos / diasAusencia : 0,
    costeTotalEstimado,
    costeTeoricoAdicional,
    reduccionDiasAusencia: Math.max(0, forecast.diasAusenciaHastaFinP - diasAusencia),
    diferenciaFrenteForecast: costeTotalEstimado - forecast.totalNomina
  };
};
