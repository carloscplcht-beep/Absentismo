import type { NormalizedRecord } from "../types/data";
import type { ImpactDimension, ImpactRow } from "../types/intelligence";
import { aggregateBy } from "./aggregations";
import { clamp, safeDivide } from "./methodologyUtils";

export const dimensionLabels: Record<ImpactDimension, string> = {
  categoriaCentralizada: "Categoria centralizada",
  categoriaNombramiento: "Categoria nombramiento",
  tipoPersonal: "Tipo de personal",
  ambito: "Ambito",
  tipoAusencia: "Tipo de ausencia",
  relJuridica: "Relacion juridica"
};

export const dimensionGetter = (dimension: ImpactDimension) => (record: NormalizedRecord) => String(record[dimension] || "Sin datos");

export const calculateImpactIndex = (records: NormalizedRecord[], dimension: ImpactDimension = "categoriaCentralizada"): ImpactRow[] => {
  const rows = aggregateBy(records, dimensionGetter(dimension));
  const maxDias = Math.max(1, ...rows.map((row) => row.diasAusencia));
  const maxNoCubiertos = Math.max(1, ...rows.map((row) => row.diasNoSustituidos));
  const maxCoste = Math.max(1, ...rows.map((row) => row.totalNomina));

  return rows
    .map((row) => {
      const diasAusencia = safeDivide(row.diasAusencia, maxDias) * 100;
      const diasNoSustituidos = safeDivide(row.diasNoSustituidos, maxNoCubiertos) * 100;
      const costeTotal = safeDivide(row.totalNomina, maxCoste) * 100;
      const bajaCobertura = clamp((1 - row.porcentajeSustitucion) * 100, 0, 100);
      const index = diasAusencia * 0.35 + diasNoSustituidos * 0.25 + costeTotal * 0.25 + bajaCobertura * 0.15;
      return {
        ...row,
        index,
        impactoGestor: index,
        components: { diasAusencia, diasNoSustituidos, costeTotal, bajaCobertura },
        explanation: `${row.label} aparece en el ranking por combinar ${row.diasAusencia.toFixed(0)} dias de ausencia, ${row.diasNoSustituidos.toFixed(0)} dias no sustituidos, coste y cobertura.`
      } satisfies ImpactRow;
    })
    .sort((a, b) => b.index - a.index);
};
