import type { FamilyWithEligibility } from "@/types/family";

export interface ModeImpact {
  /** Promedio de |cuota_familia - cuota_persona| / gasto_total, por cada familia elegible. */
  avgDiffRatio: number;
  /** Máximo de |cuota_familia - cuota_persona| / gasto_total entre las familias elegibles. */
  maxDiffRatio: number;
  /**
   * Coeficiente de variación de los tamaños (eligiblePersons) de familias elegibles.
   * CV = desvío_estándar / media. 0 = todas del mismo tamaño. > 0.5 = muy heterogéneo.
   */
  sizeCoeffVar: number;
  /** Cuota por-familia por id. */
  byFamilyShares: Record<string, number>;
  /** Cuota por-persona (proporcional) por id. */
  byPersonShares: Record<string, number>;
}

export function calculateModeImpact(
  families: FamilyWithEligibility[]
): ModeImpact {
  const totalPaid = families.reduce((sum, f) => sum + f.paidAmount, 0);
  const eligible = families.filter((f) => f.isEligibleToPay);

  if (eligible.length === 0) {
    return {
      avgDiffRatio: 0,
      maxDiffRatio: 0,
      sizeCoeffVar: 0,
      byFamilyShares: {},
      byPersonShares: {},
    };
  }

  // ── Coeficiente de variación de tamaños ───────────────────────────────────
  const sizes = eligible.map((f) => f.eligiblePersons);
  const sizeMean = sizes.reduce((sum, s) => sum + s, 0) / sizes.length;
  const sizeVariance =
    sizes.reduce((sum, s) => sum + (s - sizeMean) ** 2, 0) / sizes.length;
  const sizeCoeffVar = sizeMean > 0 ? Math.sqrt(sizeVariance) / sizeMean : 0;

  // ── Impacto económico entre modos ─────────────────────────────────────────
  const byFamilyShare = totalPaid / eligible.length;
  const totalPersons = eligible.reduce((sum, f) => sum + f.eligiblePersons, 0);
  const perPersonShare = totalPersons > 0 ? totalPaid / totalPersons : 0;

  const byFamilyShares: Record<string, number> = {};
  const byPersonShares: Record<string, number> = {};
  const diffs: number[] = [];

  for (const f of eligible) {
    const personShare = perPersonShare * f.eligiblePersons;
    byFamilyShares[f.id] = byFamilyShare;
    byPersonShares[f.id] = personShare;

    if (totalPaid > 0) {
      diffs.push(Math.abs(byFamilyShare - personShare) / totalPaid);
    }
  }

  const avgDiffRatio =
    diffs.length > 0
      ? diffs.reduce((s, d) => s + d, 0) / diffs.length
      : 0;

  const maxDiffRatio = diffs.length > 0 ? Math.max(...diffs) : 0;

  return {
    avgDiffRatio,
    maxDiffRatio,
    sizeCoeffVar,
    byFamilyShares,
    byPersonShares,
  };
}
