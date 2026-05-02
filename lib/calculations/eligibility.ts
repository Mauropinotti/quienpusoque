import type { Family, FamilyWithEligibility } from "@/types/family";

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
