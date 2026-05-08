import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const filePath = process.argv[2] || "C:/Users/carlo/Downloads/RH_Cobertura_Ausencias.xls";

const normalize = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[()]/g, " ")
    .replace(/[._:/\\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

const aliases = {
  ambito: ["AMBITO", "ÁMBITO"],
  categoriaCentralizada: ["CATEGORIA CENTRALIZADA"],
  categoriaNombramiento: ["CATEGORIA NOMBRAMIENTO"],
  tipoPersonal: ["TIPO DE PERSONAL"],
  ausInicio: ["AUS INICIO"],
  ausFin: ["AUS FIN"],
  diasAus: ["DIAS AUS"],
  diasAusHastaFinP: ["DIAS AUSENCIA HASTA FIN P"],
  tipoAusencia: ["TIPO DE AUSENCIA"],
  suplente: ["SUPLENTE"],
  diasSustituidos: ["DIAS SUSTITUIDOS"],
  diasSustituidosHastaFinP: ["DIAS SUSTITUIDOS HASTA FIN P"],
  totalNomina: ["TOTAL NOMINA ABONADA"],
  brutoNomina: ["BRUTO NOMINA ABONADA"],
  cuotaPatronal: ["CUOTA PATRONAL NOMINA"],
  ausenciasUnicas: ["AUSENCIAS UNICAS"],
  titular: ["TITULAR AUSENTE"],
  dni: ["DNI"],
  dniUnico: ["DNI UNICO"],
  dniSuplente: ["DNI SUPLENTE"],
  dniSuplenteUnico: ["DNI SUPLENTE UNICO"],
  periodo: ["PERIODO CONTEMPLADO"],
  gerencia: ["GERENCIA"]
};

const lookup = new Map();
Object.entries(aliases).forEach(([key, values]) => values.forEach((value) => lookup.set(normalize(value), key)));

const toNumber = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const text = String(value ?? "").trim();
  if (!text) return 0;
  let cleaned = text.replace(/\s/g, "").replace(/€/g, "").replace(/[^\d,.-]/g, "");
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

const toNumberOrFallback = (value, fallback) => {
  const text = String(value ?? "").trim();
  if (value === undefined || value === null || !text || normalize(text) === "NO APLICA") return fallback;
  return toNumber(value);
};

const toDate = (value) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "number" && value > 0) return new Date(Date.UTC(1899, 11, 30) + value * 86400000);
  const text = String(value ?? "").trim();
  if (!text || normalize(text) === "NO APLICA") return null;
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

const hasSuplente = (value) => {
  const text = normalize(value);
  return Boolean(text && text !== "NO EXISTE SUPLENTE" && text !== "NO APLICA" && text !== "SIN SUPLENTE");
};

const usableIdentifier = (value) => {
  const clean = String(value ?? "").trim();
  if (!clean || clean === "0" || clean === "1") return "";
  return clean.length >= 5 ? clean : "";
};

if (!fs.existsSync(filePath)) {
  console.error(`No existe el archivo: ${filePath}`);
  process.exit(1);
}

const workbook = XLSX.readFile(filePath, { cellDates: true, raw: false });
const sheetName = workbook.SheetNames.find((name) => normalize(name) === normalize("RH_Cobertura_Ausencias")) || workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: false });

let headerRowIndex = 0;
let bestScore = -1;
aoa.slice(0, 25).forEach((row, index) => {
  const keys = new Set(row.map((cell) => lookup.get(normalize(cell))).filter(Boolean));
  const score = keys.size;
  if (score > bestScore) {
    bestScore = score;
    headerRowIndex = index;
  }
});

const headers = aoa[headerRowIndex].map((cell) => String(cell ?? "").trim());
const columnMap = {};
headers.forEach((header) => {
  const key = lookup.get(normalize(header));
  if (key && !columnMap[key]) columnMap[key] = header;
});

const rows = XLSX.utils.sheet_to_json(sheet, { header: headers, range: headerRowIndex + 1, defval: "", raw: false });
const get = (row, key) => row[columnMap[key]] ?? "";
const metrics = rows.reduce(
  (acc, row) => {
    const diasAus = toNumber(get(row, "diasAus"));
    const diasAusHastaFinP = toNumberOrFallback(get(row, "diasAusHastaFinP"), diasAus);
    const diasSustituidos = toNumber(get(row, "diasSustituidos"));
    const diasSustituidosHastaFinP = toNumberOrFallback(get(row, "diasSustituidosHastaFinP"), diasSustituidos);
    acc.diasAus += diasAus;
    acc.diasAusHastaFinP += diasAusHastaFinP;
    acc.diasSustituidos += diasSustituidos;
    acc.diasSustituidosHastaFinP += diasSustituidosHastaFinP;
    acc.totalNomina += toNumber(get(row, "totalNomina"));
    acc.brutoNomina += toNumber(get(row, "brutoNomina"));
    acc.cuotaPatronal += toNumber(get(row, "cuotaPatronal"));
    acc.ausenciasUnicas += toNumber(get(row, "ausenciasUnicas"));
    const person = String(usableIdentifier(get(row, "dniUnico")) || usableIdentifier(get(row, "dni")) || get(row, "titular") || "").trim();
    if (person) acc.personas.add(person);
    const absenceKey = [
      person,
      get(row, "ausInicio"),
      get(row, "ausFin"),
      get(row, "tipoAusencia"),
      get(row, "categoriaCentralizada"),
      get(row, "categoriaNombramiento")
    ].join("|");
    if (absenceKey.replace(/\|/g, "")) acc.absenceKeys.add(absenceKey);
    if (hasSuplente(get(row, "suplente"))) acc.suplenteAbsenceKeys.add(absenceKey);
    const inicio = toDate(get(row, "ausInicio"));
    const finValue = String(get(row, "ausFin") ?? "").trim();
    const fin = toDate(finValue);
    if (!inicio) acc.invalidInicio += 1;
    if (finValue && normalize(finValue) !== "NO APLICA" && !fin) acc.invalidFin += 1;
    if (![diasAus, diasAusHastaFinP, diasSustituidos, diasSustituidosHastaFinP].every(Number.isFinite)) acc.invalidNumbers += 1;
    return acc;
  },
  {
    diasAus: 0,
    diasAusHastaFinP: 0,
    diasSustituidos: 0,
    diasSustituidosHastaFinP: 0,
    totalNomina: 0,
    brutoNomina: 0,
    cuotaPatronal: 0,
    ausenciasUnicas: 0,
    personas: new Set(),
    absenceKeys: new Set(),
    suplenteAbsenceKeys: new Set(),
    invalidInicio: 0,
    invalidFin: 0,
    invalidNumbers: 0
  }
);

const critical = ["ambito", "categoriaCentralizada", "categoriaNombramiento", "tipoPersonal", "ausInicio", "ausFin", "diasAus", "diasAusHastaFinP", "tipoAusencia", "suplente", "diasSustituidos", "diasSustituidosHastaFinP", "totalNomina"];
const missing = critical.filter((key) => !columnMap[key]);
const coverage = metrics.diasAusHastaFinP ? metrics.diasSustituidosHastaFinP / metrics.diasAusHastaFinP : 0;
const ausenciasUnicas = metrics.ausenciasUnicas || metrics.absenceKeys.size;
const ausenciasConSuplente = Math.min(ausenciasUnicas, metrics.suplenteAbsenceKeys.size);

console.log(JSON.stringify({
  file: path.basename(filePath),
  sheetName,
  headerRow: headerRowIndex + 1,
  columnsDetected: headers.filter(Boolean).length,
  missingCriticalColumns: missing,
  records: rows.length,
  metrics: {
    diasAusencia: metrics.diasAus,
    diasAusenciaHastaFinP: metrics.diasAusHastaFinP,
    diasSustituidos: metrics.diasSustituidos,
    diasSustituidosHastaFinP: metrics.diasSustituidosHastaFinP,
    diasNoSustituidos: Math.max(0, metrics.diasAusHastaFinP - metrics.diasSustituidosHastaFinP),
    porcentajeSustitucion: coverage,
    costeBruto: metrics.brutoNomina,
    cuotaPatronal: metrics.cuotaPatronal,
    costeTotal: metrics.totalNomina,
    ausenciasConSuplente,
    ausenciasSinSuplente: Math.max(0, ausenciasUnicas - ausenciasConSuplente),
    porcentajeAusenciasConSuplente: ausenciasUnicas ? ausenciasConSuplente / ausenciasUnicas : 0,
    personasAusentes: metrics.personas.size,
    ausenciasUnicas,
    uniqueKeysDeducidas: metrics.absenceKeys.size,
    fechasInicioInvalidas: metrics.invalidInicio,
    fechasFinInvalidas: metrics.invalidFin,
    filasConNumerosInvalidos: metrics.invalidNumbers
  }
}, null, 2));
