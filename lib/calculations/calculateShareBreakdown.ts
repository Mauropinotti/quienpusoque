import type { SplitBreakdown } from "@/types/calculation";
import type { FamilyWithEligibility, SplitMode } from "@/types/family";
import { isSoloMinorFamily } from "./eligibility";
import { MINOR_SHARE_RATIO } from "./splitModes";

/** Redondeo a centavos. */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Reparto por porciones. Cada adulto cuenta una porción; cada menor, la
 * fracción elegida: 1 (100%), ½ (50%) o 0 (0%).
 *
 *   porciones          = adultos + menores × fracción
 *   precio por porción = total ÷ porciones   → lo que paga cada adulto
 *   cada menor paga    = precio × fracción   → al 50%, la mitad que un adulto
 *
 * Con 100% da lo mismo que repartir en partes iguales por persona y con 0%
 * lo mismo que dividir el total entre los adultos. Nadie absorbe "lo que no
 * paga" otro: todos pagan el mismo precio por porción.
 *
 * Solo cuentan las familias que entran en la cuenta (`isEligibleToPay`): las
 * que tienen adultos y los menores solos que pagan su parte.
 *
 * Cada paso se redondea a centavos: lo que se muestra en el ticket cierra a
 * la vista. La diferencia de centavos contra el total la absorben las
 * transferencias (ver `calculateTransfers`).
 */
export function calculateShareBreakdown(
  families: FamilyWithEligibility[],
  totalAmount: number,
  splitMode: SplitMode
): SplitBreakdown {
  const contributing = families.filter((family) => family.isEligibleToPay);
  const adults = contributing.reduce((sum, family) => sum + family.adults, 0);
  const minors = contributing.reduce((sum, family) => sum + family.minors, 0);
  const soloMinors = contributing
    .filter(isSoloMinorFamily)
    .reduce((sum, family) => sum + family.minors, 0);
  const minorRatio = MINOR_SHARE_RATIO[splitMode];
  const portions = adults + minors * minorRatio;

  const breakdown: SplitBreakdown = {
    splitMode,
    totalAmount,
    contributingFamilies: contributing.length,
    adults,
    minors,
    soloMinors,
    minorRatio,
    portions,
    adultShare: 0,
    minorShare: 0,
  };

  // Sin adultos no se reparte: alguien tiene que hacerse cargo de los menores.
  if (contributing.length === 0 || adults === 0) return breakdown;

  const adultShare = round2(totalAmount / portions);
  return { ...breakdown, adultShare, minorShare: round2(adultShare * minorRatio) };
}

/** Lo que le toca a una familia: sus porciones al precio de la porción. */
export function getFamilyShare(
  family: FamilyWithEligibility,
  breakdown: SplitBreakdown
): number {
  if (!family.isEligibleToPay) return 0;
  return round2(family.adults * breakdown.adultShare + family.minors * breakdown.minorShare);
}
