import type { AggregateRow, FilterState, NormalizedRecord } from "../types/data";
import { absenceUniqueCount, absentPersonKey, calculateMetrics } from "./metricsCalculator";

export const emptyFilters: FilterState = {
  anio: [],
  mesAusencia: [],
  ambito: [],
  gerencia: [],
  categoriaCentralizada: [],
  categoriaNombramiento: [],
  tipoPersonal: [],
  relJuridica: [],
  fsn: [],
  tipoAusencia: [],
  grupoVpl: [],
  mesPagoSuplente: [],
  provisionSubtipo: [],
  suplente: "all",
  ausenciaAbierta: "all",
  fechaInicioDesde: "",
  fechaInicioHasta: "",
  diasAusMin: "",
  diasAusMax: "",
  costeMin: "",
  costeMax: ""
};

const includes = (selected: string[], value: string) => !selected.length || selected.includes(value || "Sin datos");

type TemporalWindow = {
  start: Date;
  end: Date;
};

const yearFromText = (value: string) => {
  const match = String(value ?? "").match(/\d{4}/);
  return match ? Number(match[0]) : null;
};

const yearFromDate = (value: Date | null | undefined) => {
  if (!value || Number.isNaN(value.getTime())) return null;
  return value.getFullYear();
};

const datasetMaxYear = (records: NormalizedRecord[]) => {
  const years = records.flatMap((record) => [
    yearFromDate(record.ausInicio),
    yearFromDate(record.ausFin),
    yearFromText(record.anio),
    yearFromText(record.periodo)
  ]).filter((year): year is number => Number.isFinite(year));
  return years.length ? Math.max(...years) : new Date().getFullYear();
};

const datasetOpenEndYear = (records: NormalizedRecord[]) => {
  const years = records.flatMap((record) => [
    yearFromDate(record.ausInicio),
    yearFromText(record.anio),
    yearFromText(record.periodo)
  ]).filter((year): year is number => Number.isFinite(year));
  return years.length ? Math.max(...years) : datasetMaxYear(records);
};

const recordFallbackYear = (record: NormalizedRecord) =>
  yearFromDate(record.ausInicio) ?? yearFromDate(record.ausFin) ?? yearFromText(record.anio) ?? yearFromText(record.periodo);

const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const monthStart = (key: string) => {
  const [year, month] = key.split("-").map(Number);
  return year && month ? new Date(year, month - 1, 1, 0, 0, 0, 0) : null;
};

const monthEnd = (key: string) => {
  const [year, month] = key.split("-").map(Number);
  return year && month ? new Date(year, month, 0, 23, 59, 59, 999) : null;
};

const daysInclusive = (start: Date, end: Date) => {
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.max(0, Math.floor((endUtc - startUtc) / 86400000) + 1);
};

const endFromDays = (start: Date | null, days: number) => {
  if (!start || !Number.isFinite(days) || days <= 0) return null;
  const end = new Date(start);
  end.setDate(end.getDate() + Math.floor(days) - 1);
  end.setHours(23, 59, 59, 999);
  return end;
};

const overlapWindow = (a: TemporalWindow, b: TemporalWindow): TemporalWindow | null => {
  const start = a.start > b.start ? a.start : b.start;
  const end = a.end < b.end ? a.end : b.end;
  return start <= end ? { start, end } : null;
};

const overlapDays = (start: Date | null, end: Date | null, windows: TemporalWindow[]) => {
  if (!start) return 0;
  return windows.reduce((total, window) => {
    const clipped = overlapWindow({ start, end: end ?? window.end }, window);
    return total + (clipped ? daysInclusive(clipped.start, clipped.end) : 0);
  }, 0);
};

const absenceOverlapsYear = (record: NormalizedRecord, year: number, maxOpenYear: number) => {
  const yearStart = new Date(year, 0, 1, 0, 0, 0, 0);
  const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);
  const start = record.ausInicio ?? record.ausFin;
  const end = record.ausFin ?? endFromDays(start, record.diasAusHastaFinP);
  if (start) return start <= yearEnd && (!end ? year <= maxOpenYear : end >= yearStart);
  return recordFallbackYear(record) === year;
};

const includesActiveYear = (selected: string[], record: NormalizedRecord, maxOpenYear: number) => {
  if (!selected.length) return true;
  return selected.some((value) => {
    const year = Number(value);
    return Number.isFinite(year) ? absenceOverlapsYear(record, year, maxOpenYear) : includes([value], record.anio);
  });
};

const includesActiveMonth = (selected: string[], record: NormalizedRecord) => {
  if (!selected.length) return true;
  const windows = selected
    .map((value) => {
      const start = monthStart(value);
      const end = monthEnd(value);
      return start && end ? { start, end } : null;
    })
    .filter((window): window is TemporalWindow => Boolean(window));
  if (!windows.length) return true;
  const start = record.ausInicio ?? record.ausFin;
  const end = record.ausFin ?? endFromDays(start, record.diasAusHastaFinP);
  return windows.some((window) => start && overlapWindow({ start, end: end ?? window.end }, window));
};

const parseNumberBound = (value: string) => {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseDateBound = (value: string, endOfDay = false) => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
};

const temporalWindows = (filters: FilterState) => {
  const from = parseDateBound(filters.fechaInicioDesde);
  const to = parseDateBound(filters.fechaInicioHasta, true);
  const range = from || to ? { start: from ?? new Date(1900, 0, 1), end: to ?? new Date(9999, 11, 31, 23, 59, 59, 999) } : null;
  const yearWindows = filters.anio
    .map(Number)
    .filter(Number.isFinite)
    .map((year) => ({ start: new Date(year, 0, 1, 0, 0, 0, 0), end: new Date(year, 11, 31, 23, 59, 59, 999) }));
  const monthWindows = filters.mesAusencia
    .map((value) => {
      const start = monthStart(value);
      const end = monthEnd(value);
      return start && end ? { start, end } : null;
    })
    .filter((window): window is TemporalWindow => Boolean(window));
  const base = monthWindows.length && yearWindows.length
    ? monthWindows.flatMap((month) => yearWindows.map((year) => overlapWindow(month, year)).filter((window): window is TemporalWindow => Boolean(window)))
    : monthWindows.length ? monthWindows : yearWindows.length ? yearWindows : range ? [range] : [];
  const windows = range && (monthWindows.length || yearWindows.length)
    ? base.map((window) => overlapWindow(window, range)).filter((window): window is TemporalWindow => Boolean(window))
    : base;
  return windows.length ? windows : null;
};

const adjustRecordToTemporalWindow = (record: NormalizedRecord, windows: TemporalWindow[]) => {
  const fallbackYear = recordFallbackYear(record);
  const fallbackStart = fallbackYear ? new Date(fallbackYear, 0, 1, 0, 0, 0, 0) : null;
  const start = record.ausInicio ?? record.ausFin ?? fallbackStart;
  const effectiveAbsenceEnd = record.ausFin ?? endFromDays(start, record.diasAusHastaFinP);
  const absenceDays = overlapDays(start, effectiveAbsenceEnd, windows);
  const suplenciaStart = record.inicioSuplencia ?? (record.hasSuplente ? start : null);
  const suplenciaEnd = record.finSuplencia ?? endFromDays(suplenciaStart, record.diasSustituidosHastaFinP) ?? effectiveAbsenceEnd;
  const substitutedFromDates = overlapDays(suplenciaStart, suplenciaEnd, windows);
  const substitutedFallback = record.hasSuplente && !record.inicioSuplencia && !record.finSuplencia
    ? Math.min(absenceDays, record.diasSustituidosHastaFinP)
    : substitutedFromDates;
  const substitutedDays = Math.max(0, Math.min(absenceDays, substitutedFallback));
  const originalSubstituted = Math.max(record.diasSustituidosHastaFinP, record.diasSustituidos);
  const costRatio = originalSubstituted > 0 ? Math.max(0, Math.min(1, substitutedDays / originalSubstituted)) : 0;
  return {
    ...record,
    diasAus: absenceDays,
    diasAusHastaFinP: absenceDays,
    diasSustituidos: substitutedDays,
    diasSustituidosHastaFinP: substitutedDays,
    diasNoSustituidos: Math.max(0, absenceDays - substitutedDays),
    brutoNomina: record.brutoNomina * costRatio,
    cuotaPatronal: record.cuotaPatronal * costRatio,
    totalNomina: record.totalNomina * costRatio
  };
};

export const applyFilters = (records: NormalizedRecord[], filters: FilterState) => {
  const maxOpenYear = datasetOpenEndYear(records);
  const windows = temporalWindows(filters);
  const minDias = parseNumberBound(filters.diasAusMin);
  const maxDias = parseNumberBound(filters.diasAusMax);
  const minCoste = parseNumberBound(filters.costeMin);
  const maxCoste = parseNumberBound(filters.costeMax);
  return records.filter((record) => {
    return (
      includesActiveYear(filters.anio, record, maxOpenYear) &&
      includesActiveMonth(filters.mesAusencia, record) &&
      includes(filters.ambito, record.ambito) &&
      includes(filters.gerencia, record.gerencia) &&
      includes(filters.categoriaCentralizada, record.categoriaCentralizada) &&
      includes(filters.categoriaNombramiento, record.categoriaNombramiento) &&
      includes(filters.tipoPersonal, record.tipoPersonal) &&
      includes(filters.relJuridica, record.relJuridica) &&
      includes(filters.fsn, record.fsn) &&
      includes(filters.tipoAusencia, record.tipoAusencia) &&
      includes(filters.grupoVpl, record.grupoVpl) &&
      includes(filters.mesPagoSuplente, record.mesPagoSuplente) &&
      includes(filters.provisionSubtipo, record.provisionSubtipo) &&
      (filters.suplente === "all" || (filters.suplente === "yes" ? record.hasSuplente : !record.hasSuplente)) &&
      (filters.ausenciaAbierta === "all" || (filters.ausenciaAbierta === "yes" ? record.ausenciaAbierta : !record.ausenciaAbierta))
    );
  }).map((record) => (windows ? adjustRecordToTemporalWindow(record, windows) : record))
    .filter((record) =>
      (!windows || record.diasAusHastaFinP > 0) &&
      (minDias === null || record.diasAusHastaFinP >= minDias) &&
      (maxDias === null || record.diasAusHastaFinP <= maxDias) &&
      (minCoste === null || record.totalNomina >= minCoste) &&
      (maxCoste === null || record.totalNomina <= maxCoste)
    );
};

export const getOptions = (records: NormalizedRecord[], field: keyof NormalizedRecord) =>
  Array.from(new Set(records.map((record) => String(record[field] ?? "Sin datos")).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "es")
  );

export const getActiveYearOptions = (records: NormalizedRecord[]) => {
  const maxOpenYear = datasetOpenEndYear(records);
  const years = new Set<string>();
  records.forEach((record) => {
    const startYear = recordFallbackYear(record);
    const start = record.ausInicio ?? record.ausFin ?? (startYear ? new Date(startYear, 0, 1) : null);
    const endYear = yearFromDate(record.ausFin ?? endFromDays(start, record.diasAusHastaFinP)) ?? maxOpenYear;
    if (!startYear) return;
    for (let year = startYear; year <= endYear; year += 1) years.add(String(year));
  });
  return Array.from(years).sort((a, b) => Number(a) - Number(b));
};

export const getActiveMonthOptions = (records: NormalizedRecord[]) => {
  const maxOpenYear = datasetOpenEndYear(records);
  const months = new Set<string>();
  records.forEach((record) => {
    const startYear = recordFallbackYear(record);
    const start = record.ausInicio ?? (startYear ? new Date(startYear, 0, 1) : null);
    const end = record.ausFin ?? endFromDays(start, record.diasAusHastaFinP) ?? new Date(maxOpenYear, 11, 31);
    if (!start) return;
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const endCursor = new Date(end.getFullYear(), end.getMonth(), 1);
    while (cursor <= endCursor) {
      months.add(monthKey(cursor));
      cursor.setMonth(cursor.getMonth() + 1);
    }
  });
  return Array.from(months).sort((a, b) => a.localeCompare(b));
};

export const aggregateBy = (
  records: NormalizedRecord[],
  getKey: (record: NormalizedRecord) => string,
  totals = calculateMetrics(records)
): AggregateRow[] => {
  const groups = new Map<string, NormalizedRecord[]>();
  records.forEach((record) => {
    const key = getKey(record) || "Sin datos";
    const group = groups.get(key);
    if (group) {
      group.push(record);
    } else {
      groups.set(key, [record]);
    }
  });
  const rows = Array.from(groups.entries()).map(([key, group]) => {
    const metrics = calculateMetrics(group);
    return {
      key,
      label: key,
      registros: group.length,
      ausenciasUnicas: absenceUniqueCount(group),
      personasAusentes: new Set(group.map(absentPersonKey).filter(Boolean)).size,
      diasAusencia: metrics.diasAusenciaHastaFinP,
      diasSustituidos: metrics.diasSustituidosHastaFinP,
      diasNoSustituidos: metrics.diasNoSustituidos,
      porcentajeSustitucion: metrics.porcentajeSustitucionDias,
      brutoNomina: metrics.brutoNomina,
      cuotaPatronal: metrics.cuotaPatronal,
      totalNomina: metrics.totalNomina,
      costeDiaSustituido: metrics.costeMedioDiaSustituido,
      costeDiaAusencia: metrics.costeMedioDiaAusencia,
      porcentajeTotalDias: totals.diasAusenciaHastaFinP ? metrics.diasAusenciaHastaFinP / totals.diasAusenciaHastaFinP : 0,
      porcentajeTotalCoste: totals.totalNomina ? metrics.totalNomina / totals.totalNomina : 0,
      impactoGestor: 0,
      ambito: group[0]?.ambito,
      tipoPersonal: group[0]?.tipoPersonal
    } satisfies AggregateRow;
  });
  const maxDias = Math.max(1, ...rows.map((row) => row.diasAusencia));
  const maxNoCubiertos = Math.max(1, ...rows.map((row) => row.diasNoSustituidos));
  const maxCoste = Math.max(1, ...rows.map((row) => row.totalNomina));
  return rows
    .map((row) => ({
      ...row,
      impactoGestor:
        (row.diasAusencia / maxDias) * 35 +
        (row.diasNoSustituidos / maxNoCubiertos) * 35 +
        (row.totalNomina / maxCoste) * 20 +
        (1 - row.porcentajeSustitucion) * 10
    }))
    .sort((a, b) => b.impactoGestor - a.impactoGestor);
};

export const topN = <T,>(rows: T[], pick: (row: T) => number, n = 10) =>
  [...rows].sort((a, b) => pick(b) - pick(a)).slice(0, n);

export const durationBuckets = (records: NormalizedRecord[]) => {
  const buckets = [
    { label: "1-3 días", min: 1, max: 3, value: 0 },
    { label: "4-7 días", min: 4, max: 7, value: 0 },
    { label: "8-15 días", min: 8, max: 15, value: 0 },
    { label: "16-30 días", min: 16, max: 30, value: 0 },
    { label: "31-60 días", min: 31, max: 60, value: 0 },
    { label: ">60 días", min: 61, max: Infinity, value: 0 }
  ];
  records.forEach((record) => {
    const bucket = buckets.find((item) => record.diasAus >= item.min && record.diasAus <= item.max);
    if (bucket) bucket.value += 1;
  });
  return buckets;
};
