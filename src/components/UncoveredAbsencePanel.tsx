import type { UncoveredSummary } from "../types/intelligence";
import { formatCurrency, formatNumber, formatPercent } from "../utils/formatters";
import { KPICard } from "./KPICard";

export function UncoveredAbsencePanel({ uncovered }: { uncovered: UncoveredSummary }) {
  const entries = Object.entries(uncovered.rankings).slice(0, 6);
  return (
    <section className="content-stack">
      <div className="section-title-row">
        <div>
          <span>Presion asistencial potencial</span>
          <h2>Ausencia no cubierta</h2>
          <p>Coste teorico de cobertura si los dias no sustituidos se hubieran cubierto al coste medio observado.</p>
        </div>
      </div>
      <div className="kpi-grid kpi-grid--compact">
        <KPICard label="Dias ausencia" value={formatNumber(uncovered.metrics.diasAusenciaHastaFinP)} />
        <KPICard label="Dias sustituidos" value={formatNumber(uncovered.metrics.diasSustituidosHastaFinP)} />
        <KPICard label="Dias no sustituidos" value={formatNumber(uncovered.metrics.diasNoSustituidos)} tone={uncovered.metrics.diasNoSustituidos ? "warn" : "good"} />
        <KPICard label="% no cubierto" value={formatPercent(uncovered.porcentajeNoCubierto)} />
        <KPICard label="Coste medio dia sustit." value={formatCurrency(uncovered.metrics.costeMedioDiaSustituido)} />
        <KPICard label="Coste teorico cobertura" value={formatCurrency(uncovered.costeTeoricoCobertura, true)} detail="Estimacion orientativa, no coste real" />
      </div>
      {uncovered.warnings.map((warning) => <div className="info-banner" key={warning}>{warning}</div>)}
      <div className="uncovered-grid">
        {entries.map(([title, rows]) => (
          <section className="analysis-panel" key={title}>
            <h3>{title}</h3>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Grupo</th><th data-type="number">Dias no sust.</th><th data-type="percent">Cobertura</th><th data-type="currency">Coste teorico</th></tr></thead>
                <tbody>
                  {rows.slice(0, 5).map((row) => (
                    <tr key={row.key}>
                      <td title={row.label}>{row.label}</td>
                      <td data-type="number">{formatNumber(row.diasNoSustituidos)}</td>
                      <td data-type="percent">{formatPercent(row.porcentajeSustitucion)}</td>
                      <td data-type="currency" title={formatCurrency(row.diasNoSustituidos * uncovered.metrics.costeMedioDiaSustituido)}>
                        {formatCurrency(row.diasNoSustituidos * uncovered.metrics.costeMedioDiaSustituido, true)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
