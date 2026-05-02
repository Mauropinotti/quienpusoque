import type { FamilyWithEligibility } from "@/types/family";
import type {
  RecommendationConfidence,
  RecommendationMetrics,
  SplitRecommendation,
} from "@/types/recommendation";
import { calculateModeImpact } from "./calculateModeImpact";

interface Signal {
  mode: "by-person" | "by-family";
  weight: 2 | 3;
  reason: string;
}

function pct(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

const EMPTY_METRICS: RecommendationMetrics = {
  eligibleFamilies: 0,
  eligiblePersons: 0,
  singleAdultFamilyRatio: 0,
  largeFamilyRatio: 0,
  averageFamilySize: 0,
  averageImpactBetweenModes: 0,
  maxImpactBetweenModes: 0,
};

const THRESHOLD = {
  SINGLE_ADULT_RATIO: 0.6,
  LARGE_FAMILY_RATIO: 0.6,
  MAX_IMPACT_HIGH: 0.35,
  AVG_IMPACT_HIGH: 0.2,
  AVG_IMPACT_LOW: 0.1,
  SIZE_COEFF_VAR_SIMILAR: 0.3,
  NET_FOR_HIGH: 3,
};

export function recommendSplitMode(
  families: FamilyWithEligibility[]
): SplitRecommendation {
  const eligible = families.filter((family) => family.isEligibleToPay);

  if (eligible.length === 0) {
    return {
      recommendedMode: "by-family",
      confidence: "low",
      reasons: ["No hay familias habilitadas para calcular."],
      metrics: EMPTY_METRICS,
    };
  }

  const totalPersons = eligible.reduce(
    (sum, family) => sum + family.eligiblePersons,
    0
  );
  const singleAdultCount = eligible.filter(
    (family) => family.members === 1
  ).length;
  const largeFamilyCount = eligible.filter(
    (family) => family.members >= 3
  ).length;

  const singleAdultFamilyRatio = singleAdultCount / eligible.length;
  const largeFamilyRatio = largeFamilyCount / eligible.length;
  const averageFamilySize = totalPersons / eligible.length;

  const { avgDiffRatio, maxDiffRatio, sizeCoeffVar } =
    calculateModeImpact(families);

  const metrics: RecommendationMetrics = {
    eligibleFamilies: eligible.length,
    eligiblePersons: totalPersons,
    singleAdultFamilyRatio,
    largeFamilyRatio,
    averageFamilySize,
    averageImpactBetweenModes: avgDiffRatio,
    maxImpactBetweenModes: maxDiffRatio,
  };

  const signals: Signal[] = [];

  if (singleAdultFamilyRatio >= THRESHOLD.SINGLE_ADULT_RATIO) {
    const allSingleAndSameSize = !eligible.some(
      (family) => family.eligiblePersons >= 2
    );
    signals.push({
      mode: "by-person",
      weight: 2,
      reason: allSingleAndSameSize
        ? "Todas las familias habilitadas son de 1 adulto. Por familia y por persona dan casi lo mismo; por persona es más directo."
        : `Hay varias familias de 1 adulto (${pct(singleAdultFamilyRatio)}) y otras más grandes. Repartir por persona evita diferencias fuertes entre grupos.`,
    });
  }

  if (
    largeFamilyRatio >= THRESHOLD.LARGE_FAMILY_RATIO &&
    singleAdultFamilyRatio < THRESHOLD.SINGLE_ADULT_RATIO
  ) {
    signals.push({
      mode: "by-family",
      weight: 2,
      reason: `La mayoría de las familias tiene entre 3 y 5 integrantes (${pct(largeFamilyRatio)}). Repartir por familia mantiene el cálculo simple para este grupo.`,
    });
  }

  if (maxDiffRatio > THRESHOLD.MAX_IMPACT_HIGH) {
    signals.push({
      mode: "by-person",
      weight: 3,
      reason: `Una familia tendría una diferencia del ${pct(maxDiffRatio)} del gasto total entre criterios. Ese impacto es alto; por persona lo nivela mejor.`,
    });
  }

  if (avgDiffRatio > THRESHOLD.AVG_IMPACT_HIGH) {
    signals.push({
      mode: "by-person",
      weight: 2,
      reason: `La diferencia promedio entre criterios es del ${pct(avgDiffRatio)}. Conviene repartir por persona para distribuir mejor la carga.`,
    });
  }

  if (
    avgDiffRatio <= THRESHOLD.AVG_IMPACT_LOW &&
    sizeCoeffVar <= THRESHOLD.SIZE_COEFF_VAR_SIMILAR &&
    singleAdultFamilyRatio < 0.5
  ) {
    signals.push({
      mode: "by-family",
      weight: 2,
      reason: `Las familias tienen tamaños parecidos y la diferencia entre criterios es baja (${pct(avgDiffRatio)}). Por familia simplifica sin cambiar mucho el resultado.`,
    });
  }

  if (signals.length === 0) {
    return {
      recommendedMode: "by-family",
      confidence: "low",
      reasons: [
        `No aparecen diferencias importantes entre criterios para este grupo (impacto promedio: ${pct(avgDiffRatio)}). Sugerimos por familia por ser más simple.`,
      ],
      metrics,
    };
  }

  const personScore = signals
    .filter((signal) => signal.mode === "by-person")
    .reduce((sum, signal) => sum + signal.weight, 0);

  const familyScore = signals
    .filter((signal) => signal.mode === "by-family")
    .reduce((sum, signal) => sum + signal.weight, 0);

  const hasCriticalForPerson = signals.some(
    (signal) => signal.mode === "by-person" && signal.weight >= 3
  );

  let recommendedMode: "by-person" | "by-family";
  let confidence: RecommendationConfidence;

  if (hasCriticalForPerson) {
    recommendedMode = "by-person";
    confidence =
      personScore - familyScore >= THRESHOLD.NET_FOR_HIGH ? "high" : "medium";
  } else if (personScore > familyScore) {
    recommendedMode = "by-person";
    confidence =
      personScore - familyScore >= THRESHOLD.NET_FOR_HIGH ? "high" : "medium";
  } else if (familyScore > personScore) {
    recommendedMode = "by-family";
    confidence =
      familyScore - personScore >= THRESHOLD.NET_FOR_HIGH ? "high" : "medium";
  } else {
    recommendedMode = "by-family";
    confidence = "low";
  }

  const reasons = signals.map((signal) => signal.reason);
  const hasConflict = personScore > 0 && familyScore > 0;

  if (hasConflict && hasCriticalForPerson) {
    reasons.push(
      "Aunque la composición del grupo podría sugerir otra cosa, el impacto económico individual pesa más en esta recomendación."
    );
  } else if (hasConflict && confidence === "low") {
    reasons.push(
      "Hay señales mezcladas en la composición del grupo. Pueden elegir el criterio que les resulte más claro."
    );
  }

  return { recommendedMode, confidence, reasons, metrics };
}
