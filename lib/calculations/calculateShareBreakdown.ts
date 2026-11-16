import type { SplitBreakdown } from "@/types/calculation";
import type { FamilyWithEligibility, SplitMode } from "@/types/family";
import { MINOR_SHARE_RATIO } from "./splitModes";

/** Redondeo a centavos. */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Parte de cada uno según el criterio, paso a paso.
 *
 * - Por familia:      parte = total ÷ familias que aportan.
 * - Por persona 100%: parte = total ÷ (adultos + menores); todos pagan igual.
 * - Menores al 50%:   parte = total ÷ (adultos + menores); cada menor paga la
 *                     mitad; lo que dejan de pagar entre todos se reparte en
 *                     partes iguales entre los adultos.
 * - Menores al 0%:    total ÷ adultos; los menores no pagan.
 *
 * Cada paso se redondea a centavos sobre los montos ya redondeados: lo que se
 * muestra en el ticket cierra a la vista. La diferencia de centavos contra el
 * total la absorben las transferencias (ver `calculateTransfers`).
 */
export function calculateShareBreakdown(
  families: FamilyWithEligibility[],
  totalAmount: number,
  splitMode: SplitMode
): SplitBreakdown {
  const contributing = families.filter((family) => family.isEligibleToPay);
  const adults = contributing.reduce((sum, family) => sum + family.adults, 0);
  const minors = contributing.reduce((sum, family) => sum + family.minors, 0);

  const breakdown: SplitBreakdown = {
    splitMode,
    totalAmount,
    contributingFamilies: contributing.length,
    adults,
    minors,
    familyShare: 0,
    personShare: 0,
    minorRatio: splitMode === "by-family" ? 1 : MINOR_SHARE_RATIO[splitMode],
    minorShare: 0,
    minorsUnpaid: 0,
    adultSurcharge: 0,
    adultShare: 0,
  };

  if (contributing.length === 0 || adults === 0) return breakdown;

  if (splitMode === "by-family") {
    return { ...breakdown, familyShare: round2(totalAmount / contributing.length) };
  }

  if (splitMode === "by-person-minors-zero") {
    // "El total se divide entre todos los adultos": sin pasos intermedios.
    return { ...breakdown, adultShare: round2(totalAmount / adults) };
  }

  const personShare = round2(totalAmount / (adults + minors));
  const minorShare = round2(personShare * breakdown.minorRatio);
  const minorsUnpaid = round2(minors * (personShare - minorShare));
  const adultSurcharge = round2(minorsUnpaid / adults);

  return {
    ...breakdown,
    personShare,
    minorShare,
    minorsUnpaid,
    adultSurcharge,
    adultShare: round2(personShare + adultSurcharge),
  };
}

/** Lo que le toca a una familia con ese desglose. */
export function getFamilyShare(
  family: FamilyWithEligibility,
  breakdown: SplitBreakdown
): number {
  if (!family.isEligibleToPay) return 0;
  if (breakdown.splitMode === "by-family") return breakdown.familyShare;
  return round2(family.adults * breakdown.adultShare + family.minors * breakdown.minorShare);
}
