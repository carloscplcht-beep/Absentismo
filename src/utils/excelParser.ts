import * as XLSX from "xlsx";
import type { ParsedWorkbook, RawRecord, WorkbookMetadata } from "../types/data";
import {
  buildColumnMap,
  detectHeaderRow,
  dynamicDimensionColumns,
  missingCriticalColumns,
  normalizeHeader,
  normalizeRecords
} from "./dataNormalizer";

const preferredSheet = "RH_Cobertura_Ausencias";

const rowToText = (row: unknown[]) => row.map((cell) => String(cell ?? "").trim()).filter(Boolean).join(" | ");

const detectMetadata = (preHeaderRows: unknown[][], records: ReturnType<typeof normalizeRecords>, sheetName: string, fileName: string, headerRowIndex: number): WorkbookMetadata => {
  const text = preHeaderRows.map(rowToText).join(" | ");
  const pick = (labels: string[]) => {
    for (const label of labels) {
      const re = new RegExp(`${label}\\s*[:=-]?\\s*([^|]+)`, "i");
      const match = text.match(re);
      if (match?.[1]) return match[1].trim();
    }
    return undefined;
  };
  const mostCommon = (values: string[]) => {
    const counts = new Map<string, number>();
    values.filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
  };
  return {
    sheetName,
    fileName,
    loadedAt: new Date().toISOString(),
    headerRowIndex,
    detectedAt: pick(["fecha/hora de datos", "fecha datos", "fecha de datos", "generado"]),
    periodo: pick(["periodo contemplado", "periodo"]) || mostCommon(records.map((record) => record.periodo)),
    gerencia: pick(["gerencia"]) || mostCommon(records.map((record) => record.gerencia)),
    ultimaNominaCerrada: pick(["ultima nomina cerrada", "última nómina cerrada", "nomina cerrada", "nómina cerrada"])
  };
};

export const parseExcelFile = async (file: File): Promise<ParsedWorkbook> => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true, raw: false });
  const sheetName = workbook.SheetNames.find((name) => normalizeHeader(name) === normalizeHeader(preferredSheet)) ?? workbook.SheetNames[0];
  if (!sheetName) throw new Error("El libro no contiene hojas legibles.");
  const sheet = workbook.Sheets[sheetName];
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", raw: false });
  const headerRowIndex = detectHeaderRow(aoa);
  const headers = (aoa[headerRowIndex] ?? []).map((header) => String(header ?? "").trim());
  const columnMap = buildColumnMap(headers);
  const rawRows = XLSX.utils.sheet_to_json<RawRecord>(sheet, {
    header: headers,
    range: headerRowIndex + 1,
    defval: "",
    raw: false
  });
  const records = normalizeRecords(rawRows, columnMap);
  const metadata = detectMetadata(aoa.slice(0, headerRowIndex), records, sheetName, file.name, headerRowIndex);
  const missing = missingCriticalColumns(columnMap);
  const warnings = [
    ...(!records.length ? ["No se han detectado registros analíticos después de la fila de encabezados."] : []),
    ...(missing.length ? [`Faltan columnas críticas: ${missing.join(", ")}.`] : [])
  ];
  return {
    metadata,
    records,
    columns: headers.filter(Boolean),
    columnMap,
    warnings,
    logs: [
      `Hoja leída: ${sheetName}`,
      `Fila de encabezados detectada: ${headerRowIndex + 1}`,
      `Columnas detectadas: ${headers.filter(Boolean).length}`,
      `Registros normalizados: ${records.length}`
    ],
    dynamicDimensions: dynamicDimensionColumns(headers)
  };
};
