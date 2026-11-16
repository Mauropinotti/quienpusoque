/**
 * Criterio de reparto: siempre por persona; cambia cuánto pagan los menores.
 * - `by-person`: menores al 100%, todos pagan una parte igual.
 * - `by-person-minors-half`: cada menor paga el 50% de la parte por persona.
 *   La otra mitad la cubren los adultos de su propia familia; la de los
 *   menores que vinieron solos (y pagan su parte) se reparte entre todos los
 *   adultos.
 * - `by-person-minors-zero`: los menores no pagan; el total se divide entre los adultos.
 */
export type SplitMode =
  | "by-person"
  | "by-person-minors-half"
  | "by-person-minors-zero";

/** Criterio de versiones anteriores (hasta V1.2). Solo aparece en el historial. */
export type LegacySplitMode = "by-family";

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
  /**
   * Solo para familias sin adultos (menores que vinieron solos): true si el
   * menor paga su parte, a través de su padre, madre o tutor. Si no, queda
   * invitado y no entra en la cuenta.
   */
  paysOwnShare?: boolean;
}

export interface FamilyWithEligibility extends Family {
  /** Entra en la cuenta: tiene adultos, o es un menor solo que paga su parte. */
  isEligibleToPay: boolean;
  /** Personas que entran en la cuenta: adultos + menores si aporta, 0 si no. */
  eligiblePersons: number;
}
