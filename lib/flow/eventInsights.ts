import type { FamilyBalance, SplitBreakdown, Transfer } from "@/types/calculation";
import type { Family, SplitMode } from "@/types/family";
import type { SplitRecommendation } from "@/types/recommendation";
import { computeAllEligibility } from "@/lib/calculations/eligibility";
import { calculateBalances } from "@/lib/calculations/calculateBalances";
import { calculateTransfers } from "@/lib/calculations/calculateTransfers";
import { recommendSplitMode } from "@/lib/calculations/recommendSplitMode";
import {
  calculateShareBreakdown,
  getFamilyShare,
} from "@/lib/calculations/calculateShareBreakdown";
import {
  PERSON_SPLIT_MODES,
  type PersonSplitMode,
} from "@/lib/calculations/splitModes";

export interface EventInsights {
  familyCount: number;
  eligibleFamilyCount: number;
  /** Adultos y menores de las familias que aportan. */
  adultCount: number;
  minorCount: number;
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
  let adultCount = 0;
  let minorCount = 0;
  let totalPaid = 0;

  for (const family of withEligibility) {
    if (family.isEligibleToPay) {
      eligibleFamilyCount += 1;
      adultCount += family.adults;
      minorCount += family.minors;
    }
    totalPaid += family.paidAmount;
  }

  return {
    familyCount: families.length,
    eligibleFamilyCount,
    adultCount,
    minorCount,
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

/**
 * Cuota de referencia para mostrar en una línea: lo que pone cada familia
 * (por familia), cada persona (todos iguales) o cada adulto (si los menores
 * pagan menos).
 */
export function getUnitShare(settlement: Settlement): number {
  const { breakdown } = settlement;
  return breakdown.splitMode === "by-family" ? breakdown.familyShare : breakdown.adultShare;
}

export interface ModeComparisonRow {
  familyId: string;
  name: string;
  byFamily: number;
  byPerson: number;
}

/**
 * Cuánto le tocaría poner a cada familia que aporta por familia y por
 * persona (con la regla de menores elegida). Ayuda a decidir en la mesa
 * viendo números concretos; usa el mismo cálculo que el resultado.
 */
export function deriveModeComparison(
  families: Family[],
  personMode: PersonSplitMode = "by-person"
): ModeComparisonRow[] {
  const withEligibility = computeAllEligibility(families);
  const total = withEligibility.reduce((sum, family) => sum + family.paidAmount, 0);
  const byFamily = calculateShareBreakdown(withEligibility, total, "by-family");
  const byPerson = calculateShareBreakdown(withEligibility, total, personMode);

  return withEligibility
    .filter((family) => family.isEligibleToPay)
    .map((family) => ({
      familyId: family.id,
      name: family.name,
      byFamily: getFamilyShare(family, byFamily),
      byPerson: getFamilyShare(family, byPerson),
    }));
}

/**
 * El desglose con cada respuesta a "¿cómo pagan los menores?", para mostrar
 * cuánto pagaría un adulto y un menor antes de elegir.
 */
export function derivePersonModePreviews(
  families: Family[]
): Record<PersonSplitMode, SplitBreakdown> {
  const withEligibility = computeAllEligibility(families);
  const total = withEligibility.reduce((sum, family) => sum + family.paidAmount, 0);
  return Object.fromEntries(
    PERSON_SPLIT_MODES.map((mode) => [
      mode,
      calculateShareBreakdown(withEligibility, total, mode),
    ])
  ) as Record<PersonSplitMode, SplitBreakdown>;
}
