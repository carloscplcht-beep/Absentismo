import type { NormalizedRecord } from "../types/data";

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

export const safeDivide = (numerator: number, denominator: number) => {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return 0;
  return numerator / denominator;
};

export const cleanFinite = (value: number) => (Number.isFinite(value) ? value : 0);

export const monthKeyFromDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

export const monthLabel = (key: string) => {
  const [year, month] = key.split("-").map(Number);
  if (!year || !month) return "Sin mes";
  return new Intl.DateTimeFormat("es-ES", { month: "short", year: "numeric" }).format(new Date(year, month - 1, 1));
};

export const parseYear = (value: string) => {
  const match = String(value ?? "").match(/\d{4}/);
  return match ? Number(match[0]) : null;
};

const monthNames = new Map<string, number>(
  ([
    ["ENERO", 1],
    ["FEBRERO", 2],
    ["MARZO", 3],
    ["ABRIL", 4],
    ["MAYO", 5],
    ["JUNIO", 6],
    ["JULIO", 7],
    ["AGOSTO", 8],
    ["SEPTIEMBRE", 9],
    ["SETIEMBRE", 9],
    ["OCTUBRE", 10],
    ["NOVIEMBRE", 11],
    ["DICIEMBRE", 12]
  ] as Array<[string, number]>).map(([name, month]) => [name, month])
);

const normalizeText = (value: string) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();

export const parseMonthPaymentDate = (record: NormalizedRecord) => {
  const text = normalizeText(record.mesPagoSuplente);
  if (!text || text === "NO APLICA" || text === "ACTUAL" || text === "VENCIDO") return null;
  const numeric = text.match(/(\d{1,2})[/-](\d{4})/);
  if (numeric) {
    const month = Number(numeric[1]);
    const year = Number(numeric[2]);
    if (month >= 1 && month <= 12) return new Date(year, month - 1, 1);
  }
  const namedMonth = Array.from(monthNames.entries()).find(([name]) => text.includes(name));
  const year = parseYear(text) ?? parseYear(record.anio);
  if (namedMonth && year) return new Date(year, namedMonth[1] - 1, 1);
  return null;
};

export const dateForMonthlyAnalysis = (record: NormalizedRecord, mode: "absence" | "cost" | "coverage" = "absence") => {
  if (mode === "cost") {
    return parseMonthPaymentDate(record) ?? record.inicioSuplencia ?? record.ausInicio ?? record.ausFin ?? yearFallback(record);
  }
  return record.ausInicio ?? record.ausFin ?? yearFallback(record);
};

export const yearFallback = (record: NormalizedRecord) => {
  const year = parseYear(record.anio) ?? parseYear(record.periodo);
  return year ? new Date(year, 0, 1) : null;
};

export const activeFilterCount = (filters: Record<string, unknown>) =>
  Object.values(filters).filter((value) => (Array.isArray(value) ? value.length > 0 : value && value !== "all")).length;

export const methodologyNotes = [
  "Las tendencias mensuales usan AUS. INICIO como fecha principal y recurren a AUS. FIN, AÑO o PERIODO CONTEMPLADO si no existe una fecha interpretable.",
  "La prevision anual es orientativa: lineal con poco historico, ajustada por tendencia si hay seis meses, y estacional si hay dieciocho meses o mas.",
  "El indice de impacto gestor prioriza volumen de dias, dias no sustituidos, coste y baja cobertura; no implica causalidad.",
  "Los calculos se realizan localmente en el navegador. La aplicacion no envia los datos cargados a ningun servidor."
];
