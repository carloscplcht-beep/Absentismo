import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ForecastResult } from "../types/intelligence";
import { formatCurrency, formatNumber } from "../utils/formatters";
import { ChartCard } from "./ChartCard";
import { ForecastScenarioCards } from "./ForecastScenarioCards";

const tooltip = {
  contentStyle: { borderRadius: 12, border: "1px solid #D7E1DD", boxShadow: "0 16px 36px rgba(15, 23, 42, 0.12)" }
};

export function ForecastPanel({ forecast }: { forecast: ForecastResult }) {
  const scenarioData = forecast.scenarios.map((scenario) => ({
    name: scenario.label,
    diasAusencia: scenario.metrics.diasAusenciaHastaFinP,
    coste: scenario.metrics.totalNomina,
    diasNoSustituidos: scenario.metrics.diasNoSustituidos
  }));
  const annualData = [
    { name: "Acumulado", diasAusencia: forecast.accumulated.diasAusenciaHastaFinP, coste: forecast.accumulated.totalNomina },
    ...scenarioData
  ];
  return (
    <section className="content-stack">
      <div className="section-title-row">
        <div>
          <span>Prevision de cierre anual</span>
          <h2>Escenario central y sensibilidad</h2>
        </div>
        <span className="status-pill status-pill--good">{forecast.method}</span>
      </div>
      <ForecastScenarioCards forecast={forecast} />
      {forecast.warnings.map((warning) => <div className="info-banner" key={warning}>{warning}</div>)}
      <div className="charts-grid">
        <ChartCard title="Acumulado y escenarios" subtitle="Bajo -10%, central calculado, alto +10%">
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={annualData}>
              <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="days" />
              <YAxis yAxisId="cost" orientation="right" tickFormatter={(value) => formatCurrency(Number(value), true)} />
              <Tooltip {...tooltip} formatter={(value, name) => String(name).includes("coste") ? formatCurrency(Number(value), true) : formatNumber(Number(value))} />
              <Legend />
              <Bar yAxisId="days" dataKey="diasAusencia" name="Dias ausencia" fill="#007A53" radius={[8, 8, 0, 0]} />
              <Line yAxisId="cost" dataKey="coste" name="Coste" stroke="#155E75" strokeWidth={3} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Datos reales y proyeccion a diciembre" subtitle="La parte proyectada se muestra con trazo discontinuo">
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={forecast.projectedSeries}>
              <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip {...tooltip} formatter={(value) => formatNumber(Number(value), 1)} />
              <Legend />
              <Bar dataKey="diasAusencia" name="Dias ausencia" fill="#14B8A6" radius={[8, 8, 0, 0]} />
              <Line dataKey="diasAusencia" name="Real/proyectado" stroke="#007A53" strokeWidth={3} strokeDasharray="6 4" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </section>
  );
}
