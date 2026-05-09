import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import type { NormalizedRecord } from "../types/data";
import type { ImpactDimension } from "../types/intelligence";
import { formatCurrency, formatNumber, formatPercent } from "../utils/formatters";
import { calculateImpactIndex, dimensionLabels } from "../utils/impactIndex";
import { ChartCard } from "./ChartCard";

const tooltip = {
  contentStyle: { borderRadius: 12, border: "1px solid #D7E1DD", boxShadow: "0 16px 36px rgba(15, 23, 42, 0.12)" }
};

const dimensions = Object.keys(dimensionLabels) as ImpactDimension[];

export function ImpactRanking({ records }: { records: NormalizedRecord[] }) {
  const [dimension, setDimension] = useState<ImpactDimension>("categoriaCentralizada");
  const rows = useMemo(() => calculateImpactIndex(records, dimension), [records, dimension]);
  const top = rows.slice(0, 10);
  return (
    <section className="content-stack">
      <div className="section-title-row">
        <div>
          <span>Priorizacion explicable</span>
          <h2>Indice de impacto gestor</h2>
          <p>35% dias de ausencia + 25% dias no sustituidos + 25% coste total + 15% baja cobertura.</p>
        </div>
        <select value={dimension} onChange={(event) => setDimension(event.target.value as ImpactDimension)}>
          {dimensions.map((item) => <option key={item} value={item}>{dimensionLabels[item]}</option>)}
        </select>
      </div>
      <div className="charts-grid">
        <ChartCard title="Top 10 indice de impacto gestor">
          <ResponsiveContainer width="100%" height={330}>
            <BarChart data={top.map((row) => ({ name: row.label, value: row.index }))} layout="vertical" margin={{ left: 130, right: 20 }}>
              <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="name" type="category" width={126} tick={{ fontSize: 11 }} />
              <Tooltip {...tooltip} formatter={(value) => formatNumber(Number(value), 1)} />
              <Bar dataKey="value" fill="#007A53" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Mapa de impacto" subtitle="X dias, Y cobertura, tamano coste">
          <ResponsiveContainer width="100%" height={330}>
            <ScatterChart>
              <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
              <XAxis dataKey="diasAusencia" name="Dias" tickFormatter={(value) => formatNumber(Number(value))} />
              <YAxis dataKey="porcentajeSustitucion" name="Cobertura" tickFormatter={(value) => formatPercent(Number(value))} />
              <ZAxis dataKey="totalNomina" range={[80, 700]} />
              <Tooltip {...tooltip} formatter={(value, name) => name === "totalNomina" ? formatCurrency(Number(value), true) : String(name).includes("porcentaje") ? formatPercent(Number(value)) : formatNumber(Number(value), 1)} />
              <Scatter data={top} fill="#0F766E" />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <section className="analysis-panel">
        <h3>Tabla ranking con componentes del indice</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Grupo</th><th>Indice</th><th>Dias ausencia</th><th>Dias no sustituidos</th><th>Cobertura</th><th>Coste</th><th>Coste/dia sust.</th><th>Componentes</th>
              </tr>
            </thead>
            <tbody>
              {top.map((row) => (
                <tr key={row.key}>
                  <td>{row.label}</td>
                  <td>{formatNumber(row.index, 1)}</td>
                  <td>{formatNumber(row.diasAusencia)}</td>
                  <td>{formatNumber(row.diasNoSustituidos)}</td>
                  <td>{formatPercent(row.porcentajeSustitucion)}</td>
                  <td>{formatCurrency(row.totalNomina, true)}</td>
                  <td>{formatCurrency(row.costeDiaSustituido)}</td>
                  <td>{formatNumber(row.components.diasAusencia, 0)} / {formatNumber(row.components.diasNoSustituidos, 0)} / {formatNumber(row.components.costeTotal, 0)} / {formatNumber(row.components.bajaCobertura, 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="info-banner">El indice de impacto gestor es una herramienta de priorizacion. No sustituye la valoracion profesional ni implica causalidad.</div>
      </section>
    </section>
  );
}
