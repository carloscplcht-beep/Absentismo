import type { Recommendation } from "../types/intelligence";

export function RecommendationPanel({ recommendations }: { recommendations: Recommendation[] }) {
  return (
    <section className="analysis-panel">
      <div className="section-title-row">
        <div>
          <span>Reglas de apoyo gestor</span>
          <h2>Recomendaciones automaticas</h2>
        </div>
      </div>
      {recommendations.length ? (
        <div className="recommendation-grid">
          {recommendations.map((item) => (
            <article className="recommendation-card" key={item.id}>
              <span className="status-pill status-pill--warn">{item.priority}</span>
              <h3>{item.title}</h3>
              <p>{item.explanation}</p>
              <dl>
                <div><dt>Dato</dt><dd>{item.evidence}</dd></div>
                <div><dt>Ambito</dt><dd>{item.area}</dd></div>
                <div><dt>Accion</dt><dd>{item.suggestedAction}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      ) : <div className="info-banner">No se han generado recomendaciones con los filtros actuales.</div>}
    </section>
  );
}
