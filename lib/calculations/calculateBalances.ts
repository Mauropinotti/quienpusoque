import type { EventData } from "@/types/event";
import type {
  BalanceStatus,
  CalculationOutput,
  CalculationResult,
  FamilyBalance,
  ValidationError,
} from "@/types/calculation";
import { computeAllEligibility, validateFamilies } from "./eligibility";
import { calculateShareBreakdown, getFamilyShare } from "./calculateShareBreakdown";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Rounds to 2 decimal places (centavos). */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Epsilon para comparar balances contra cero.
 * 0.005 equivale a medio centavo — cubre errores de punto flotante tras redondeo.
 */
const EPSILON = 0.005;

function deriveStatus(
  balance: number,
  isEligibleToPay: boolean
): BalanceStatus {
  if (!isEligibleToPay) return "guest";
  if (balance > EPSILON) return "receives";
  if (balance < -EPSILON) return "pays";
  return "balanced";
}

// ── Main function ─────────────────────────────────────────────────────────────

/**
 * Calcula balances a partir de los datos del evento.
 *
 * Retorna un CalculationResult discriminado:
 *   { ok: true, data: CalculationOutput }   → cálculo exitoso
 *   { ok: false, errors: ValidationError[] } → datos inválidos
 *
 * Casos borde manejados:
 * - splitMode null        → error NULL_SPLIT_MODE
 * - sin familias          → error NO_FAMILIES
 * - datos inválidos       → errores por familia (montos negativos, sin personas, etc.)
 * - sin elegibles         → error NO_ELIGIBLE_FAMILIES
 * - gasto total cero      → todos los balances son 0, no es un error
 */
export function calculateBalances(eventData: EventData): CalculationResult {
  const { families, splitMode } = eventData;

  // ── 1. Validar splitMode ──────────────────────────────────────────────────
  if (!splitMode) {
    return {
      ok: false,
      errors: [
        {
          code: "NULL_SPLIT_MODE",
          message:
            "Debe seleccionarse un criterio de reparto (por familia o por persona) antes de calcular.",
        },
      ],
    };
  }

  // ── 2. Validar que haya familias ──────────────────────────────────────────
  if (families.length === 0) {
    return {
      ok: false,
      errors: [
        {
          code: "NO_FAMILIES",
          message: "El evento no tiene familias cargadas.",
        },
      ],
    };
  }

  // ── 3. Validar datos de cada familia ──────────────────────────────────────
  const familyErrors: ValidationError[] = validateFamilies(families);
  if (familyErrors.length > 0) {
    return { ok: false, errors: familyErrors };
  }

  // ── 4. Calcular elegibilidad ──────────────────────────────────────────────
  const withEligibility = computeAllEligibility(families);
  const eligible = withEligibility.filter((f) => f.isEligibleToPay);

  if (eligible.length === 0) {
    return {
      ok: false,
      errors: [
        {
          code: "NO_ELIGIBLE_FAMILIES",
          message:
            "Ninguna familia está habilitada para pagar. Revisá los datos cargados.",
        },
      ],
    };
  }

  // ── 5. Totales ────────────────────────────────────────────────────────────
  const totalAmount = round2(
    families.reduce((sum, f) => sum + f.paidAmount, 0)
  );
  const eligibleFamilyCount = eligible.length;
  const eligiblePersonCount = eligible.reduce(
    (sum, f) => sum + f.eligiblePersons,
    0
  );

  // ── 6. Parte de cada uno según el criterio ─────────────────────────────
  const breakdown = calculateShareBreakdown(withEligibility, totalAmount, splitMode);

  // ── 7. Construir balances ─────────────────────────────────────────────────
  const balances: FamilyBalance[] = withEligibility.map((family) => {
    // Gasto total cero: todos deben 0, todos en equilibrio.
    const expectedShare = totalAmount === 0 ? 0 : getFamilyShare(family, breakdown);
    const balance = round2(family.paidAmount - expectedShare);
    return {
      familyId: family.id,
      name: family.name,
      paidAmount: family.paidAmount,
      expectedShare,
      balance,
      status: deriveStatus(balance, family.isEligibleToPay),
      isEligibleToPay: family.isEligibleToPay,
      eligiblePersons: family.eligiblePersons,
    };
  });

  // ── 8. Resultado ──────────────────────────────────────────────────────────
  const output: CalculationOutput = {
    totalAmount,
    eligibleFamilyCount,
    eligiblePersonCount,
    splitMode,
    balances,
    breakdown,
  };

  return { ok: true, data: output };
}
