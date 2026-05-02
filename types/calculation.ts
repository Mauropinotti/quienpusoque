export interface FamilyBalance {
  familyId: string;
  name: string;
  paidAmount: number;
  expectedShare: number;
  balance: number;
  isEligibleToPay: boolean;
  eligiblePersons: number;
}

export interface Transfer {
  fromFamilyId: string;
  fromFamilyName: string;
  toFamilyId: string;
  toFamilyName: string;
  amount: number;
}
