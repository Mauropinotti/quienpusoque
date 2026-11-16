import type { SplitMode } from "./family";

// ── Balance status ────────────────────────────────────────────────────────────

export type BalanceStatus = "pays" | "receives" | "balanced" | "guest";

// ── Validation ────────────────────────────────────────────────────────────────

export type ValidationErrorCode =
  | "NO_FAMILIES"
  | "NO_ELIGIBLE_FAMILIES"
  | "NEGATIVE_PAID_AMOUNT"
  | "MEMBERS_OUT_OF_RANGE"
  | "GUEST_PAID_AMOUNT"
  | "NULL_SPLIT_MODE";

export interface ValidationError {
  code: ValidationErrorCode;
  message: string;
  familyId?: string;
}

// ── Core result types ─────────────────────────────────────────────────────────

export interface FamilyBalance {
  familyId: string;
  name: string;
  paidAmount: number;
  expectedShare: number;
  /** paidAmount - expectedShare. Positive → cobra; negative → paga; 0 → equilibrado. */
  balance: number;
  /** Derivado de balance + isEligibleToPay. Canónico: no reinterpretar en componentes. */
  status: BalanceStatus;
  isEligibleToPay: boolean;
  eligiblePersons: number;
}

/**
 * Cómo se llegó a la parte de cada uno, paso a paso. Lo calcula
 * `calculateShareBreakdown` y lo muestran el ticket, el WhatsApp y el PDF.
 * Cada monto es el resultado redondeado a centavos de una operación sobre los
 * montos anteriores, así las cuentas que se muestran cierran a la vista.
 */
export interface SplitBreakdown {
  splitMode: SplitMode;
  totalAmount: number;
  /** Familias que entran en la cuenta. */
  contributingFamilies: number;
  /** Adultos que entran en la cuenta. */
  adults: number;
  /** Menores que entran en la cuenta: los de familias con adultos y los solos que pagan su parte. */
  minors: number;
  /** De esos menores, los que vinieron solos (paga su padre, madre o tutor). */
  soloMinors: number;
  /** Total ÷ (adultos + menores). 0 cuando los menores no pagan. */
  personShare: number;
  /** Parte de la cuota que paga cada menor: 1, 0,5 o 0. */
  minorRatio: number;
  /** Lo que paga cada menor. */
  minorShare: number;
  /** Lo que le falta a cada menor para la parte igual (solo menores al 50%). */
  minorCover: number;
  /** Lo que no pagan los menores solos, que se reparte entre todos los adultos. */
  soloMinorsUnpaid: number;
  /** Lo que suma cada adulto por los menores solos. */
  adultSurcharge: number;
  /** Lo que paga cada adulto por sí mismo (sin contar a los menores de su familia). */
  adultShare: number;
}

export interface CalculationOutput {
  totalAmount: number;
  eligibleFamilyCount: number;
  eligiblePersonCount: number;
  splitMode: SplitMode;
  balances: FamilyBalance[];
  breakdown: SplitBreakdown;
}

export type CalculationResult =
  | { ok: true; data: CalculationOutput }
  | { ok: false; errors: ValidationError[] };

// ── Transfer ──────────────────────────────────────────────────────────────────

export interface Transfer {
  fromFamilyId: string;
  fromFamilyName: string;
  toFamilyId: string;
  toFamilyName: string;
  /** Monto en pesos enteros. */
  amount: number;
}

export interface TransferResult {
  transfers: Transfer[];
  /** Suma de deudas en pesos enteros (sum de |balance| de los que pagan). */
  totalOwed: number;
  /** Suma de los montos de todas las transferencias generadas. */
  totalTransferred: number;
  /**
   * Diferencia en pesos enteros entre totalOwed y total acreditado esperado.
   * Causada por el redondeo previo en calculateBalances.
   * Máximo: número de partes − 1 pesos.
   */
  roundingDiscrepancy: number;
}
