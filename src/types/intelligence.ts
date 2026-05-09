import type { AggregateRow, Metrics } from "./data";

export type TrendDirection = "Ascendente" | "Descendente" | "Estable" | "No calculable";
export type ForecastMethod = "Proyeccion lineal simple" | "Tendencia reciente" | "Estacionalidad historica";
export type ForecastQuality = "Alta" | "Media" | "Baja";
export type AlertPriority = "Alta prioridad" | "Prioridad media" | "Informativa";
export type ImpactDimension =
  | "categoriaCentralizada"
  | "categoriaNombramiento"
  | "tipoPersonal"
  | "ambito"
  | "tipoAusencia"
  | "relJuridica";

export type MonthlyMetric = Metrics & {
  key: string;
  label: string;
  year: number;
  month: number;
  movingAverageDias?: number;
  porcentajeCosteAcumulado: number;
};

export type TrendAnalysis = {
  monthly: MonthlyMetric[];
  direction: TrendDirection;
  variation: number;
  hasMovingAverage: boolean;
  warnings: string[];
};

export type ForecastScenario = {
  label: "Bajo" | "Central" | "Alto";
  factor: number;
  metrics: Metrics;
};

export type ForecastPoint = {
  key: string;
  label: string;
  diasAusencia: number;
  totalNomina: number;
  real: boolean;
};

export type ForecastResult = {
  method: ForecastMethod;
  quality: ForecastQuality;
  targetYear: number | null;
  monthsWithData: number;
  lastMonthLabel: string;
  accumulated: Metrics;
  central: Metrics;
  low: Metrics;
  high: Metrics;
  scenarios: ForecastScenario[];
  projectedSeries: ForecastPoint[];
  warnings: string[];
};

export type ManagerAlert = {
  id: string;
  title: string;
  priority: AlertPriority;
  area: string;
  explanation: string;
  evidence: string;
  suggestedAction: string;
  type: string;
};

export type ImpactRow = AggregateRow & {
  index: number;
  components: {
    diasAusencia: number;
    diasNoSustituidos: number;
    costeTotal: number;
    bajaCobertura: number;
  };
  explanation: string;
};

export type UncoveredSummary = {
  metrics: Metrics;
  porcentajeNoCubierto: number;
  costeTeoricoCobertura: number;
  rankings: Record<string, AggregateRow[]>;
  warnings: string[];
};

export type ScenarioInput = {
  coverageIncrease: number;
  absenceReduction: number;
  costVariation: number;
};

export type ScenarioOutput = {
  input: ScenarioInput;
  diasAusencia: number;
  diasSustituidos: number;
  diasNoSustituidos: number;
  nuevaCobertura: number;
  costeTotalEstimado: number;
  costeTeoricoAdicional: number;
  reduccionDiasAusencia: number;
  diferenciaFrenteForecast: number;
};

export type Recommendation = {
  id: string;
  title: string;
  explanation: string;
  evidence: string;
  area: string;
  priority: AlertPriority;
  suggestedAction: string;
};

export type IntelligenceResult = {
  absenceTrend: TrendAnalysis;
  costTrend: TrendAnalysis;
  coverageTrend: TrendAnalysis;
  forecast: ForecastResult;
  alerts: ManagerAlert[];
  impactRows: ImpactRow[];
  uncovered: UncoveredSummary;
  scenarioDefaults: ScenarioInput;
  scenario: ScenarioOutput;
  recommendations: Recommendation[];
  narrative: string;
  methodologyNotes: string[];
};
