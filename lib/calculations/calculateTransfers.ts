import type { FamilyBalance, Transfer, TransferResult } from "@/types/calculation";

// ── Internal working type ─────────────────────────────────────────────────────

interface Party {
  familyId: string;
  name: string;
  remaining: number; // whole pesos — integer arithmetic throughout
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Convierte un monto a pesos enteros.
 * Todos los cálculos internos son aritmética de enteros para evitar deriva
 * de punto flotante durante el emparejamiento.
 */
function toWholePesos(amount: number): number {
  return Math.round(amount);
}

/**
 * Ordena de mayor a menor. Desempate por nombre (orden alfabético ascendente)
 * para garantizar determinismo cuando dos partes tienen el mismo monto.
 */
function compareParties(a: Party, b: Party): number {
  if (b.remaining !== a.remaining) return b.remaining - a.remaining;
  return a.name.localeCompare(b.name, "es");
}

// ── Main function ─────────────────────────────────────────────────────────────

/**
 * Genera transferencias mínimas para equilibrar los balances.
 *
 * Algoritmo: emparejamiento greedy secuencial.
 * - Ordena deudores y acreedores de mayor a menor deuda/crédito.
 * - En cada paso toma min(deuda_actual, crédito_actual) y genera una transferencia.
 * - Avanza el puntero del lado que se agotó.
 * - Produce a lo sumo N + M − 1 transferencias (N = deudores, M = acreedores),
 *   que es el óptimo demostrable para este esquema de emparejamiento.
 *
 * Redondeo: todos los balances se convierten a pesos enteros antes del loop.
 * La aritmética interna es siempre entera. El campo `roundingDiscrepancy`
 * mide la diferencia entre lo que deben los deudores y lo que esperan los
 * acreedores (en pesos enteros), causada por el redondeo previo en balances.
 *
 * Determinismo garantizado por el sort secundario por nombre.
 *
 * Familias invitadas (status = "guest") nunca generan transferencias;
 * su balance es 0 y están explícitamente excluidas por el filtro de status.
 */
export function calculateTransfers(balances: FamilyBalance[]): TransferResult {
  // ── 1. Separar deudores y acreedores usando el status canónico ────────────
  const debtors: Party[] = balances
    .filter((b) => b.status === "pays")
    .map((b) => ({
      familyId: b.familyId,
      name: b.name,
      remaining: toWholePesos(Math.abs(b.balance)),
    }))
    .filter((d) => d.remaining >= 1) // descartar diferencias sub-peso por redondeo
    .sort(compareParties);

  const creditors: Party[] = balances
    .filter((b) => b.status === "receives")
    .map((b) => ({
      familyId: b.familyId,
      name: b.name,
      remaining: toWholePesos(b.balance),
    }))
    .filter((c) => c.remaining >= 1)
    .sort(compareParties);

  // ── 2. Totales para verificación posterior ────────────────────────────────
  const totalOwed = debtors.reduce((sum, d) => sum + d.remaining, 0);
  const totalExpected = creditors.reduce((sum, c) => sum + c.remaining, 0);

  // ── 3. Emparejamiento greedy ──────────────────────────────────────────────
  const transfers: Transfer[] = [];
  let di = 0;
  let ci = 0;

  while (di < debtors.length && ci < creditors.length) {
    const debtor = debtors[di];
    const creditor = creditors[ci];

    // Ambos `remaining` son enteros ≥ 1 al entrar aquí.
    // Math.min de dos enteros es entero → no hay deriva de punto flotante.
    const amount = Math.min(debtor.remaining, creditor.remaining);

    transfers.push({
      fromFamilyId: debtor.familyId,
      fromFamilyName: debtor.name,
      toFamilyId: creditor.familyId,
      toFamilyName: creditor.name,
      amount,
    });

    debtor.remaining -= amount;
    creditor.remaining -= amount;

    // Avanzar el puntero del lado agotado.
    // Ambas condiciones pueden ser true simultáneamente (pago exacto).
    if (debtor.remaining < 1) di++;
    if (creditor.remaining < 1) ci++;
  }

  // ── 4. Verificación ───────────────────────────────────────────────────────
  const totalTransferred = transfers.reduce((sum, t) => sum + t.amount, 0);
  // roundingDiscrepancy ≤ número de partes − 1 pesos, ya que cada Math.round
  // introduce un error máximo de 0.5 pesos por parte.
  const roundingDiscrepancy = Math.abs(totalOwed - totalExpected);

  return {
    transfers,
    totalOwed,
    totalTransferred,
    roundingDiscrepancy,
  };
}
