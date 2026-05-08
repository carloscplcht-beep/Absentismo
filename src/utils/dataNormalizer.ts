import type { ColumnKey, NormalizedRecord, RawRecord } from "../types/data";

export const CRITICAL_COLUMNS: ColumnKey[] = [
  "ambito",
  "categoriaCentralizada",
  "categoriaNombramiento",
  "tipoPersonal",
  "ausInicio",
  "ausFin",
  "diasAus",
  "diasAusHastaFinP",
  "tipoAusencia",
  "suplente",
  "diasSustituidos",
  "diasSustituidosHastaFinP",
  "totalNomina"
];

export const COLUMN_LABELS: Record<ColumnKey, string> = {
  periodo: "PERIODO CONTEMPLADO",
  gerencia: "GERENCIA",
  ambito: "ÁMBITO",
  titular: "TITULAR (AUSENTE)",
  dni: "DNI",
  dniUnico: "DNI ÚNICO",
  dniDiferenteTipoPersonal: "DNI DIFERENTE POR TIPO DE PERSONAL",
  relJuridica: "REL. JURÍDICA",
  fsn: "FSN",
  categoriaCentralizada: "CATEGORÍA CENTRALIZADA",
  tipoPersonal: "TIPO DE PERSONAL",
  categoriaNombramiento: "CATEGORÍA NOMBRAMIENTO",
  ausInicio: "AUS. INICIO",
  ausFin: "AUS. FIN",
  diasAus: "DÍAS AUS.",
  ausenciasUnicas: "AUSENCIAS ÚNICAS",
  diasCadaAusenciaUnica: "DÍAS DE CADA AUSENCIA ÚNICA",
  diasAusHastaFinP: "DÍAS AUSENCIA HASTA FIN P.",
  tipoAusencia: "TIPO DE AUSENCIA",
  grupoVpl: "GRUPO DE VPL",
  anio: "AÑO",
  suplente: "SUPLENTE",
  dniSuplente: "DNI SUPLENTE",
  dniSuplenteUnico: "DNI SUPLENTE ÚNICO",
  inicioSuplencia: "INICIO SUPLENCIA",
  finSuplencia: "FIN SUPLENCIA",
  diasSustituidos: "DÍAS SUSTITUIDOS",
  diasSustituidosHastaFinP: "DÍAS SUSTITUIDOS HASTA FIN P.",
  provisionSubtipo: "PROVISIÓN Y SUBTIPO PROVISIÓN SUPLENTE",
  mesPagoSuplente: "MES PAGO SUPLENTE",
  brutoNomina: "Bruto Nómina Abonada",
  cuotaPatronal: "Cuota Patronal Nómina",
  totalNomina: "TOTAL Nómina Abonada"
};

const ALIASES: Record<ColumnKey, string[]> = {
  periodo: ["PERIODO CONTEMPLADO", "PERIODO"],
  gerencia: ["GERENCIA"],
  ambito: ["AMBITO", "ÁMBITO"],
  titular: ["TITULAR AUSENTE", "TITULAR (AUSENTE)", "TITULAR"],
  dni: ["DNI"],
  dniUnico: ["DNI UNICO", "DNI ÚNICO"],
  dniDiferenteTipoPersonal: ["DNI DIFERENTE POR TIPO DE PERSONAL"],
  relJuridica: ["REL JURIDICA", "REL. JURIDICA", "REL. JURÍDICA", "RELACION JURIDICA"],
  fsn: ["FSN"],
  categoriaCentralizada: ["CATEGORIA CENTRALIZADA", "CATEGORÍA CENTRALIZADA"],
  tipoPersonal: ["TIPO DE PERSONAL"],
  categoriaNombramiento: ["CATEGORIA NOMBRAMIENTO", "CATEGORÍA NOMBRAMIENTO"],
  ausInicio: ["AUS INICIO", "AUS. INICIO", "INICIO AUSENCIA"],
  ausFin: ["AUS FIN", "AUS. FIN", "FIN AUSENCIA"],
  diasAus: ["DIAS AUS", "DÍAS AUS.", "DIAS AUS.", "DIAS AUSENCIA"],
  ausenciasUnicas: ["AUSENCIAS UNICAS", "AUSENCIAS ÚNICAS"],
  diasCadaAusenciaUnica: ["DIAS DE CADA AUSENCIA UNICA", "DÍAS DE CADA AUSENCIA ÚNICA"],
  diasAusHastaFinP: ["DIAS AUSENCIA HASTA FIN P", "DÍAS AUSENCIA HASTA FIN P.", "DIAS AUSENCIA HASTA FIN P."],
  tipoAusencia: ["TIPO DE AUSENCIA"],
  grupoVpl: ["GRUPO DE VPL", "GRUPO VPL"],
  anio: ["ANO", "AÑO"],
  suplente: ["SUPLENTE"],
  dniSuplente: ["DNI SUPLENTE"],
  dniSuplenteUnico: ["DNI SUPLENTE UNICO", "DNI SUPLENTE ÚNICO"],
  inicioSuplencia: ["INICIO SUPLENCIA"],
  finSuplencia: ["FIN SUPLENCIA"],
  diasSustituidos: ["DIAS SUSTITUIDOS", "DÍAS SUSTITUIDOS"],
  diasSustituidosHastaFinP: ["DIAS SUSTITUIDOS HASTA FIN P", "DÍAS SUSTITUIDOS HASTA FIN P."],
  provisionSubtipo: ["PROVISION Y SUBTIPO PROVISION SUPLENTE", "PROVISIÓN Y SUBTIPO PROVISIÓN SUPLENTE"],
  mesPagoSuplente: ["MES PAGO SUPLENTE"],
  brutoNomina: ["BRUTO NOMINA ABONADA", "BRUTO NÓMINA ABONADA"],
  cuotaPatronal: ["CUOTA PATRONAL NOMINA", "CUOTA PATRONAL NÓMINA"],
  totalNomina: ["TOTAL NOMINA ABONADA", "TOTAL NÓMINA ABONADA"]
};

export const normalizeHeader = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[()]/g, " ")
    .replace(/[._:/\\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

const aliasLookup = new Map<string, ColumnKey>();
Object.entries(ALIASES).forEach(([key, aliases]) => {
  aliases.forEach((alias) => aliasLookup.set(normalizeHeader(alias), key as ColumnKey));
});

export const keyForHeader = (header: unknown): ColumnKey | undefined => aliasLookup.get(normalizeHeader(header));

export const detectHeaderRow = (rows: unknown[][]) => {
  let bestIndex = 0;
  let bestScore = -1;
  rows.slice(0, 25).forEach((row, index) => {
    const keys = new Set(row.map(keyForHeader).filter(Boolean));
    const critical = CRITICAL_COLUMNS.filter((column) => keys.has(column)).length;
    const score = keys.size + critical * 2;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });
  return bestIndex;
};

export const buildColumnMap = (headers: unknown[]) => {
  const columnMap: Partial<Record<ColumnKey, string>> = {};
  headers.forEach((header) => {
    const key = keyForHeader(header);
    const label = String(header ?? "").trim();
    if (key && label && !columnMap[key]) columnMap[key] = label;
  });
  return columnMap;
};

export const dynamicDimensionColumns = (headers: string[]) => {
  const wanted = ["UNIDAD", "SERVICIO", "DIRECCION", "DIRECCIÓN", "CENTRO", "ZONA BASICA", "ZONA BÁSICA"];
  return headers.filter((header) => wanted.includes(normalizeHeader(header)));
};

export const getText = (value: unknown) => String(value ?? "").trim();

export const isEmptyLike = (value: unknown) => {
  const text = normalizeHeader(value);
  return !text || text === "NO APLICA" || text === "NO EXISTE" || text === "SIN DATOS";
};

export const hasValidSuplente = (value: unknown) => {
  const text = normalizeHeader(value);
  return Boolean(text && text !== "NO EXISTE SUPLENTE" && text !== "NO APLICA" && text !== "SIN SUPLENTE");
};

export const toNumber = (value: unknown) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const text = String(value ?? "").trim();
  if (!text || normalizeHeader(text) === "NO APLICA") return 0;
  let cleaned = text
    .replace(/\s/g, "")
    .replace(/€/g, "")
    .replace(/[^\d,.-]/g, "");
  const comma = cleaned.lastIndexOf(",");
  const dot = cleaned.lastIndexOf(".");
  if (comma >= 0 && dot >= 0) {
    const decimalSeparator = comma > dot ? "," : ".";
    const thousandsSeparator = decimalSeparator === "," ? "." : ",";
    cleaned = cleaned.replaceAll(thousandsSeparator, "").replace(decimalSeparator, ".");
  } else if (comma >= 0) {
    cleaned = /\d,\d{3}$/.test(cleaned) ? cleaned.replaceAll(",", "") : cleaned.replace(",", ".");
  } else if (dot >= 0 && /\d\.\d{3}$/.test(cleaned)) {
    cleaned = cleaned.replaceAll(".", "");
  }
  const numeric = Number(cleaned);
  return Number.isFinite(numeric) ? numeric : 0;
};

const toNumberOrFallback = (value: unknown, fallback: number) => {
  const text = String(value ?? "").trim();
  if (value === undefined || value === null || !text || normalizeHeader(text) === "NO APLICA") return fallback;
  return toNumber(value);
};

export const toDate = (value: unknown) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "number" && value > 0) {
    const epoch = Date.UTC(1899, 11, 30);
    const date = new Date(epoch + value * 86400000);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const text = String(value ?? "").trim();
  if (!text || normalizeHeader(text) === "NO APLICA") return null;
  const match = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (match) {
    const [, d, m, y, h = "0", min = "0"] = match;
    const year = y.length === 2 ? Number(`20${y}`) : Number(y);
    const date = new Date(year, Number(m) - 1, Number(d), Number(h), Number(min));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const get = (row: RawRecord, map: Partial<Record<ColumnKey, string>>, key: ColumnKey) =>
  map[key] ? row[map[key]!] : undefined;

export const normalizeRecords = (
  rows: RawRecord[],
  columnMap: Partial<Record<ColumnKey, string>>
): NormalizedRecord[] =>
  rows
    .map((row, index) => {
      const diasAus = toNumber(get(row, columnMap, "diasAus"));
      const diasAusHastaFinP = toNumberOrFallback(get(row, columnMap, "diasAusHastaFinP"), diasAus);
      const diasSustituidos = toNumber(get(row, columnMap, "diasSustituidos"));
      const diasSustituidosHastaFinP = toNumberOrFallback(
        get(row, columnMap, "diasSustituidosHastaFinP"),
        diasSustituidos
      );
      const suplente = getText(get(row, columnMap, "suplente"));
      const ausFin = toDate(get(row, columnMap, "ausFin"));
      const ausInicio = toDate(get(row, columnMap, "ausInicio"));
      const anio = getText(get(row, columnMap, "anio")) || (ausInicio ? String(ausInicio.getFullYear()) : "Sin año");
      const normalized: NormalizedRecord = {
        id: `r-${index + 1}`,
        periodo: getText(get(row, columnMap, "periodo")),
        gerencia: getText(get(row, columnMap, "gerencia")),
        ambito: getText(get(row, columnMap, "ambito")) || "Sin ámbito",
        titular: getText(get(row, columnMap, "titular")),
        dni: getText(get(row, columnMap, "dni")),
        dniUnico: getText(get(row, columnMap, "dniUnico")),
        dniDiferenteTipoPersonal: getText(get(row, columnMap, "dniDiferenteTipoPersonal")),
        relJuridica: getText(get(row, columnMap, "relJuridica")) || "Sin relación jurídica",
        fsn: getText(get(row, columnMap, "fsn")) || "Sin FSN",
        categoriaCentralizada: getText(get(row, columnMap, "categoriaCentralizada")) || "Sin categoría",
        tipoPersonal: getText(get(row, columnMap, "tipoPersonal")) || "Sin tipo",
        categoriaNombramiento: getText(get(row, columnMap, "categoriaNombramiento")) || "Sin nombramiento",
        ausInicio,
        ausFin,
        diasAus,
        ausenciasUnicas: toNumber(get(row, columnMap, "ausenciasUnicas")),
        diasCadaAusenciaUnica: toNumber(get(row, columnMap, "diasCadaAusenciaUnica")),
        diasAusHastaFinP,
        tipoAusencia: getText(get(row, columnMap, "tipoAusencia")) || "Sin tipo de ausencia",
        grupoVpl: getText(get(row, columnMap, "grupoVpl")) || "Sin grupo",
        anio,
        suplente,
        dniSuplente: getText(get(row, columnMap, "dniSuplente")),
        dniSuplenteUnico: getText(get(row, columnMap, "dniSuplenteUnico")),
        inicioSuplencia: toDate(get(row, columnMap, "inicioSuplencia")),
        finSuplencia: toDate(get(row, columnMap, "finSuplencia")),
        diasSustituidos,
        diasSustituidosHastaFinP,
        provisionSubtipo: getText(get(row, columnMap, "provisionSubtipo")) || "No aplica",
        mesPagoSuplente: getText(get(row, columnMap, "mesPagoSuplente")) || "No aplica",
        brutoNomina: toNumber(get(row, columnMap, "brutoNomina")),
        cuotaPatronal: toNumber(get(row, columnMap, "cuotaPatronal")),
        totalNomina: toNumber(get(row, columnMap, "totalNomina")),
        hasSuplente: hasValidSuplente(suplente),
        ausenciaAbierta: !ausFin,
        diasNoSustituidos: Math.max(0, diasAusHastaFinP - diasSustituidosHastaFinP),
        raw: row
      };
      return normalized;
    })
    .filter((record) => Object.values(record.raw).some((value) => !isEmptyLike(value)));

export const missingCriticalColumns = (columnMap: Partial<Record<ColumnKey, string>>) =>
  CRITICAL_COLUMNS.filter((key) => !columnMap[key]).map((key) => COLUMN_LABELS[key]);
