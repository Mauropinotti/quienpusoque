import type { FamilyWithEligibility } from "@/types/family";

export interface ModeImpact {
  avgDiffRatio: number;
  maxDiffRatio: number;
  byFamilyShares: Record<string, number>;
  byPersonShares: Record<string, number>;
}

export function calculateModeImpact(
  families: FamilyWithEligibility[]
): ModeImpact {
  const totalPaid = families.reduce((sum, f) => sum + f.paidAmount, 0);
  const eligible = families.filter((f) => f.isEligibleToPay);

  const byFamilyShare = totalPaid / (eligible.length || 1);
  const totalPersons = eligible.reduce((sum, f) => sum + f.eligiblePersons, 0);
  const perPersonShare = totalPersons > 0 ? totalPaid / totalPersons : 0;

  const byFamilyShares: Record<string, number> = {};
  const byPersonShares: Record<string, number> = {};
  const diffs: number[] = [];

  for (const f of eligible) {
    const familyShare = byFamilyShare;
    const personShare = perPersonShare * f.eligiblePersons;
    byFamilyShares[f.id] = familyShare;
    byPersonShares[f.id] = personShare;

    if (totalPaid > 0) {
      diffs.push(Math.abs(familyShare - personShare) / totalPaid);
    }
  }

  const avgDiffRatio = diffs.length > 0
    ? diffs.reduce((s, d) => s + d, 0) / diffs.length
    : 0;

  const maxDiffRatio = diffs.length > 0 ? Math.max(...diffs) : 0;

  return { avgDiffRatio, maxDiffRatio, byFamilyShares, byPersonShares };
}
