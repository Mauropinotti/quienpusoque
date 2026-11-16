import type { Family, FamilyWithEligibility } from "@/types/family";
import type { ValidationError } from "@/types/calculation";

/** Tope por familia o grupo, para adultos y para menores por separado. */
export const MAX_PEOPLE_PER_KIND = 20;

type Composition = Pick<Family, "adults" | "minors" | "paysOwnShare">;

export function getPeopleCount(family: Composition): number {
  return family.adults + family.minors;
}

/** Menores que vinieron solos: una "familia" sin adultos. */
export function isSoloMinorFamily(family: Pick<Family, "adults">): boolean {
  return family.adults === 0;
}

/**
 * Menores solos que pagan su parte: entran en la cuenta y su parte la paga
 * un padre, madre o tutor.
 */
export function isPayingSoloMinorFamily(family: Composition): boolean {
  return isSoloMinorFamily(family) && family.paysOwnShare === true;
}

/**
 * Invitada: menores solos que no pagan su parte. No paga, no cobra, no carga
 * monto y sus menores no entran en la cuenta.
 */
export function isGuestFamily(family: Composition): boolean {
  return isSoloMinorFamily(family) && family.paysOwnShare !== true;
}

function isValidCount(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= MAX_PEOPLE_PER_KIND;
}

// ── Validation ────────────────────────────────────────────────────────────────

export function validateFamily(family: Family): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!isValidCount(family.adults) || !isValidCount(family.minors) || getPeopleCount(family) < 1) {
    errors.push({
      code: "MEMBERS_OUT_OF_RANGE",
      message: `"${family.name}": tiene que haber al menos una persona, con hasta ${MAX_PEOPLE_PER_KIND} adultos y ${MAX_PEOPLE_PER_KIND} menores.`,
      familyId: family.id,
    });
  }

  if (typeof family.paidAmount !== "number" || !isFinite(family.paidAmount) || family.paidAmount < 0) {
    errors.push({
      code: "NEGATIVE_PAID_AMOUNT",
      message: `"${family.name}": el monto pagado no puede ser negativo.`,
      familyId: family.id,
    });
  }

  if (isGuestFamily(family) && family.paidAmount > 0) {
    errors.push({
      code: "GUEST_PAID_AMOUNT",
      message: `"${family.name}": unos menores solos que no pagan su parte no aportan, así que su monto pagado debe ser 0.`,
      familyId: family.id,
    });
  }

  return errors;
}

export function validateFamilies(families: Family[]): ValidationError[] {
  return families.flatMap(validateFamily);
}

// ── Eligibility ───────────────────────────────────────────────────────────────

/**
 * Reglas:
 * - con al menos 1 adulto           → entra; cuentan sus adultos y menores
 * - sin adultos, paga su parte      → entra; cuentan sus menores (paga su tutor)
 * - sin adultos, no paga su parte   → invitada; nadie de la familia entra
 */
export function computeEligibility(family: Family): FamilyWithEligibility {
  const isEligibleToPay = !isGuestFamily(family);
  return {
    ...family,
    isEligibleToPay,
    eligiblePersons: isEligibleToPay ? getPeopleCount(family) : 0,
  };
}

export function computeAllEligibility(
  families: Family[]
): FamilyWithEligibility[] {
  return families.map(computeEligibility);
}
