import type { FamilyWithEligibility } from "@/types/family";
import type { SplitRecommendation } from "@/types/recommendation";
import { calculateModeImpact } from "./calculateModeImpact";

export function recommendSplitMode(
  families: FamilyWithEligibility[]
): SplitRecommendation {
  const eligible = families.filter((f) => f.isEligibleToPay);
  const total = eligible.length;

  if (total === 0) {
    return {
      recommendedMode: "by-family",
      confidence: "low",
      reasons: ["No hay familias habilitadas para calcular."],
      metrics: {
        totalFamilies: families.length,
        eligibleFamilies: 0,
        totalEligiblePersons: 0,
        singleAdultFamiliesRatio: 0,
        largeFamiliesRatio: 0,
        avgMembersPerEligibleFamily: 0,
        avgImpactDiff: 0,
        maxImpactDiff: 0,
      },
    };
  }

  const singleAdults = eligible.filter((f) => f.members === 1).length;
  const largeFamilies = eligible.filter((f) => f.members >= 3).length;
  const totalPersons = eligible.reduce((s, f) => s + f.eligiblePersons, 0);

  const singleAdultRatio = singleAdults / total;
  const largeFamilyRatio = largeFamilies / total;
  const avgMembers = totalPersons / total;

  const { avgDiffRatio, maxDiffRatio } = calculateModeImpact(families);

  const metrics = {
    totalFamilies: families.length,
    eligibleFamilies: total,
    totalEligiblePersons: totalPersons,
    singleAdultFamiliesRatio: singleAdultRatio,
    largeFamiliesRatio: largeFamilyRatio,
    avgMembersPerEligibleFamily: avgMembers,
    avgImpactDiff: avgDiffRatio,
    maxImpactDiff: maxDiffRatio,
  };

  const reasons: string[] = [];
  let recommendedMode: "by-family" | "by-person" = "by-family";
  let confidence: "low" | "medium" | "high" = "low";

  // Rule 1: majority single adults → by-person
  if (singleAdultRatio >= 0.6) {
    recommendedMode = "by-person";
    confidence = "high";
    reasons.push(
      `El ${Math.round(singleAdultRatio * 100)}% de las familias habilitadas son de 1 adulto. Repartir por persona es más justo.`
    );
  }

  // Rule 4: max impact too high → by-person
  if (maxDiffRatio > 0.35) {
    recommendedMode = "by-person";
    if (confidence !== "high") confidence = "high";
    reasons.push(
      `Una familia tendría un impacto del ${Math.round(maxDiffRatio * 100)}% según el modo de reparto. Por persona es más equitativo.`
    );
  }

  // Rule 3: avg impact too high → by-person
  if (avgDiffRatio > 0.2 && recommendedMode !== "by-person") {
    recommendedMode = "by-person";
    confidence = "medium";
    reasons.push(
      `La diferencia promedio entre modos es del ${Math.round(avgDiffRatio * 100)}%, superior al 20%. Por persona nivela mejor.`
    );
  }

  // Rule 2: majority large families + low impact → by-family
  if (
    largeFamilyRatio >= 0.6 &&
    avgDiffRatio <= 0.2 &&
    recommendedMode === "by-family"
  ) {
    confidence = "medium";
    reasons.push(
      `El ${Math.round(largeFamilyRatio * 100)}% de las familias son numerosas. El impacto entre modos es bajo, así que por familia es razonable.`
    );
  }

  // Rule 5: similar sizes + low impact → by-family
  if (reasons.length === 0 && avgDiffRatio <= 0.2) {
    confidence = "medium";
    reasons.push(
      `Las familias tienen tamaños similares y el impacto entre modos es del ${Math.round(avgDiffRatio * 100)}%. Repartir por familia es simple y justo.`
    );
  }

  // Rule 6: no clear winner
  if (reasons.length === 0) {
    confidence = "low";
    reasons.push(
      "No hay una diferencia clara entre los modos. Se sugiere por familia, pero podés elegir el que prefieran."
    );
  }

  return { recommendedMode, confidence, reasons, metrics };
}
