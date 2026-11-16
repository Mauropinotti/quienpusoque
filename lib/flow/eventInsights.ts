import type { FamilyBalance, SplitBreakdown, Transfer } from "@/types/calculation";
import type { Family, SplitMode } from "@/types/family";
import {
  computeAllEligibility,
  isGuestFamily,
  isSoloMinorFamily,
} from "@/lib/calculations/eligibility";
import { calculateBalances } from "@/lib/calculations/calculateBalances";
import { calculateTransfers } from "@/lib/calculations/calculateTransfers";
import {
  calculateShareBreakdown,
  getFamilyShare,
} from "@/lib/calculations/calculateShareBreakdown";
import { SPLIT_MODES } from "@/lib/calculations/splitModes";

export interface EventInsights {
  familyCount: number;
  /** Familias que entran en la cuenta. */
  eligibleFamilyCount: number;
  /** Adultos que entran en la cuenta. */
  adultCount: number;
  /** Menores de familias con adultos. */
  familyMinorCount: number;
  /** Menores que vinieron solos y pagan su parte. */
  soloMinorCount: number;
  /** Menores que vinieron solos y no pagan (invitados). */
  guestMinorCount: number;
  totalPaid: number;
  /** Hace falta al menos 2 familias en la cuenta y algún adulto para repartir. */
  canCalculate: boolean;
}

/**
 * Todo lo que la UI necesita saber de la lista de familias, en una pasada.
 */
export function deriveEventInsights(families: Family[]): EventInsights {
  const withEligibility = computeAllEligibility(families);
  let eligibleFamilyCount = 0;
  let adultCount = 0;
  let familyMinorCount = 0;
  let soloMinorCount = 0;
  let guestMinorCount = 0;
  let totalPaid = 0;

  for (const family of withEligibility) {
    totalPaid += family.paidAmount;
    if (isGuestFamily(family)) {
      guestMinorCount += family.minors;
      continue;
    }
    eligibleFamilyCount += 1;
    adultCount += family.adults;
    if (isSoloMinorFamily(family)) soloMinorCount += family.minors;
    else familyMinorCount += family.minors;
  }

  return {
    familyCount: families.length,
    eligibleFamilyCount,
    adultCount,
    familyMinorCount,
    soloMinorCount,
    guestMinorCount,
    totalPaid,
    canCalculate: families.length >= 2 && eligibleFamilyCount >= 2 && adultCount > 0,
  };
}

export interface Settlement {
  splitMode: SplitMode;
  totalAmount: number;
  eligibleFamilyCount: number;
  eligiblePersonCount: number;
  balances: FamilyBalance[];
  transfers: Transfer[];
  /** Los pasos del cálculo, para mostrarlos tal cual. */
  breakdown: SplitBreakdown;
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
    breakdown: result.data.breakdown,
  };
}

/** Lo que paga cada adulto: la cuota de referencia en una línea. */
export function getUnitShare(settlement: Settlement): number {
  return settlement.breakdown.adultShare;
}

/**
 * El desglose con cada respuesta a "¿cómo pagan los menores?", para mostrar
 * cuánto pagaría un adulto y un menor antes de elegir.
 */
export function deriveModePreviews(families: Family[]): Record<SplitMode, SplitBreakdown> {
  const withEligibility = computeAllEligibility(families);
  const total = withEligibility.reduce((sum, family) => sum + family.paidAmount, 0);
  return Object.fromEntries(
    SPLIT_MODES.map((mode) => [mode, calculateShareBreakdown(withEligibility, total, mode)])
  ) as Record<SplitMode, SplitBreakdown>;
}

export interface ModeComparisonRow {
  familyId: string;
  name: string;
  /** Menores que vinieron solos (paga su padre, madre o tutor). */
  isSoloMinor: boolean;
  shares: Record<SplitMode, number>;
}

/**
 * Cuánto le tocaría poner a cada familia que entra en la cuenta con cada
 * respuesta sobre los menores. Usa el mismo cálculo que el resultado.
 */
export function deriveModeComparison(families: Family[]): ModeComparisonRow[] {
  const withEligibility = computeAllEligibility(families);
  const total = withEligibility.reduce((sum, family) => sum + family.paidAmount, 0);
  const breakdowns = SPLIT_MODES.map(
    (mode) => [mode, calculateShareBreakdown(withEligibility, total, mode)] as const
  );

  return withEligibility
    .filter((family) => family.isEligibleToPay)
    .map((family) => ({
      familyId: family.id,
      name: family.name,
      isSoloMinor: isSoloMinorFamily(family),
      shares: Object.fromEntries(
        breakdowns.map(([mode, breakdown]) => [mode, getFamilyShare(family, breakdown)])
      ) as Record<SplitMode, number>,
    }));
}
