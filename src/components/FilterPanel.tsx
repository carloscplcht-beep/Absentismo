import { useEffect, useMemo, useState } from "react";
import { Download, FilterX, SlidersHorizontal } from "lucide-react";
import type { FilterState, NormalizedRecord } from "../types/data";
import { emptyFilters, getActiveMonthOptions, getActiveYearOptions, getOptions } from "../utils/aggregations";

type FilterPanelProps = {
  records: NormalizedRecord[];
  filters: FilterState;
  onApply: (filters: FilterState) => void;
  onClear: () => void;
  onExport: () => void;
};

const fieldLabels: Array<[keyof FilterState, keyof NormalizedRecord, string]> = [
  ["anio", "anio", "Año"],
  ["mesAusencia", "anio", "Mes en vigor"],
  ["ambito", "ambito", "Ámbito"],
  ["gerencia", "gerencia", "Gerencia"],
  ["categoriaCentralizada", "categoriaCentralizada", "Categoría centralizada"],
  ["categoriaNombramiento", "categoriaNombramiento", "Categoría nombramiento"],
  ["tipoPersonal", "tipoPersonal", "Tipo de personal"],
  ["relJuridica", "relJuridica", "Rel. jurídica"],
  ["fsn", "fsn", "FSN"],
  ["tipoAusencia", "tipoAusencia", "Tipo de ausencia"],
  ["grupoVpl", "grupoVpl", "Grupo de VPL"],
  ["mesPagoSuplente", "mesPagoSuplente", "Mes pago suplente"],
  ["provisionSubtipo", "provisionSubtipo", "Provisión suplente"]
];

function MultiSelect({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string[];
  options: string[];
  onChange: (value: string[]) => void;
}) {
  const summary = value.length ? `${value.length} seleccionado${value.length === 1 ? "" : "s"}` : "Todos";
  const title = value.length ? value.join(", ") : `Todos los valores de ${label}`;
  return (
    <label className="field">
      <span>{label}</span>
      <select
        multiple
        title={title}
        value={value}
        onChange={(event) => onChange(Array.from(event.currentTarget.selectedOptions).map((option) => option.value))}
      >
        {options.map((option) => (
          <option key={option} value={option} title={option}>
            {option}
          </option>
        ))}
      </select>
      <small className="field-summary" title={title}>{summary}</small>
    </label>
  );
}

export function FilterPanel({ records, filters, onApply, onClear, onExport }: FilterPanelProps) {
  const [open, setOpen] = useState(true);
  const [draft, setDraft] = useState(filters);
  useEffect(() => {
    setDraft(filters);
  }, [filters, records]);
  const options = useMemo(
    () => Object.fromEntries(fieldLabels.map(([filterKey, recordKey]) => [
      filterKey,
      filterKey === "anio" ? getActiveYearOptions(records) : filterKey === "mesAusencia" ? getActiveMonthOptions(records) : getOptions(records, recordKey)
    ])),
    [records]
  ) as Record<string, string[]>;

  return (
    <section className={`filter-panel ${open ? "is-open" : ""}`}>
      <div className="filter-panel__head">
        <button className="icon-text-button" type="button" onClick={() => setOpen((value) => !value)}>
          <SlidersHorizontal size={18} />
          Filtros globales
        </button>
        <div className="filter-panel__actions">
          <button className="ghost-button" type="button" onClick={() => {
            setDraft(emptyFilters);
            onClear();
          }}>
            <FilterX size={17} />
            Limpiar filtros
          </button>
          <button className="secondary-button" type="button" onClick={onExport}>
            <Download size={17} />
            Exportar vista
          </button>
          <button className="primary-button primary-button--small" type="button" onClick={() => onApply(draft)}>
            Aplicar filtros
          </button>
        </div>
      </div>

      {open ? (
        <div className="filters-grid">
          {fieldLabels.map(([filterKey, , label]) => (
            <MultiSelect
              key={filterKey}
              label={filterKey === "anio" ? "Año en vigor" : label}
              value={draft[filterKey] as string[]}
              options={options[filterKey] ?? []}
              onChange={(value) => setDraft((current) => ({ ...current, [filterKey]: value }))}
            />
          ))}
          <label className="field">
            <span>Suplente sí/no</span>
            <select value={draft.suplente} onChange={(event) => setDraft((current) => ({ ...current, suplente: event.target.value as FilterState["suplente"] }))}>
              <option value="all">Todos</option>
              <option value="yes">Con suplente</option>
              <option value="no">Sin suplente</option>
            </select>
          </label>
          <label className="field">
            <span>Ausencia abierta</span>
            <select
              value={draft.ausenciaAbierta}
              onChange={(event) => setDraft((current) => ({ ...current, ausenciaAbierta: event.target.value as FilterState["ausenciaAbierta"] }))}
            >
              <option value="all">Todas</option>
              <option value="yes">Abiertas</option>
              <option value="no">Cerradas</option>
            </select>
          </label>
          <label className="field">
            <span>Periodo en vigor desde</span>
            <input type="date" value={draft.fechaInicioDesde} onChange={(event) => setDraft((current) => ({ ...current, fechaInicioDesde: event.target.value }))} />
          </label>
          <label className="field">
            <span>Periodo en vigor hasta</span>
            <input type="date" value={draft.fechaInicioHasta} onChange={(event) => setDraft((current) => ({ ...current, fechaInicioHasta: event.target.value }))} />
          </label>
          <label className="field">
            <span>Días ausencia mín.</span>
            <input type="number" min="0" value={draft.diasAusMin} onChange={(event) => setDraft((current) => ({ ...current, diasAusMin: event.target.value }))} />
          </label>
          <label className="field">
            <span>Días ausencia máx.</span>
            <input type="number" min="0" value={draft.diasAusMax} onChange={(event) => setDraft((current) => ({ ...current, diasAusMax: event.target.value }))} />
          </label>
          <label className="field">
            <span>Coste total mín.</span>
            <input type="number" min="0" value={draft.costeMin} onChange={(event) => setDraft((current) => ({ ...current, costeMin: event.target.value }))} />
          </label>
          <label className="field">
            <span>Coste total máx.</span>
            <input type="number" min="0" value={draft.costeMax} onChange={(event) => setDraft((current) => ({ ...current, costeMax: event.target.value }))} />
          </label>
        </div>
      ) : null}
    </section>
  );
}
