import type { AggregateRow, FilterState, Metrics, ParsedWorkbook } from "../types/data";
import { formatCurrency, formatNumber, formatPercent } from "../utils/formatters";
import { SESCAM_LOGO } from "../utils/brandAssets";

type ExecutiveReportProps = {
  parsed: ParsedWorkbook;
  metrics: Metrics;
  filters: FilterState;
  topCategorias: AggregateRow[];
  topNoCubierto: AggregateRow[];
};

const filterText = (filters: FilterState) => {
  const active = Object.entries(filters).filter(([, value]) => Array.isArray(value) ? value.length > 0 : value && value !== "all");
  return active.length ? active.map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`).join(" · ") : "Sin filtros aplicados";
};

export function ExecutiveReport({ parsed, metrics, filters, topCategorias, topNoCubierto }: ExecutiveReportProps) {
  const topNames = topCategorias.slice(0, 3).map((row) => row.label).join(", ") || "sin datos suficientes";
  const uncovered = topNoCubierto.slice(0, 3).map((row) => row.label).join(", ") || "sin datos suficientes";
  const recommendations = [
    metrics.porcentajeSustitucionDias < 0.5
      ? "Priorizar la revisión de circuitos de cobertura en categorías con menor porcentaje de sustitución."
      : "Mantener seguimiento periódico de la cobertura para evitar deterioro en periodos de alta demanda.",
    metrics.diasNoSustituidos > 0
      ? "Analizar las bolsas de días no sustituidos por categoría y ámbito para orientar decisiones de dotación."
      : "No se observan días no sustituidos en la vista filtrada.",
    metrics.totalNomina > 0
      ? "Contrastar el coste por día sustituido en categorías de alto impacto antes de adoptar medidas homogéneas."
      : "No consta coste de nómina abonada en la vista filtrada."
  ];

  return (
    <section className="report-page">
      <div className="report-actions">
        <button className="primary-button" type="button" onClick={() => window.print()}>
          Imprimir / guardar PDF
        </button>
      </div>
      <article className="report-document">
        <header>
          <div>
            <h2>Informe ejecutivo de absentismo y cobertura de ausencias</h2>
            <p>Cuadro de mando institucional · procesamiento local</p>
          </div>
          <img src={SESCAM_LOGO} alt="SESCAM" />
        </header>
        <section className="report-meta">
          <div><span>Gerencia</span><strong>{parsed.metadata.gerencia || "No detectada"}</strong></div>
          <div><span>Periodo analizado</span><strong>{parsed.metadata.periodo || "No detectado"}</strong></div>
          <div><span>Fecha/hora de datos</span><strong>{parsed.metadata.detectedAt || new Date(parsed.metadata.loadedAt).toLocaleString("es-ES")}</strong></div>
          <div><span>Última nómina cerrada</span><strong>{parsed.metadata.ultimaNominaCerrada || "No detectada"}</strong></div>
        </section>
        <section>
          <h3>Filtros aplicados</h3>
          <p>{filterText(filters)}</p>
        </section>
        <section>
          <h3>Resumen ejecutivo automático</h3>
          <p>
            Durante el periodo analizado se han registrado {formatNumber(metrics.ausenciasUnicas)} ausencias, con un total de{" "}
            {formatNumber(metrics.diasAusenciaHastaFinP)} días de ausencia hasta fin de periodo. De estos,{" "}
            {formatNumber(metrics.diasSustituidosHastaFinP)} días han sido sustituidos, lo que supone una cobertura del{" "}
            {formatPercent(metrics.porcentajeSustitucionDias)}. El coste total asociado a las sustituciones asciende a{" "}
            {formatCurrency(metrics.totalNomina)}. Las categorías con mayor impacto en la vista actual son {topNames}.
          </p>
        </section>
        <section className="report-kpis">
          <div><span>Ausencias únicas</span><strong>{formatNumber(metrics.ausenciasUnicas)}</strong></div>
          <div><span>Días ausencia</span><strong>{formatNumber(metrics.diasAusenciaHastaFinP)}</strong></div>
          <div><span>Cobertura</span><strong>{formatPercent(metrics.porcentajeSustitucionDias)}</strong></div>
          <div><span>Coste total</span><strong>{formatCurrency(metrics.totalNomina)}</strong></div>
        </section>
        <section>
          <h3>Principales hallazgos</h3>
          <ul>
            <li>{topNames} concentran el mayor impacto gestor calculado por días, días no sustituidos, coste y cobertura.</li>
            <li>Las áreas con mayor ausencia no cubierta en la vista actual son {uncovered}.</li>
            <li>Hay {formatNumber(metrics.ausenciasAbiertas)} ausencias abiertas, equivalentes al {formatPercent(metrics.porcentajeAusenciasAbiertas)} de los registros filtrados.</li>
          </ul>
        </section>
        <section>
          <h3>Recomendaciones gestoras automáticas</h3>
          <ul>
            {recommendations.map((recommendation) => (
              <li key={recommendation}>{recommendation}</li>
            ))}
          </ul>
        </section>
      </article>
    </section>
  );
}
