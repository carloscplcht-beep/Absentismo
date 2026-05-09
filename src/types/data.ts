export type ColumnKey =
  | "periodo"
  | "gerencia"
  | "ambito"
  | "titular"
  | "dni"
  | "dniUnico"
  | "dniDiferenteTipoPersonal"
  | "relJuridica"
  | "fsn"
  | "categoriaCentralizada"
  | "tipoPersonal"
  | "categoriaNombramiento"
  | "ausInicio"
  | "ausFin"
  | "diasAus"
  | "ausenciasUnicas"
  | "diasCadaAusenciaUnica"
  | "diasAusHastaFinP"
  | "tipoAusencia"
  | "grupoVpl"
  | "anio"
  | "suplente"
  | "dniSuplente"
  | "dniSuplenteUnico"
  | "inicioSuplencia"
  | "finSuplencia"
  | "diasSustituidos"
  | "diasSustituidosHastaFinP"
  | "provisionSubtipo"
  | "mesPagoSuplente"
  | "brutoNomina"
  | "cuotaPatronal"
  | "totalNomina";

export type RawRecord = Record<string, unknown>;

export type NormalizedRecord = {
  id: string;
  periodo: string;
  gerencia: string;
  ambito: string;
  titular: string;
  dni: string;
  dniUnico: string;
  dniDiferenteTipoPersonal: string;
  relJuridica: string;
  fsn: string;
  categoriaCentralizada: string;
  tipoPersonal: string;
  categoriaNombramiento: string;
  ausInicio: Date | null;
  ausFin: Date | null;
  diasAus: number;
  ausenciasUnicas: number;
  diasCadaAusenciaUnica: number;
  diasAusHastaFinP: number;
  tipoAusencia: string;
  grupoVpl: string;
  anio: string;
  suplente: string;
  dniSuplente: string;
  dniSuplenteUnico: string;
  inicioSuplencia: Date | null;
  finSuplencia: Date | null;
  diasSustituidos: number;
  diasSustituidosHastaFinP: number;
  provisionSubtipo: string;
  mesPagoSuplente: string;
  brutoNomina: number;
  cuotaPatronal: number;
  totalNomina: number;
  hasSuplente: boolean;
  ausenciaAbierta: boolean;
  diasNoSustituidos: number;
  raw: RawRecord;
};

export type WorkbookMetadata = {
  sheetName: string;
  fileName: string;
  loadedAt: string;
  headerRowIndex: number;
  detectedAt?: string;
  periodo?: string;
  gerencia?: string;
  ultimaNominaCerrada?: string;
};

export type ParsedWorkbook = {
  metadata: WorkbookMetadata;
  records: NormalizedRecord[];
  columns: string[];
  columnMap: Partial<Record<ColumnKey, string>>;
  warnings: string[];
  logs: string[];
  dynamicDimensions: string[];
};

export type FilterState = {
  anio: string[];
  mesAusencia: string[];
  ambito: string[];
  gerencia: string[];
  categoriaCentralizada: string[];
  categoriaNombramiento: string[];
  tipoPersonal: string[];
  relJuridica: string[];
  fsn: string[];
  tipoAusencia: string[];
  grupoVpl: string[];
  mesPagoSuplente: string[];
  provisionSubtipo: string[];
  suplente: "all" | "yes" | "no";
  ausenciaAbierta: "all" | "yes" | "no";
  fechaInicioDesde: string;
  fechaInicioHasta: string;
  diasAusMin: string;
  diasAusMax: string;
  costeMin: string;
  costeMax: string;
};

export type Metrics = {
  totalRegistros: number;
  ausenciasUnicas: number;
  personasAusentesUnicas: number;
  suplentesUnicos: number;
  diasAusencia: number;
  diasAusenciaHastaFinP: number;
  diasSustituidos: number;
  diasSustituidosHastaFinP: number;
  diasNoSustituidos: number;
  porcentajeSustitucionDias: number;
  ausenciasConSuplente: number;
  ausenciasSinSuplente: number;
  porcentajeAusenciasConSuplente: number;
  brutoNomina: number;
  cuotaPatronal: number;
  totalNomina: number;
  costeMedioDiaSustituido: number;
  costeMedioDiaAusencia: number;
  costeMedioAusencia: number;
  costeMedioAusenciaCubierta: number;
  ausenciasAbiertas: number;
  porcentajeAusenciasAbiertas: number;
};

export type AggregateRow = {
  key: string;
  label: string;
  registros: number;
  ausenciasUnicas: number;
  personasAusentes: number;
  diasAusencia: number;
  diasSustituidos: number;
  diasNoSustituidos: number;
  porcentajeSustitucion: number;
  brutoNomina: number;
  cuotaPatronal: number;
  totalNomina: number;
  costeDiaSustituido: number;
  costeDiaAusencia: number;
  porcentajeTotalDias: number;
  porcentajeTotalCoste: number;
  impactoGestor: number;
  ambito?: string;
  tipoPersonal?: string;
};
