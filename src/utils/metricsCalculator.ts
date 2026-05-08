import type { Metrics, NormalizedRecord } from "../types/data";

const sum = (records: NormalizedRecord[], pick: (record: NormalizedRecord) => number) =>
  records.reduce((total, record) => total + (Number.isFinite(pick(record)) ? pick(record) : 0), 0);

const uniqueCount = (values: string[]) => new Set(values.filter(Boolean)).size;

const usableIdentifier = (value: string) => {
  const clean = String(value ?? "").trim();
  if (!clean || clean === "0" || clean === "1") return "";
  return clean.length >= 5 ? clean : "";
};

export const absentPersonKey = (record: NormalizedRecord) =>
  usableIdentifier(record.dniUnico) || usableIdentifier(record.dni) || record.titular;

export const substitutePersonKey = (record: NormalizedRecord) =>
  record.hasSuplente ? usableIdentifier(record.dniSuplenteUnico) || usableIdentifier(record.dniSuplente) || record.suplente : "";

export const absenceKey = (record: NormalizedRecord) =>
  [
    absentPersonKey(record),
    record.ausInicio?.toISOString() ?? "",
    record.ausFin?.toISOString() ?? "",
    record.tipoAusencia,
    record.categoriaCentralizada,
    record.categoriaNombramiento
  ].join("|");

export const absenceUniqueCount = (records: NormalizedRecord[]) => {
  const marker = sum(records, (record) => record.ausenciasUnicas);
  if (marker > 0) return marker;
  return uniqueCount(records.map(absenceKey));
};

const absencesWithSuplenteCount = (records: NormalizedRecord[]) => uniqueCount(records.filter((record) => record.hasSuplente).map(absenceKey));

export const calculateMetrics = (records: NormalizedRecord[]): Metrics => {
  const totalRegistros = records.length;
  const ausenciasUnicas = absenceUniqueCount(records);
  const diasAusencia = sum(records, (record) => record.diasAus);
  const diasAusenciaHastaFinP = sum(records, (record) => record.diasAusHastaFinP);
  const diasSustituidos = sum(records, (record) => record.diasSustituidos);
  const diasSustituidosHastaFinP = sum(records, (record) => record.diasSustituidosHastaFinP);
  const diasNoSustituidos = Math.max(0, diasAusenciaHastaFinP - diasSustituidosHastaFinP);
  const ausenciasConSuplente = Math.min(ausenciasUnicas, absencesWithSuplenteCount(records));
  const ausenciasSinSuplente = Math.max(0, ausenciasUnicas - ausenciasConSuplente);
  const brutoNomina = sum(records, (record) => record.brutoNomina);
  const cuotaPatronal = sum(records, (record) => record.cuotaPatronal);
  const totalNomina = sum(records, (record) => record.totalNomina);
  const ausenciasAbiertas = records.filter((record) => record.ausenciaAbierta).length;
  return {
    totalRegistros,
    ausenciasUnicas,
    personasAusentesUnicas: uniqueCount(records.map(absentPersonKey)),
    suplentesUnicos: uniqueCount(records.map(substitutePersonKey)),
    diasAusencia,
    diasAusenciaHastaFinP,
    diasSustituidos,
    diasSustituidosHastaFinP,
    diasNoSustituidos,
    porcentajeSustitucionDias: diasAusenciaHastaFinP ? diasSustituidosHastaFinP / diasAusenciaHastaFinP : 0,
    ausenciasConSuplente,
    ausenciasSinSuplente,
    porcentajeAusenciasConSuplente: ausenciasUnicas ? ausenciasConSuplente / ausenciasUnicas : 0,
    brutoNomina,
    cuotaPatronal,
    totalNomina,
    costeMedioDiaSustituido: diasSustituidosHastaFinP ? totalNomina / diasSustituidosHastaFinP : 0,
    costeMedioDiaAusencia: diasAusenciaHastaFinP ? totalNomina / diasAusenciaHastaFinP : 0,
    costeMedioAusencia: ausenciasUnicas ? totalNomina / ausenciasUnicas : 0,
    costeMedioAusenciaCubierta: ausenciasConSuplente ? totalNomina / ausenciasConSuplente : 0,
    ausenciasAbiertas,
    porcentajeAusenciasAbiertas: totalRegistros ? ausenciasAbiertas / totalRegistros : 0
  };
};

export const median = (values: number[]) => {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};
