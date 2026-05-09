import { useMemo, useState } from "react";
import { Eye, EyeOff, Search } from "lucide-react";
import type { NormalizedRecord } from "../types/data";
import { formatCurrency, formatDate, formatNumber, formatPercent, downloadCsv } from "../utils/formatters";
import { maskIdentifier } from "../utils/privacyUtils";

type DataTableProps = {
  records: NormalizedRecord[];
};

type SortKey = keyof NormalizedRecord;

const columns: Array<{ key: SortKey; label: string; type?: "date" | "number" | "currency" | "percent" | "dni" | "text" }> = [
  { key: "ambito", label: "Ámbito" },
  { key: "anio", label: "Año" },
  { key: "titular", label: "Titular" },
  { key: "dni", label: "DNI", type: "dni" },
  { key: "categoriaCentralizada", label: "Categoría centralizada" },
  { key: "categoriaNombramiento", label: "Categoría nombramiento" },
  { key: "tipoPersonal", label: "Tipo personal" },
  { key: "relJuridica", label: "Rel. jurídica" },
  { key: "tipoAusencia", label: "Tipo ausencia" },
  { key: "ausInicio", label: "Inicio", type: "date" },
  { key: "ausFin", label: "Fin", type: "date" },
  { key: "diasAusHastaFinP", label: "Días ausencia", type: "number" },
  { key: "suplente", label: "Suplente" },
  { key: "dniSuplente", label: "DNI suplente", type: "dni" },
  { key: "diasSustituidosHastaFinP", label: "Días sustituidos", type: "number" },
  { key: "diasNoSustituidos", label: "Días no sustituidos", type: "number" },
  { key: "mesPagoSuplente", label: "Mes pago" },
  { key: "provisionSubtipo", label: "Provisión" },
  { key: "totalNomina", label: "Coste total", type: "currency" }
];

const printable = (record: NormalizedRecord, key: SortKey, showSensitive: boolean) => {
  const column = columns.find((item) => item.key === key);
  const value = record[key];
  if (column?.type === "date") return formatDate(value as Date | null);
  if (column?.type === "currency") return formatCurrency(value as number);
  if (column?.type === "number") return formatNumber(value as number, 1);
  if (column?.type === "percent") return formatPercent(value as number);
  if (column?.type === "dni") return showSensitive ? String(value ?? "") : maskIdentifier(String(value ?? ""));
  return String(value ?? "");
};

export function DataTable({ records }: DataTableProps) {
  const [search, setSearch] = useState("");
  const [showSensitive, setShowSensitive] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey; direction: "asc" | "desc" }>({ key: "diasAusHastaFinP", direction: "desc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const visible = !needle
      ? records
      : records.filter((record) =>
          columns.some((column) => printable(record, column.key, false).toLowerCase().includes(needle))
        );
    return [...visible].sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      const aComparable = av instanceof Date ? av.getTime() : typeof av === "number" ? av : String(av ?? "");
      const bComparable = bv instanceof Date ? bv.getTime() : typeof bv === "number" ? bv : String(bv ?? "");
      const result = aComparable > bComparable ? 1 : aComparable < bComparable ? -1 : 0;
      return sort.direction === "asc" ? result : -result;
    });
  }, [records, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const exportRows = () => {
    downloadCsv(
      "detalle_ausencias_filtrado.csv",
      filtered.map((record) =>
        Object.fromEntries(columns.map((column) => [column.label, printable(record, column.key, showSensitive)]))
      )
    );
  };

  return (
    <section className="table-section">
      <div className="table-toolbar">
        <label className="search-box">
          <Search size={18} />
          <input value={search} onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }} placeholder="Buscar en todos los campos visibles" />
        </label>
        <label className="toggle">
          <input type="checkbox" checked={showSensitive} onChange={(event) => setShowSensitive(event.target.checked)} />
          {showSensitive ? <Eye size={17} /> : <EyeOff size={17} />}
          <span>Mostrar datos identificativos</span>
        </label>
        <select value={pageSize} onChange={(event) => {
          setPageSize(Number(event.target.value));
          setPage(1);
        }}>
          <option value="10">10 filas</option>
          <option value="25">25 filas</option>
          <option value="50">50 filas</option>
          <option value="100">100 filas</option>
        </select>
        <button className="secondary-button" type="button" onClick={exportRows}>Exportar CSV</button>
      </div>
      <div className="privacy-note privacy-note--table">
        No se muestran DNI por defecto. Active el interruptor solo si la finalidad de gestión lo justifica.
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} data-type={column.type ?? "text"}>
                  <button type="button" onClick={() => setSort((current) => ({
                    key: column.key,
                    direction: current.key === column.key && current.direction === "desc" ? "asc" : "desc"
                  }))}>
                    {column.label}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((record) => (
              <tr key={record.id}>
                {columns.map((column) => (
                  <td key={column.key} data-type={column.type ?? "text"} title={printable(record, column.key, showSensitive)}>
                    {printable(record, column.key, showSensitive)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pagination">
        <span>{formatNumber(filtered.length)} registros · página {page} de {totalPages}</span>
        <div>
          <button className="ghost-button" type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Anterior</button>
          <button className="ghost-button" type="button" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Siguiente</button>
        </div>
      </div>
    </section>
  );
}
