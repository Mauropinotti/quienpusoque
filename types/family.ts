export type SplitMode = "by-family" | "by-person";

export type SingleMemberType = "adult" | "minor" | null;

export interface Family {
  id: string;
  name: string;
  members: number;
  singleMemberType: SingleMemberType;
  paidAmount: number;
  notes?: string;
}

export interface FamilyWithEligibility extends Family {
  isEligibleToPay: boolean;
  eligiblePersons: number;
}
