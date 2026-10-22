import type { FamilyBalance, Transfer } from "@/types/calculation";
import type { Family, SplitMode } from "@/types/family";
import type { SplitRecommendation } from "@/types/recommendation";
import { computeAllEligibility } from "@/lib/calculations/eligibility";
import { calculateBalances } from "@/lib/calculations/calculateBalances";
import { calculateTransfers } from "@/lib/calculations/calculateTransfers";
import { recommendSplitMode } from "@/lib/calculations/recommendSplitMode";
import { calculateModeImpact } from "@/lib/calculations/calculateModeImpact";

export interface EventInsights {
  familyCount: number;
  eligibleFamilyCount: number;
  totalPaid: number;
  /** Hace falta al menos 2 familias y 2 habilitadas para repartir. */
  canCalculate: boolean;
  recommendation: SplitRecommendation | null;
}

/**
 * Todo lo que la UI necesita saber de la lista de familias, en una pasada.
 * Antes la página calculaba la elegibilidad dos veces por render y los
 * componentes sumaban totales por su cuenta.
 */
export function deriveEventInsights(families: Family[]): EventInsights {
  const withEligibility = computeAllEligibility(families);
  let eligibleFamilyCount = 0;
  let totalPaid = 0;

  for (const family of withEligibility) {
    if (family.isEligibleToPay) eligibleFamilyCount += 1;
    totalPaid += family.paidAmount;
  }

  return {
    familyCount: families.length,
    eligibleFamilyCount,
    totalPaid,
    canCalculate: families.length >= 2 && eligibleFamilyCount >= 2,
    recommendation:
      families.length >= 2 ? recommendSplitMode(withEligibility) : null,
  };
}

export interface Settlement {
  splitMode: SplitMode;
  totalAmount: number;
  eligibleFamilyCount: number;
  eligiblePersonCount: number;
  balances: FamilyBalance[];
  transfers: Transfer[];
}

/** Balances + transferencias para un criterio, o null si no se puede calcular. */
export function deriveSettlement(
  families: Family[],
  currency: string,
  splitMode: SplitMode | null
): Settlement | null {
  if (!splitMode || families.length < 2) return null;

  const result = calculateBalances({
    eventName: "",
    currency,
    splitMode,
    families,
  });
  if (!result.ok) return null;

  const { transfers } = calculateTransfers(result.data.balances);

  return {
    splitMode,
    totalAmount: result.data.totalAmount,
    eligibleFamilyCount: result.data.eligibleFamilyCount,
    eligiblePersonCount: result.data.eligiblePersonCount,
    balances: result.data.balances,
    transfers,
  };
}

/**
 * Cuota de referencia para mostrar: cuánto pone cada familia (por familia) o
 * cada persona habilitada (por persona).
 */
export function getUnitShare(settlement: Settlement): number {
  const parts =
    settlement.splitMode === "by-family"
      ? settlement.eligibleFamilyCount
      : settlement.eligiblePersonCount;
  if (parts === 0) return 0;
  return Math.round((settlement.totalAmount / parts) * 100) / 100;
}

export interface ModeComparisonRow {
  familyId: string;
  name: string;
  byFamily: number;
  byPerson: number;
}

/**
 * Cuánto le tocaría poner a cada familia habilitada con cada criterio.
 * Ayuda a decidir en la mesa viendo números concretos.
 */
export function deriveModeComparison(families: Family[]): ModeComparisonRow[] {
  const withEligibility = computeAllEligibility(families);
  const { byFamilyShares, byPersonShares } = calculateModeImpact(withEligibility);

  return withEligibility
    .filter((family) => family.isEligibleToPay)
    .map((family) => ({
      familyId: family.id,
      name: family.name,
      byFamily: Math.round((byFamilyShares[family.id] ?? 0) * 100) / 100,
      byPerson: Math.round((byPersonShares[family.id] ?? 0) * 100) / 100,
    }));
}
