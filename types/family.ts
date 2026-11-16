export type SplitMode = "by-family" | "by-person";

export type SingleMemberType = "adult" | "minor" | null;

/** Una cosa que puso una familia: "carne" $ 10.000, "hielo" $ 2.000. */
export interface ContributionItem {
  /** Qué puso. Puede quedar vacío si solo puso plata. */
  description: string;
  /** Lo que salió, en la moneda del evento. Nunca negativo. */
  amount: number;
}

export interface Family {
  id: string;
  name: string;
  members: number;
  singleMemberType: SingleMemberType;
  /**
   * Total que puso la familia. Es lo que usa el cálculo. Si hay `items`, es
   * siempre su suma: lo garantizan `lib/forms` al cargar y `lib/storage` al leer.
   */
  paidAmount: number;
  /** Desglose de lo que puso. Ausente: solo se conoce el total. */
  items?: ContributionItem[];
}

export interface FamilyWithEligibility extends Family {
  isEligibleToPay: boolean;
  eligiblePersons: number;
}
