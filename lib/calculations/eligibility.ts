import type { Family, FamilyWithEligibility } from "@/types/family";
import type { ValidationError } from "@/types/calculation";

// ── Validation ────────────────────────────────────────────────────────────────

export function validateFamily(family: Family): ValidationError[] {
  const errors: ValidationError[] = [];

  if (
    !Number.isInteger(family.members) ||
    family.members < 1 ||
    family.members > 5
  ) {
    errors.push({
      code: "MEMBERS_OUT_OF_RANGE",
      message: `"${family.name}": la cantidad de integrantes debe ser un número entero entre 1 y 5.`,
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

  if (family.members === 1 && family.singleMemberType === null) {
    errors.push({
      code: "MISSING_SINGLE_MEMBER_TYPE",
      message: `"${family.name}": una familia de 1 integrante debe indicar si es adulto o menor.`,
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
 * - 1 adulto  → isEligibleToPay: true,  eligiblePersons: 1
 * - 1 menor   → isEligibleToPay: false, eligiblePersons: 0
 * - 2 o más   → isEligibleToPay: true,  eligiblePersons: members
 */
export function computeEligibility(family: Family): FamilyWithEligibility {
  if (family.members === 1) {
    const isAdult = family.singleMemberType === "adult";
    return {
      ...family,
      isEligibleToPay: isAdult,
      eligiblePersons: isAdult ? 1 : 0,
    };
  }
  return {
    ...family,
    isEligibleToPay: true,
    eligiblePersons: family.members,
  };
}

export function computeAllEligibility(
  families: Family[]
): FamilyWithEligibility[] {
  return families.map(computeEligibility);
}
