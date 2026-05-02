import type { FamilyWithEligibility } from "@/types/family";
import type { FamilyBalance } from "@/types/calculation";

export function calculateBalances(
  families: FamilyWithEligibility[],
  splitMode: "by-family" | "by-person"
): FamilyBalance[] {
  const totalPaid = families.reduce((sum, f) => sum + f.paidAmount, 0);
  const eligibleFamilies = families.filter((f) => f.isEligibleToPay);

  const getExpectedShare = (family: FamilyWithEligibility): number => {
    if (!family.isEligibleToPay) return 0;

    if (splitMode === "by-family") {
      return totalPaid / eligibleFamilies.length;
    }

    const totalEligiblePersons = eligibleFamilies.reduce(
      (sum, f) => sum + f.eligiblePersons,
      0
    );
    if (totalEligiblePersons === 0) return 0;
    const sharePerPerson = totalPaid / totalEligiblePersons;
    return sharePerPerson * family.eligiblePersons;
  };

  return families.map((family) => {
    const expectedShare = getExpectedShare(family);
    return {
      familyId: family.id,
      name: family.name,
      paidAmount: family.paidAmount,
      expectedShare,
      balance: family.paidAmount - expectedShare,
      isEligibleToPay: family.isEligibleToPay,
      eligiblePersons: family.eligiblePersons,
    };
  });
}
