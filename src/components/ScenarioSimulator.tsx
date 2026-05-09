import { useMemo, useState } from "react";
import type { Metrics } from "../types/data";
import type { ScenarioInput } from "../types/intelligence";
import { formatCurrency, formatNumber, formatPercent } from "../utils/formatters";
import { simulateScenario } from "../utils/scenarioSimulator";
import { KPICard } from "./KPICard";

type ScenarioSimulatorProps = {
  metrics: Metrics;
  forecast: Metrics;
  defaults: ScenarioInput;
};

export function ScenarioSimulator({ metrics, forecast, defaults }: ScenarioSimulatorProps) {
  const [input, setInput] = useState(defaults);
  const result = useMemo(() => simulateScenario(metrics, forecast, input), [metrics, forecast, input]);
  const set = (key: keyof ScenarioInput, value: number) => setInput((current) => ({ ...current, [key]: value }));
  return (
    <section className="analysis-panel">
      <div className="section-title-row">
        <div>
          <span>Simulacion</span>
          <h2>Escenarios de cobertura, ausencia y coste</h2>
          <p>Los escenarios son estimaciones gestoras basadas en los datos cargados. No sustituyen la planificacion formal de recursos humanos.</p>
        </div>
      </div>
      <div className="scenario-controls">
        <label>
          <span>Mejora de cobertura: {formatNumber(input.coverageIncrease)}%</span>
          <input type="range" min="0" max="30" step="5" value={input.coverageIncrease} onChange={(event) => set("coverageIncrease", Number(event.target.value))} />
        </label>
        <label>
          <span>Reduccion dias de ausencia: {formatNumber(input.absenceReduction)}%</span>
          <input type="range" min="0" max="30" step="5" value={input.absenceReduction} onChange={(event) => set("absenceReduction", Number(event.target.value))} />
        </label>
        <label>
          <span>Variacion coste medio: {formatNumber(input.costVariation)}%</span>
          <input type="range" min="-20" max="30" step="5" value={input.costVariation} onChange={(event) => set("costVariation", Number(event.target.value))} />
        </label>
      </div>
      <div className="kpi-grid kpi-grid--compact">
        <KPICard label="Nueva cobertura estimada" value={formatPercent(result.nuevaCobertura)} />
        <KPICard label="Dias no sustituidos" value={formatNumber(result.diasNoSustituidos)} />
        <KPICard label="Dias sustituidos" value={formatNumber(result.diasSustituidos)} />
        <KPICard label="Coste total estimado" value={formatCurrency(result.costeTotalEstimado, true)} />
        <KPICard label="Coste teorico adicional" value={formatCurrency(result.costeTeoricoAdicional, true)} />
        <KPICard label="Reduccion dias ausencia" value={formatNumber(result.reduccionDiasAusencia)} />
      </div>
    </section>
  );
}
