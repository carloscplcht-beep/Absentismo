import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MonthlyMetric } from "../types/intelligence";
import { formatCurrency, formatNumber, formatPercent } from "../utils/formatters";

const tooltip = {
  contentStyle: { borderRadius: 12, border: "1px solid #D7E1DD", boxShadow: "0 16px 36px rgba(15, 23, 42, 0.12)" }
};

type TrendChartProps = {
  data: MonthlyMetric[];
  mode: "absence" | "cost" | "coverage";
};

export function TrendChart({ data, mode }: TrendChartProps) {
  if (!data.length) return <div className="info-banner">No hay datos mensuales suficientes para representar esta tendencia.</div>;
  if (mode === "cost") {
    return (
      <ResponsiveContainer width="100%" height={330}>
        <ComposedChart data={data}>
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
          <XAxis dataKey="label" height={44} tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={(value) => formatCurrency(Number(value), true)} />
          <Tooltip {...tooltip} formatter={(value) => formatCurrency(Number(value), true)} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Bar dataKey="brutoNomina" name="Bruto" stackId="coste" fill="#007A53" radius={[8, 8, 0, 0]} />
          <Bar dataKey="cuotaPatronal" name="Cuota patronal" stackId="coste" fill="#155E75" radius={[8, 8, 0, 0]} />
          <Line dataKey="totalNomina" name="Coste total" stroke="#0F766E" strokeWidth={3} dot={{ r: 3 }} />
        </ComposedChart>
      </ResponsiveContainer>
    );
  }
  if (mode === "coverage") {
    const coverageData = data.map((row) => ({
      ...row,
      coberturaPct: row.porcentajeSustitucionDias * 100,
      conSuplentePct: row.porcentajeAusenciasConSuplente * 100
    }));
    return (
      <ResponsiveContainer width="100%" height={330}>
        <ComposedChart data={coverageData}>
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
          <XAxis dataKey="label" height={44} tick={{ fontSize: 11 }} />
          <YAxis yAxisId="days" />
          <YAxis yAxisId="percent" orientation="right" tickFormatter={(value) => `${formatNumber(Number(value), 0)}%`} />
          <Tooltip {...tooltip} formatter={(value, name) => String(name).includes("%") || String(name).includes("Cobertura") ? `${formatNumber(Number(value), 1)}%` : formatNumber(Number(value))} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Bar yAxisId="days" dataKey="diasNoSustituidos" name="Dias no sustituidos" fill="#F59E0B" radius={[8, 8, 0, 0]} />
          <Line yAxisId="percent" dataKey="coberturaPct" name="Cobertura %" stroke="#007A53" strokeWidth={3} />
          <Line yAxisId="percent" dataKey="conSuplentePct" name="Ausencias con suplente %" stroke="#155E75" strokeWidth={2} />
        </ComposedChart>
      </ResponsiveContainer>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={330}>
      <ComposedChart data={data}>
        <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
        <XAxis dataKey="label" height={44} tick={{ fontSize: 11 }} />
        <YAxis />
        <Tooltip {...tooltip} formatter={(value) => formatNumber(Number(value), 1)} />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        <Bar dataKey="ausenciasUnicas" name="Ausencias" fill="#14B8A6" radius={[8, 8, 0, 0]} />
        <Line dataKey="diasAusenciaHastaFinP" name="Dias ausencia" stroke="#007A53" strokeWidth={3} dot={{ r: 3 }} />
        <Line dataKey="personasAusentesUnicas" name="Personas ausentes" stroke="#155E75" strokeWidth={2} />
        <Line dataKey="movingAverageDias" name="Media movil 3 meses" stroke="#F59E0B" strokeDasharray="5 5" strokeWidth={2} connectNulls />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
