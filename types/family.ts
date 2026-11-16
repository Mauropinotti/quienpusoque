/**
 * Criterio de reparto.
 * - `by-family`: partes iguales por familia que aporta.
 * - `by-person`: partes iguales por persona; los menores pagan igual que los adultos.
 * - `by-person-minors-half`: los menores pagan el 50% de la parte por persona y
 *   lo que dejan de pagar se reparte en partes iguales entre los adultos.
 * - `by-person-minors-zero`: los menores no pagan; el total se divide entre los adultos.
 */
export type SplitMode =
  | "by-family"
  | "by-person"
  | "by-person-minors-half"
  | "by-person-minors-zero";

/** Lo que compara la recomendación: por familia o por persona. */
export type SplitBasis = "by-family" | "by-person";

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
  /** Adultos de la familia o grupo. Sin adultos, la familia no aporta. */
  adults: number;
  /** Menores de la familia o grupo. Cuánto pagan depende del criterio. */
  minors: number;
  /**
   * Total que puso la familia. Es lo que usa el cálculo. Si hay `items`, es
   * siempre su suma: lo garantizan `lib/forms` al cargar y `lib/storage` al leer.
   */
  paidAmount: number;
  /** Desglose de lo que puso. Ausente: solo se conoce el total. */
  items?: ContributionItem[];
}

export interface FamilyWithEligibility extends Family {
  /** Tiene al menos un adulto. */
  isEligibleToPay: boolean;
  /** Personas que entran en la cuenta: adultos + menores si aporta, 0 si no. */
  eligiblePersons: number;
}
