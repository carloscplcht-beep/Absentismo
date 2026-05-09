import { useMemo, useState } from "react";
import type { AlertPriority, ManagerAlert } from "../types/intelligence";
import { AlertCard } from "./AlertCard";

const priorities: Array<AlertPriority | "Todas"> = ["Todas", "Alta prioridad", "Prioridad media", "Informativa"];

export function AlertPanel({ alerts }: { alerts: ManagerAlert[] }) {
  const [priority, setPriority] = useState<AlertPriority | "Todas">("Todas");
  const filtered = useMemo(() => (priority === "Todas" ? alerts : alerts.filter((alert) => alert.priority === priority)), [alerts, priority]);
  const counts = priorities.slice(1).map((item) => `${item}: ${alerts.filter((alert) => alert.priority === item).length}`).join(" · ");
  return (
    <section className="analysis-panel">
      <div className="section-title-row">
        <div>
          <span>Motor local de alertas</span>
          <h2>Alertas gestoras automaticas</h2>
          <p>{counts}</p>
        </div>
        <select value={priority} onChange={(event) => setPriority(event.target.value as AlertPriority | "Todas")}>
          {priorities.map((item) => <option value={item} key={item}>{item}</option>)}
        </select>
      </div>
      {filtered.length ? <div className="alerts-grid">{filtered.map((alert) => <AlertCard key={alert.id} alert={alert} />)}</div> : <div className="info-banner">No se han activado alertas con los filtros actuales.</div>}
    </section>
  );
}
