import type { NormalizedRecord } from "../types/data";
import type { IntelligenceResult } from "../types/intelligence";
import { AlertPanel } from "./AlertPanel";
import { ExecutiveNarrativeBox } from "./ExecutiveNarrativeBox";
import { ForecastPanel } from "./ForecastPanel";
import { ImpactRanking } from "./ImpactRanking";
import { MethodologyNote } from "./MethodologyNote";
import { RecommendationPanel } from "./RecommendationPanel";
import { ScenarioSimulator } from "./ScenarioSimulator";
import { TrendSection } from "./TrendSection";
import { UncoveredAbsencePanel } from "./UncoveredAbsencePanel";

type IntelligencePageProps = {
  records: NormalizedRecord[];
  intelligence: IntelligenceResult;
};

export function IntelligencePage({ records, intelligence }: IntelligencePageProps) {
  return (
    <main className="content-stack intelligence-page">
      <ExecutiveNarrativeBox narrative={intelligence.narrative} />
      <TrendSection title="Tendencia mensual del absentismo" trend={intelligence.absenceTrend} mode="absence" />
      <TrendSection title="Tendencia mensual del coste" trend={intelligence.costTrend} mode="cost" />
      <TrendSection title="Tendencia mensual de la cobertura" trend={intelligence.coverageTrend} mode="coverage" />
      <ForecastPanel forecast={intelligence.forecast} />
      <AlertPanel alerts={intelligence.alerts} />
      <ImpactRanking records={records} />
      <UncoveredAbsencePanel uncovered={intelligence.uncovered} />
      <ScenarioSimulator metrics={intelligence.uncovered.metrics} forecast={intelligence.forecast.central} defaults={intelligence.scenarioDefaults} />
      <RecommendationPanel recommendations={intelligence.recommendations} />
      <MethodologyNote notes={intelligence.methodologyNotes} />
    </main>
  );
}
