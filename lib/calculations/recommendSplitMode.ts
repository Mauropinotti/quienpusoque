import type { FamilyWithEligibility } from "@/types/family";
import type {
  RecommendationConfidence,
  RecommendationMetrics,
  SplitRecommendation,
} from "@/types/recommendation";
import { calculateModeImpact } from "./calculateModeImpact";

// ── Internal signal type ──────────────────────────────────────────────────────

/**
 * Una señal es evidencia a favor de un modo de reparto.
 * weight 2 = señal moderada (criterios de composición o impacto moderado)
 * weight 3 = señal crítica  (impacto económico extremo, override de composición)
 */
interface Signal {
  mode: "by-person" | "by-family";
  weight: 2 | 3;
  reason: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── Thresholds ────────────────────────────────────────────────────────────────

const THRESHOLD = {
  SINGLE_ADULT_RATIO: 0.6,   // ≥60% familias de 1 adulto → señal by-person
  LARGE_FAMILY_RATIO: 0.6,   // ≥60% familias de 3-5 → señal by-family
  MAX_IMPACT_HIGH: 0.35,     // impacto máximo > 35% → señal crítica by-person
  AVG_IMPACT_HIGH: 0.2,      // impacto promedio > 20% → señal moderada by-person
  AVG_IMPACT_LOW: 0.1,       // impacto promedio ≤ 10% → candidato by-family
  SIZE_COEFF_VAR_SIMILAR: 0.3, // CV ≤ 0.30 → tamaños similares
  NET_FOR_HIGH: 3,           // ventaja neta ≥ 3 puntos → confianza alta
};

// ── Main function ─────────────────────────────────────────────────────────────

/**
 * Analiza la composición del evento y recomienda el modo de reparto.
 *
 * Algoritmo:
 * 1. Calcula métricas de composición e impacto económico.
 * 2. Evalúa 5 criterios en forma de señales con peso (2 = moderado, 3 = crítico).
 * 3. Suma pesos por modo. El modo ganador se determina por score total.
 *    Señales críticas (weight 3) siempre recomiendan by-person.
 * 4. La confianza depende de la ventaja neta entre modos.
 *
 * Señales posibles:
 * [1] ≥60% familias de 1 adulto            → by-person (weight 2)
 * [2] ≥60% familias numerosas (3-5)        → by-family (weight 2)
 * [3] Impacto promedio > 20%               → by-person (weight 2)
 * [4] Impacto máximo > 35%                 → by-person (weight 3, crítica)
 * [5] Impacto ≤ 10% + tamaños similares    → by-family (weight 2)
 *
 * Criterio de desempate: by-family (más simple); si hay señal crítica, by-person.
 */
export function recommendSplitMode(
  families: FamilyWithEligibility[]
): SplitRecommendation {
  const eligible = families.filter((f) => f.isEligibleToPay);

  if (eligible.length === 0) {
    return {
      recommendedMode: "by-family",
      confidence: "low",
      reasons: ["No hay familias habilitadas para calcular."],
      metrics: EMPTY_METRICS,
    };
  }

  // ── 1. Métricas ─────────────────────────────────────────────────────────────
  const totalPersons = eligible.reduce((s, f) => s + f.eligiblePersons, 0);
  const singleAdultCount = eligible.filter((f) => f.members === 1).length;
  const largeFamilyCount = eligible.filter((f) => f.members >= 3).length;

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

  // ── 2. Señales ──────────────────────────────────────────────────────────────
  const signals: Signal[] = [];

  // [1] Dominancia de familias de 1 adulto → by-person
  if (singleAdultFamilyRatio >= THRESHOLD.SINGLE_ADULT_RATIO) {
    const allSingleNSameSize = !eligible.some((f) => f.eligiblePersons >= 2);
    signals.push({
      mode: "by-person",
      weight: 2,
      reason: allSingleNSameSize
        ? "Todas las familias habilitadas son de 1 solo adulto. Por familia y por persona tienen el mismo efecto; por persona es el criterio más directo."
        : `Hay varias familias de 1 adulto (${pct(singleAdultFamilyRatio)}) y otras de mayor tamaño. Repartir por persona evita diferencias fuertes entre grupos.`,
    });
  }

  // [2] Dominancia de familias numerosas → by-family
  // Guarda: no aplica si predominan las familias de 1 adulto (no pueden coexistir al ≥60%)
  if (
    largeFamilyRatio >= THRESHOLD.LARGE_FAMILY_RATIO &&
    singleAdultFamilyRatio < THRESHOLD.SINGLE_ADULT_RATIO
  ) {
    signals.push({
      mode: "by-family",
      weight: 2,
      reason: `La mayoría de las familias tiene entre 3 y 5 integrantes (${pct(largeFamilyRatio)}). Repartir por familia es simple y equitativo para este grupo.`,
    });
  }

  // [4] Impacto máximo alto → by-person (señal crítica)
  if (maxDiffRatio > THRESHOLD.MAX_IMPACT_HIGH) {
    signals.push({
      mode: "by-person",
      weight: 3,
      reason: `Una familia tendría una diferencia del ${pct(maxDiffRatio)} del gasto total entre ambos criterios. Ese nivel de impacto individual es muy alto; repartir por persona lo nivela.`,
    });
  }

  // [3] Impacto promedio alto → by-person
  if (avgDiffRatio > THRESHOLD.AVG_IMPACT_HIGH) {
    signals.push({
      mode: "by-person",
      weight: 2,
      reason: `La diferencia económica promedio entre los dos criterios es del ${pct(avgDiffRatio)}, superando el 20%. Conviene repartir por persona para distribuir mejor la carga.`,
    });
  }

  // [5] Impacto bajo + tamaños similares → by-family
  // Guarda: no aplica si predominan las familias de 1 adulto (podría generar conflicto)
  if (
    avgDiffRatio <= THRESHOLD.AVG_IMPACT_LOW &&
    sizeCoeffVar <= THRESHOLD.SIZE_COEFF_VAR_SIMILAR &&
    singleAdultFamilyRatio < 0.5
  ) {
    signals.push({
      mode: "by-family",
      weight: 2,
      reason: `La mayoría de las familias tiene tamaños similares y la diferencia entre criterios es mínima (${pct(avgDiffRatio)}). Repartir por familia simplifica el cálculo sin afectar la equidad.`,
    });
  }

  // ── 3. Resolución ───────────────────────────────────────────────────────────
  if (signals.length === 0) {
    return {
      recommendedMode: "by-family",
      confidence: "low",
      reasons: [
        `No encontramos diferencias significativas entre los dos criterios para este grupo (impacto promedio: ${pct(avgDiffRatio)}). Sugerimos por familia por ser más simple, pero podés elegir el que prefieran.`,
      ],
      metrics,
    };
  }

  const personScore = signals
    .filter((s) => s.mode === "by-person")
    .reduce((sum, s) => sum + s.weight, 0);

  const familyScore = signals
    .filter((s) => s.mode === "by-family")
    .reduce((sum, s) => sum + s.weight, 0);

  const hasCriticalForPerson = signals.some(
    (s) => s.mode === "by-person" && s.weight >= 3
  );

  let recommendedMode: "by-person" | "by-family";
  let confidence: RecommendationConfidence;

  if (hasCriticalForPerson) {
    // Una señal de impacto extremo siempre recomienda by-person.
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
    // Empate: by-family como opción más simple.
    recommendedMode = "by-family";
    confidence = "low";
  }

  // Todas las señales contribuyen razones (transparencia total).
  const reasons = signals.map((s) => s.reason);

  // Nota adicional cuando hay señales en conflicto.
  const hasConflict =
    personScore > 0 && familyScore > 0;

  if (hasConflict && hasCriticalForPerson) {
    reasons.push(
      "Aunque la composición del grupo podría sugerir otra cosa, el alto impacto económico individual es el factor determinante."
    );
  } else if (hasConflict && confidence === "low") {
    reasons.push(
      "Hay señales contradictorias en la composición del grupo. Podés elegir el criterio que prefieran."
    );
  }

  return { recommendedMode, confidence, reasons, metrics };
}
