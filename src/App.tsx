import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis
} from "recharts";
import { BadgeEuro, CalendarClock, CircleAlert, Euro, FileText, HeartPulse, ShieldCheck, UserRoundCheck, UsersRound } from "lucide-react";
import type { AggregateRow, FilterState, NormalizedRecord, ParsedWorkbook } from "./types/data";
import { parseExcelFile } from "./utils/excelParser";
import { aggregateBy, applyFilters, durationBuckets, emptyFilters, getActiveYearOptions, topN } from "./utils/aggregations";
import { calculateMetrics, median } from "./utils/metricsCalculator";
import { coverageStatus, downloadCsv, formatCurrency, formatNumber, formatPercent } from "./utils/formatters";
import { normalizeHeader } from "./utils/dataNormalizer";
import { DashboardLayout } from "./components/DashboardLayout";
import { EmptyState } from "./components/EmptyState";
import { ErrorPanel } from "./components/ErrorPanel";
import { FilterPanel } from "./components/FilterPanel";
import { KPICard } from "./components/KPICard";
import { ChartCard } from "./components/ChartCard";
import { DataTable } from "./components/DataTable";
import { ExecutiveReport } from "./components/ExecutiveReport";
import { IntelligencePage } from "./components/IntelligencePage";
import { buildIntelligence } from "./utils/intelligenceEngine";

const COLORS = ["#007A53", "#0F766E", "#155E75", "#65A30D", "#F59E0B", "#DC2626", "#64748B", "#14B8A6"];
const shortLabel = (value: unknown, max = 26) => {
  const text = String(value ?? "");
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
};

const chartTooltip = {
  contentStyle: { borderRadius: 12, border: "1px solid #D7E1DD", boxShadow: "0 16px 36px rgba(15, 23, 42, 0.12)" }
};

const toChart = (rows: AggregateRow[], valueKey: keyof AggregateRow, n = 10) =>
  topN(rows, (row) => Number(row[valueKey]), n).map((row) => ({
    name: row.label,
    value: Number(row[valueKey]),
    cobertura: row.porcentajeSustitucion,
    coste: row.totalNomina,
    dias: row.diasAusencia
  }));

function KpiGrid({ metrics }: { metrics: ReturnType<typeof calculateMetrics> }) {
  return (
    <div className="kpi-grid">
      <KPICard label="Total de registros" value={formatNumber(metrics.totalRegistros)} detail="Filas analíticas filtradas" icon={<FileText size={18} />} />
      <KPICard label="Ausencias únicas" value={formatNumber(metrics.ausenciasUnicas)} detail="Según columna o clave deducida" icon={<HeartPulse size={18} />} />
      <KPICard label="Personas ausentes únicas" value={formatNumber(metrics.personasAusentesUnicas)} detail="DNI único/DNI/nombre" icon={<UsersRound size={18} />} />
      <KPICard label="Días de ausencia" value={formatNumber(metrics.diasAusenciaHastaFinP)} detail={`${formatNumber(metrics.diasAusencia)} días totales registrados`} icon={<CalendarClock size={18} />} />
      <KPICard label="Días sustituidos" value={formatNumber(metrics.diasSustituidosHastaFinP)} detail={`${formatNumber(metrics.diasNoSustituidos)} días no sustituidos`} icon={<UserRoundCheck size={18} />} />
      <KPICard label="% cobertura por días" value={formatPercent(metrics.porcentajeSustitucionDias)} tone={coverageStatus(metrics.porcentajeSustitucionDias)} detail="Sustituidos hasta fin P. / ausencia hasta fin P." icon={<ShieldCheck size={18} />} />
      <KPICard label="% ausencias con suplente" value={formatPercent(metrics.porcentajeAusenciasConSuplente)} detail={`${formatNumber(metrics.ausenciasConSuplente)} con suplente`} icon={<UserRoundCheck size={18} />} />
      <KPICard label="Coste bruto" value={formatCurrency(metrics.brutoNomina, true)} detail={formatCurrency(metrics.brutoNomina)} icon={<Euro size={18} />} />
      <KPICard label="Cuota patronal" value={formatCurrency(metrics.cuotaPatronal, true)} detail={formatCurrency(metrics.cuotaPatronal)} icon={<BadgeEuro size={18} />} />
      <KPICard label="Coste total nómina" value={formatCurrency(metrics.totalNomina, true)} detail={formatCurrency(metrics.totalNomina)} icon={<Euro size={18} />} />
      <KPICard label="Coste medio día sustituido" value={formatCurrency(metrics.costeMedioDiaSustituido)} detail="Total / días sustituidos hasta fin P." />
      <KPICard label="Ausencias abiertas" value={formatNumber(metrics.ausenciasAbiertas)} tone={metrics.ausenciasAbiertas ? "warn" : "good"} detail={formatPercent(metrics.porcentajeAusenciasAbiertas)} icon={<CircleAlert size={18} />} />
    </div>
  );
}

function CoverageGauge({ value }: { value: number }) {
  const data = [{ name: "Cobertura", value: Math.max(0, Math.min(100, value * 100)), fill: value >= 0.8 ? "#007A53" : value >= 0.5 ? "#F59E0B" : "#DC2626" }];
  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadialBarChart innerRadius="62%" outerRadius="92%" data={data} startAngle={180} endAngle={0}>
        <RadialBar background dataKey="value" cornerRadius={14} />
        <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" className="gauge-value">
          {formatPercent(value)}
        </text>
        <text x="50%" y="68%" textAnchor="middle" dominantBaseline="middle" className="gauge-label">
          días sustituidos / días ausencia
        </text>
      </RadialBarChart>
    </ResponsiveContainer>
  );
}

function BarListChart({ data, formatter = formatNumber }: { data: Array<{ name: string; value: number }>; formatter?: (value: number) => string }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} layout="vertical" margin={{ left: 150, right: 24, top: 12, bottom: 12 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
        <XAxis type="number" tickFormatter={(value) => formatter(Number(value))} />
        <YAxis dataKey="name" type="category" width={144} tick={{ fontSize: 11 }} tickFormatter={(value) => shortLabel(value)} />
        <Tooltip {...chartTooltip} formatter={(value) => formatter(Number(value))} />
        <Bar dataKey="value" fill="#007A53" radius={[0, 8, 8, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function SummaryPage({ records, metrics }: { records: NormalizedRecord[]; metrics: ReturnType<typeof calculateMetrics> }) {
  const byYear = getActiveYearOptions(records).map((year) => ({
    name: year,
    value: calculateMetrics(applyFilters(records, { ...emptyFilters, anio: [year] })).diasAusenciaHastaFinP,
    cobertura: 0,
    coste: 0,
    dias: 0
  }));
  const byAmbito = toChart(aggregateBy(records, (record) => record.ambito), "registros", 8);
  const byTipo = toChart(aggregateBy(records, (record) => record.tipoAusencia), "registros", 8);
  const byCategory = aggregateBy(records, (record) => record.categoriaCentralizada);
  return (
    <main className="content-stack">
      <KpiGrid metrics={metrics} />
      <div className="charts-grid">
        <ChartCard title="Evolución / distribución por año" subtitle="Días de ausencia hasta fin de periodo">
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={byYear}>
              <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip {...chartTooltip} formatter={(value) => formatNumber(Number(value))} />
              <Bar dataKey="value" fill="#007A53" radius={[8, 8, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Distribución por ámbito">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={byAmbito} dataKey="value" nameKey="name" innerRadius={62} outerRadius={104} paddingAngle={2}>
                {byAmbito.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip {...chartTooltip} formatter={(value) => formatNumber(Number(value))} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Distribución por tipo de ausencia">
          <BarListChart data={byTipo} />
        </ChartCard>
        <ChartCard title="Top 10 categorías por días de ausencia">
          <BarListChart data={toChart(byCategory, "diasAusencia")} />
        </ChartCard>
        <ChartCard title="Top 10 categorías por coste total">
          <BarListChart data={toChart(byCategory, "totalNomina")} formatter={(value) => formatCurrency(value, true)} />
        </ChartCard>
        <ChartCard title="Indicador visual de cobertura">
          <CoverageGauge value={metrics.porcentajeSustitucionDias} />
        </ChartCard>
      </div>
    </main>
  );
}

function AbsencePage({ records, metrics }: { records: NormalizedRecord[]; metrics: ReturnType<typeof calculateMetrics> }) {
  const byCentral = aggregateBy(records, (record) => record.categoriaCentralizada);
  const byNombramiento = aggregateBy(records, (record) => record.categoriaNombramiento);
  const byTipoPersonal = aggregateBy(records, (record) => record.tipoPersonal);
  const byRelacion = aggregateBy(records, (record) => record.relJuridica);
  const byTipoAusencia = aggregateBy(records, (record) => record.tipoAusencia);
  const byAmbito = aggregateBy(records, (record) => record.ambito);
  const persons = aggregateBy(records, (record) => record.titular || "Sin identificar");
  return (
    <main className="content-stack">
      <div className="kpi-grid kpi-grid--compact">
        <KPICard label="Nº de ausencias" value={formatNumber(metrics.totalRegistros)} detail="Registros filtrados" />
        <KPICard label="Ausencias únicas" value={formatNumber(metrics.ausenciasUnicas)} />
        <KPICard label="Días totales" value={formatNumber(metrics.diasAusenciaHastaFinP)} />
        <KPICard label="Días medios por ausencia" value={formatNumber(metrics.ausenciasUnicas ? metrics.diasAusenciaHastaFinP / metrics.ausenciasUnicas : 0, 1)} />
        <KPICard label="Días medianos por ausencia" value={formatNumber(median(records.map((record) => record.diasAusHastaFinP)), 1)} />
        <KPICard label="Ausencias abiertas" value={formatNumber(metrics.ausenciasAbiertas)} detail={formatPercent(metrics.porcentajeAusenciasAbiertas)} tone={metrics.ausenciasAbiertas ? "warn" : "good"} />
      </div>
      <div className="charts-grid">
        <ChartCard title="Días de ausencia por categoría centralizada"><BarListChart data={toChart(byCentral, "diasAusencia")} /></ChartCard>
        <ChartCard title="Días de ausencia por categoría de nombramiento"><BarListChart data={toChart(byNombramiento, "diasAusencia")} /></ChartCard>
        <ChartCard title="Días de ausencia por tipo de personal"><BarListChart data={toChart(byTipoPersonal, "diasAusencia")} /></ChartCard>
        <ChartCard title="Días de ausencia por relación jurídica"><BarListChart data={toChart(byRelacion, "diasAusencia")} /></ChartCard>
        <ChartCard title="Días de ausencia por tipo de ausencia"><BarListChart data={toChart(byTipoAusencia, "diasAusencia")} /></ChartCard>
        <ChartCard title="Comparativa Primaria / Especializada"><BarListChart data={toChart(byAmbito, "diasAusencia")} /></ChartCard>
        <ChartCard title="Tramos de duración de ausencia"><BarListChart data={durationBuckets(records).map((bucket) => ({ name: bucket.label, value: bucket.value }))} /></ChartCard>
        <ChartCard title="Ranking de personas por días" subtitle="Sin DNI visible por defecto">
          <BarListChart data={toChart(persons, "diasAusencia")} />
        </ChartCard>
      </div>
    </main>
  );
}

function CoveragePage({ records, metrics }: { records: NormalizedRecord[]; metrics: ReturnType<typeof calculateMetrics> }) {
  const byCategory = aggregateBy(records, (record) => record.categoriaCentralizada);
  const byAmbito = aggregateBy(records, (record) => record.ambito);
  const byTipoPersonal = aggregateBy(records, (record) => record.tipoPersonal);
  const byRelacion = aggregateBy(records, (record) => record.relJuridica);
  const byTipoAusencia = aggregateBy(records, (record) => record.tipoAusencia);
  const byProvision = aggregateBy(records, (record) => record.provisionSubtipo);
  const byMes = aggregateBy(records, (record) => record.mesPagoSuplente);
  const ambitos = byAmbito.map((row) => row.label);
  const matrixCats = topN(byCategory, (row) => row.diasAusencia, 8);
  return (
    <main className="content-stack">
      <div className="kpi-grid kpi-grid--compact">
        <KPICard label="Días de ausencia" value={formatNumber(metrics.diasAusenciaHastaFinP)} />
        <KPICard label="Días sustituidos" value={formatNumber(metrics.diasSustituidosHastaFinP)} />
        <KPICard label="Días no sustituidos" value={formatNumber(metrics.diasNoSustituidos)} tone={metrics.diasNoSustituidos ? "warn" : "good"} />
        <KPICard label="% sustitución por días" value={formatPercent(metrics.porcentajeSustitucionDias)} tone={coverageStatus(metrics.porcentajeSustitucionDias)} />
        <KPICard label="Ausencias con suplente" value={formatNumber(metrics.ausenciasConSuplente)} />
        <KPICard label="Ausencias sin suplente" value={formatNumber(metrics.ausenciasSinSuplente)} />
      </div>
      <div className="charts-grid">
        <ChartCard title="% cobertura por categoría"><BarListChart data={toChart(byCategory, "porcentajeSustitucion").map((row) => ({ ...row, value: row.value * 100 }))} formatter={(v) => `${formatNumber(v, 1)}%`} /></ChartCard>
        <ChartCard title="Días no sustituidos por categoría"><BarListChart data={toChart(byCategory, "diasNoSustituidos")} /></ChartCard>
        <ChartCard title="Cobertura por ámbito"><BarListChart data={toChart(byAmbito, "porcentajeSustitucion").map((row) => ({ ...row, value: row.value * 100 }))} formatter={(v) => `${formatNumber(v, 1)}%`} /></ChartCard>
        <ChartCard title="Cobertura por tipo de personal"><BarListChart data={toChart(byTipoPersonal, "porcentajeSustitucion").map((row) => ({ ...row, value: row.value * 100 }))} formatter={(v) => `${formatNumber(v, 1)}%`} /></ChartCard>
        <ChartCard title="Cobertura por relación jurídica"><BarListChart data={toChart(byRelacion, "porcentajeSustitucion").map((row) => ({ ...row, value: row.value * 100 }))} formatter={(v) => `${formatNumber(v, 1)}%`} /></ChartCard>
        <ChartCard title="Cobertura por tipo de ausencia"><BarListChart data={toChart(byTipoAusencia, "porcentajeSustitucion").map((row) => ({ ...row, value: row.value * 100 }))} formatter={(v) => `${formatNumber(v, 1)}%`} /></ChartCard>
        <ChartCard title="Distribución de suplencias por provisión"><BarListChart data={toChart(byProvision, "registros")} /></ChartCard>
        <ChartCard title="MES PAGO SUPLENTE"><BarListChart data={toChart(byMes, "registros")} /></ChartCard>
      </div>
      <section className="analysis-panel">
        <h3>Matriz categoría x ámbito con porcentaje de cobertura</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Categoría</th>{ambitos.map((ambito) => <th key={ambito}>{ambito}</th>)}</tr></thead>
            <tbody>
              {matrixCats.map((cat) => (
                <tr key={cat.key}>
                  <td>{cat.label}</td>
                  {ambitos.map((ambito) => {
                    const group = records.filter((record) => record.categoriaCentralizada === cat.label && record.ambito === ambito);
                    const value = calculateMetrics(group).porcentajeSustitucionDias;
                    return <td key={ambito}><span className={`status-pill status-pill--${coverageStatus(value)}`}>{formatPercent(value)}</span></td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function CostsPage({ records, metrics }: { records: NormalizedRecord[]; metrics: ReturnType<typeof calculateMetrics> }) {
  const byCentral = aggregateBy(records, (record) => record.categoriaCentralizada);
  const byNombramiento = aggregateBy(records, (record) => record.categoriaNombramiento);
  const byAmbito = aggregateBy(records, (record) => record.ambito);
  const byTipoPersonal = aggregateBy(records, (record) => record.tipoPersonal);
  const byRelacion = aggregateBy(records, (record) => record.relJuridica);
  const byTipoAusencia = aggregateBy(records, (record) => record.tipoAusencia);
  const topRecords = topN(records, (record) => record.totalNomina, 10).map((record, index) => ({ name: `${index + 1}. ${record.titular || record.categoriaCentralizada}`, value: record.totalNomina }));
  return (
    <main className="content-stack">
      <div className="kpi-grid kpi-grid--compact">
        <KPICard label="Bruto Nómina Abonada" value={formatCurrency(metrics.brutoNomina, true)} detail={formatCurrency(metrics.brutoNomina)} />
        <KPICard label="Cuota Patronal Nómina" value={formatCurrency(metrics.cuotaPatronal, true)} detail={formatCurrency(metrics.cuotaPatronal)} />
        <KPICard label="TOTAL Nómina Abonada" value={formatCurrency(metrics.totalNomina, true)} detail={formatCurrency(metrics.totalNomina)} />
        <KPICard label="Coste medio día sustituido" value={formatCurrency(metrics.costeMedioDiaSustituido)} />
        <KPICard label="Coste medio día ausencia" value={formatCurrency(metrics.costeMedioDiaAusencia)} />
        <KPICard label="Coste medio ausencia cubierta" value={formatCurrency(metrics.costeMedioAusenciaCubierta)} />
      </div>
      <div className="charts-grid">
        <ChartCard title="Coste total por categoría centralizada"><BarListChart data={toChart(byCentral, "totalNomina")} formatter={(v) => formatCurrency(v, true)} /></ChartCard>
        <ChartCard title="Coste total por categoría de nombramiento"><BarListChart data={toChart(byNombramiento, "totalNomina")} formatter={(v) => formatCurrency(v, true)} /></ChartCard>
        <ChartCard title="Coste total por ámbito"><BarListChart data={toChart(byAmbito, "totalNomina")} formatter={(v) => formatCurrency(v, true)} /></ChartCard>
        <ChartCard title="Coste total por tipo de personal"><BarListChart data={toChart(byTipoPersonal, "totalNomina")} formatter={(v) => formatCurrency(v, true)} /></ChartCard>
        <ChartCard title="Coste por relación jurídica"><BarListChart data={toChart(byRelacion, "totalNomina")} formatter={(v) => formatCurrency(v, true)} /></ChartCard>
        <ChartCard title="Coste por tipo de ausencia"><BarListChart data={toChart(byTipoAusencia, "totalNomina")} formatter={(v) => formatCurrency(v, true)} /></ChartCard>
        <ChartCard title="Coste bruto vs cuota patronal">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={[{ name: "Bruto", value: metrics.brutoNomina }, { name: "Cuota patronal", value: metrics.cuotaPatronal }]} dataKey="value" innerRadius={66} outerRadius={104}>
                <Cell fill="#007A53" /><Cell fill="#155E75" />
              </Pie>
              <Tooltip {...chartTooltip} formatter={(v) => formatCurrency(Number(v), true)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Top 10 registros con mayor coste" subtitle="DNI oculto por defecto"><BarListChart data={topRecords} formatter={(v) => formatCurrency(v, true)} /></ChartCard>
        <ChartCard title="Coste por día sustituido por categoría"><BarListChart data={toChart(byCentral, "costeDiaSustituido")} formatter={(v) => formatCurrency(v)} /></ChartCard>
      </div>
    </main>
  );
}

function AggregateTable({ rows }: { rows: AggregateRow[] }) {
  const [sortKey, setSortKey] = useState<keyof AggregateRow>("impactoGestor");
  const sorted = [...rows].sort((a, b) => Number(b[sortKey]) - Number(a[sortKey]));
  const headers: Array<[keyof AggregateRow, string, "number" | "currency" | "percent"]> = [
    ["registros", "Nº registros", "number"],
    ["ausenciasUnicas", "Ausencias únicas", "number"],
    ["personasAusentes", "Personas ausentes", "number"],
    ["diasAusencia", "Días ausencia", "number"],
    ["diasSustituidos", "Días sustituidos", "number"],
    ["diasNoSustituidos", "Días no sustituidos", "number"],
    ["porcentajeSustitucion", "% sustitución", "percent"],
    ["brutoNomina", "Coste bruto", "currency"],
    ["cuotaPatronal", "Cuota patronal", "currency"],
    ["totalNomina", "Coste total", "currency"],
    ["costeDiaSustituido", "Coste/día sustituido", "currency"],
    ["costeDiaAusencia", "Coste/día ausencia", "currency"],
    ["porcentajeTotalDias", "% total días", "percent"],
    ["porcentajeTotalCoste", "% total coste", "percent"],
    ["impactoGestor", "Impacto gestor", "number"]
  ];
  const fmt = (value: number, type: string) => type === "currency" ? formatCurrency(value, true) : type === "percent" ? formatPercent(value) : formatNumber(value, 1);
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Grupo</th>
            {headers.map(([key, label, type]) => <th key={key} data-type={type}><button type="button" onClick={() => setSortKey(key)}>{label}</button></th>)}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.key}>
              <td title={row.label}>{row.label}</td>
              {headers.map(([key, , type]) => <td key={key} data-type={type}>{fmt(Number(row[key]), type)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CategoriesPage({ records }: { records: NormalizedRecord[] }) {
  const rows = aggregateBy(
    records,
    (record) => `${record.categoriaCentralizada} · ${record.categoriaNombramiento} · ${record.tipoPersonal} · ${record.ambito}`
  );
  const byCat = aggregateBy(records, (record) => record.categoriaCentralizada);
  const comparison = topN(byCat, (row) => row.diasAusencia, 10).map((row) => ({
    name: row.label,
    diasAusencia: row.diasAusencia,
    diasSustituidos: row.diasSustituidos
  }));
  return (
    <main className="content-stack">
      <div className="charts-grid">
        <ChartCard title="Días ausencia vs días sustituidos por categoría">
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={comparison}>
              <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} tickFormatter={(value) => shortLabel(value, 14)} angle={-25} textAnchor="end" height={76} interval={0} />
              <YAxis />
              <Tooltip {...chartTooltip} />
              <Legend />
              <Bar dataKey="diasAusencia" name="Días ausencia" fill="#007A53" radius={[8, 8, 0, 0]} />
              <Bar dataKey="diasSustituidos" name="Días sustituidos" fill="#14B8A6" radius={[8, 8, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Coste total vs % sustitución">
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="coste" name="Coste" tickFormatter={(v) => formatCurrency(Number(v), true)} />
              <YAxis dataKey="cobertura" name="Cobertura" tickFormatter={(v) => formatPercent(Number(v))} />
              <ZAxis dataKey="dias" range={[80, 600]} />
              <Tooltip {...chartTooltip} formatter={(v, name) => name === "Coste" ? formatCurrency(Number(v), true) : String(v)} />
              <Scatter data={toChart(byCat, "totalNomina")} fill="#007A53" />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <section className="analysis-panel">
        <h3>Tabla agregada por categoría, nombramiento, tipo de personal y ámbito</h3>
        <AggregateTable rows={rows} />
      </section>
    </main>
  );
}

function UnitsPage({ records, parsed }: { records: NormalizedRecord[]; parsed: ParsedWorkbook }) {
  const available = parsed.dynamicDimensions;
  const rows = available.length
    ? available.flatMap((dimension) => aggregateBy(records, (record) => String(record.raw[dimension] ?? "Sin datos")).map((row) => ({ ...row, label: `${dimension}: ${row.label}` })))
    : aggregateBy(records, (record) => `${record.ambito} · ${record.categoriaCentralizada}`);
  return (
    <main className="content-stack">
      {!available.length ? (
        <div className="info-banner">El archivo cargado no contiene información de unidad/servicio/dirección. Se muestra el análisis disponible por ámbito y categoría.</div>
      ) : null}
      <div className="charts-grid">
        <ChartCard title="Ranking de mayor impacto gestor"><BarListChart data={toChart(rows, "impactoGestor")} formatter={(v) => formatNumber(v, 1)} /></ChartCard>
        <ChartCard title="Coste total por dimensión gestora"><BarListChart data={toChart(rows, "totalNomina")} formatter={(v) => formatCurrency(v, true)} /></ChartCard>
        <ChartCard title="Días no sustituidos por dimensión gestora"><BarListChart data={toChart(rows, "diasNoSustituidos")} /></ChartCard>
        <ChartCard title="% sustitución por dimensión gestora"><BarListChart data={toChart(rows, "porcentajeSustitucion").map((row) => ({ ...row, value: row.value * 100 }))} formatter={(v) => `${formatNumber(v, 1)}%`} /></ChartCard>
      </div>
      <section className="analysis-panel"><h3>Tabla de impacto gestor</h3><AggregateTable rows={rows} /></section>
    </main>
  );
}

export default function App() {
  const [parsed, setParsed] = useState<ParsedWorkbook | null>(null);
  const [activeTab, setActiveTab] = useState("resumen");
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredRecords = useMemo(() => (parsed ? applyFilters(parsed.records, filters) : []), [parsed, filters]);
  const metrics = useMemo(() => calculateMetrics(filteredRecords), [filteredRecords]);
  const intelligence = useMemo(() => (parsed ? buildIntelligence(filteredRecords, parsed, filters) : null), [filteredRecords, parsed, filters]);
  const topCategorias = useMemo(() => aggregateBy(filteredRecords, (record) => record.categoriaCentralizada), [filteredRecords]);
  const topNoCubierto = useMemo(() => topN(topCategorias, (row) => row.diasNoSustituidos, 10), [topCategorias]);
  const filterSummary = parsed
    ? `${formatNumber(filteredRecords.length)} de ${formatNumber(parsed.records.length)} registros visibles · impacto gestor pondera días, días no sustituidos, coste y baja cobertura`
    : "Sin archivo cargado";

  const onFile = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const result = await parseExcelFile(file);
      setParsed(result);
      setFilters(emptyFilters);
      setActiveTab("resumen");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se ha podido leer el archivo Excel.");
    } finally {
      setLoading(false);
    }
  };

  const exportView = () => {
    downloadCsv(
      "vista_filtrada_ausencias.csv",
      filteredRecords.map((record) => ({
        Ambito: record.ambito,
        Anio: record.anio,
        Categoria: record.categoriaCentralizada,
        TipoPersonal: record.tipoPersonal,
        TipoAusencia: record.tipoAusencia,
        DiasAusencia: record.diasAusHastaFinP,
        DiasSustituidos: record.diasSustituidosHastaFinP,
        DiasNoSustituidos: record.diasNoSustituidos,
        CosteTotal: record.totalNomina,
        Suplente: record.hasSuplente ? "Sí" : "No"
      }))
    );
  };

  return (
    <DashboardLayout parsed={parsed} activeTab={activeTab} onTabChange={setActiveTab} onFile={onFile} loading={loading} filterSummary={filterSummary}>
      {!parsed ? (
        <>
          {error ? <ErrorPanel messages={[error]} /> : null}
          <EmptyState onPick={() => document.querySelector<HTMLInputElement>(".file-uploader input")?.click()} />
        </>
      ) : (
        <>
          <ErrorPanel messages={[...parsed.warnings, ...(error ? [error] : [])]} />
          <FilterPanel records={parsed.records} filters={filters} onApply={setFilters} onClear={() => setFilters(emptyFilters)} onExport={exportView} />
          {activeTab === "resumen" ? <SummaryPage records={filteredRecords} metrics={metrics} /> : null}
          {activeTab === "inteligencia" && intelligence ? <IntelligencePage records={filteredRecords} intelligence={intelligence} /> : null}
          {activeTab === "absentismo" ? <AbsencePage records={filteredRecords} metrics={metrics} /> : null}
          {activeTab === "cobertura" ? <CoveragePage records={filteredRecords} metrics={metrics} /> : null}
          {activeTab === "costes" ? <CostsPage records={filteredRecords} metrics={metrics} /> : null}
          {activeTab === "categorias" ? <CategoriesPage records={filteredRecords} /> : null}
          {activeTab === "ambitos" ? <UnitsPage records={filteredRecords} parsed={parsed} /> : null}
          {activeTab === "detalle" ? <main className="content-stack"><DataTable records={filteredRecords} /></main> : null}
          {activeTab === "informe" ? <ExecutiveReport parsed={parsed} metrics={metrics} filters={filters} topCategorias={topCategorias} topNoCubierto={topNoCubierto} intelligence={intelligence ?? undefined} /> : null}
          <section className="validation-log">
            <strong>Validación interna</strong>
            <span>{parsed.logs.join(" · ")} · Columnas dinámicas: {parsed.dynamicDimensions.length ? parsed.dynamicDimensions.join(", ") : "no detectadas"}</span>
            <span className="formula-note">Impacto gestor v1.5 = 35% días ausencia + 25% días no sustituidos + 25% coste total + 15% baja cobertura.</span>
            <span className="formula-note">Cabecera normalizada automáticamente: {normalizeHeader(parsed.columns.slice(0, 4).join(" | "))}</span>
          </section>
        </>
      )}
    </DashboardLayout>
  );
}
