import type { SplitBreakdown } from "@/types/calculation";
import type { FamilyWithEligibility, SplitMode } from "@/types/family";
import { isSoloMinorFamily } from "./eligibility";
import { MINOR_SHARE_RATIO } from "./splitModes";

/** Redondeo a centavos. */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Parte de cada uno según cuánto pagan los menores. Siempre por persona.
 *
 * - Menores al 100%: parte = total ÷ (adultos + menores); todos pagan igual.
 * - Menores al 50%:  parte = total ÷ (adultos + menores); cada menor paga la
 *                    mitad. La otra mitad de un menor de una familia con
 *                    adultos la cubren los adultos de SU familia; la de un
 *                    menor que vino solo (y paga su parte) se reparte en
 *                    partes iguales entre TODOS los adultos.
 * - Menores al 0%:   total ÷ adultos; los menores no pagan.
 *
 * Solo cuentan las familias que entran en la cuenta (`isEligibleToPay`): las
 * que tienen adultos y los menores solos que pagan su parte.
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
  const soloMinors = contributing
    .filter(isSoloMinorFamily)
    .reduce((sum, family) => sum + family.minors, 0);

  const breakdown: SplitBreakdown = {
    splitMode,
    totalAmount,
    contributingFamilies: contributing.length,
    adults,
    minors,
    soloMinors,
    personShare: 0,
    minorRatio: MINOR_SHARE_RATIO[splitMode],
    minorShare: 0,
    minorCover: 0,
    soloMinorsUnpaid: 0,
    adultSurcharge: 0,
    adultShare: 0,
  };

  // Sin adultos no hay quién cubra nada: no se reparte.
  if (contributing.length === 0 || adults === 0) return breakdown;

  if (splitMode === "by-person-minors-zero") {
    // "El total se divide entre todos los adultos": sin pasos intermedios.
    return { ...breakdown, adultShare: round2(totalAmount / adults) };
  }

  const personShare = round2(totalAmount / (adults + minors));
  const minorShare = round2(personShare * breakdown.minorRatio);
  const minorCover = round2(personShare - minorShare);
  const soloMinorsUnpaid = round2(soloMinors * minorCover);
  const adultSurcharge = round2(soloMinorsUnpaid / adults);

  return {
    ...breakdown,
    personShare,
    minorShare,
    minorCover,
    soloMinorsUnpaid,
    adultSurcharge,
    adultShare: round2(personShare + adultSurcharge),
  };
}

/** Partes de la cuota de una familia, para mostrar la cuenta. */
export interface FamilyShareParts {
  /** Adultos × lo que paga cada adulto. */
  adults: number;
  /** Menores × lo que paga cada menor. */
  minors: number;
  /** Lo que los adultos de la familia cubren de sus propios menores (50%). */
  ownMinorsCover: number;
  total: number;
}

export function getFamilyShareParts(
  family: FamilyWithEligibility,
  breakdown: SplitBreakdown
): FamilyShareParts {
  if (!family.isEligibleToPay) return { adults: 0, minors: 0, ownMinorsCover: 0, total: 0 };

  const adults = round2(family.adults * breakdown.adultShare);
  const minors = round2(family.minors * breakdown.minorShare);
  // Los menores solos no tienen adultos propios: su parte faltante ya está
  // repartida entre todos (adultSurcharge).
  const ownMinorsCover = isSoloMinorFamily(family) ? 0 : round2(family.minors * breakdown.minorCover);

  return { adults, minors, ownMinorsCover, total: round2(adults + minors + ownMinorsCover) };
}

/** Lo que le toca a una familia con ese desglose. */
export function getFamilyShare(
  family: FamilyWithEligibility,
  breakdown: SplitBreakdown
): number {
  return getFamilyShareParts(family, breakdown).total;
}
