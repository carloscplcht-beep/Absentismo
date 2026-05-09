import { CircleAlert, Info, TriangleAlert } from "lucide-react";
import type { ManagerAlert } from "../types/intelligence";

const iconFor = {
  "Alta prioridad": TriangleAlert,
  "Prioridad media": CircleAlert,
  Informativa: Info
};

export function AlertCard({ alert }: { alert: ManagerAlert }) {
  const Icon = iconFor[alert.priority];
  const tone = alert.priority === "Alta prioridad" ? "bad" : alert.priority === "Prioridad media" ? "warn" : "good";
  return (
    <article className={`alert-card alert-card--${tone}`}>
      <div className="alert-card__head">
        <Icon size={20} />
        <div>
          <strong>{alert.title}</strong>
          <span>{alert.priority} · {alert.type}</span>
        </div>
      </div>
      <p>{alert.explanation}</p>
      <dl>
        <div><dt>Area</dt><dd>{alert.area}</dd></div>
        <div><dt>Dato</dt><dd>{alert.evidence}</dd></div>
        <div><dt>Accion</dt><dd>{alert.suggestedAction}</dd></div>
      </dl>
    </article>
  );
}
