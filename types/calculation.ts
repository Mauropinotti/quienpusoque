import type { SplitMode } from "./family";

// ── Balance status ────────────────────────────────────────────────────────────

export type BalanceStatus = "pays" | "receives" | "balanced" | "guest";

// ── Validation ────────────────────────────────────────────────────────────────

export type ValidationErrorCode =
  | "NO_FAMILIES"
  | "NO_ELIGIBLE_FAMILIES"
  | "NEGATIVE_PAID_AMOUNT"
  | "MEMBERS_OUT_OF_RANGE"
  | "MISSING_SINGLE_MEMBER_TYPE"
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

export interface CalculationOutput {
  totalAmount: number;
  eligibleFamilyCount: number;
  eligiblePersonCount: number;
  splitMode: SplitMode;
  balances: FamilyBalance[];
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
