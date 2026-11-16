import type { ContributionItem, Family } from "@/types/family";
import {
  MAX_PEOPLE_PER_KIND,
  getPeopleCount,
  isGuestFamily,
} from "@/lib/calculations/eligibility";
import {
  MAX_CONTRIBUTION_ITEMS,
  sumContributionItems,
  toContributionFields,
} from "@/lib/calculations/contributions";

export const CONTRIBUTION_DESCRIPTION_MAX_LENGTH = 40;

/** Una fila de "¿Qué puso?" tal como está en pantalla. */
export interface ContributionRowValues {
  /** Clave estable de la fila (React y foco). No se guarda. */
  key: string;
  description: string;
  /** Texto tal como lo tipeó el usuario. */
  amount: string;
}

export interface FamilyFormValues {
  name: string;
  adults: number;
  minors: number;
  items: ContributionRowValues[];
}

export type PeopleKind = "adults" | "minors";

export interface FamilyFormErrors {
  name?: string;
  people?: string;
  /** Errores por fila, indexados por `ContributionRowValues.key`. */
  items?: Record<string, string>;
}

export type FamilyFormResult =
  | { ok: true; family: Omit<Family, "id"> }
  | { ok: false; errors: FamilyFormErrors };

function contributionRow(key: string, description = "", amount = ""): ContributionRowValues {
  return { key, description, amount };
}

/** Claves 1, 2, 3...: deterministas y únicas dentro del formulario. */
function nextRowKey(rows: readonly ContributionRowValues[]): string {
  const max = rows.reduce((current, row) => Math.max(current, Number(row.key) || 0), 0);
  return String(max + 1);
}

export function emptyFamilyFormValues(): FamilyFormValues {
  return {
    name: "",
    adults: 2,
    minors: 0,
    items: [contributionRow("1")],
  };
}

export function familyToFormValues(family: Family): FamilyFormValues {
  const items =
    family.items && family.items.length > 0
      ? family.items.map((item, index) =>
          contributionRow(String(index + 1), item.description, String(item.amount))
        )
      : [contributionRow("1", "", family.paidAmount > 0 ? String(family.paidAmount) : "")];

  return {
    name: family.name,
    adults: family.adults,
    minors: family.minors,
    items,
  };
}

/** Sin adultos la familia no aporta: su monto queda fijo en 0. */
export function isFamilyAmountLocked(values: Pick<FamilyFormValues, "adults" | "minors">): boolean {
  return isGuestFamily(values);
}

// ── Adultos y menores ─────────────────────────────────────────────────────────

export function canChangePeople(values: FamilyFormValues, kind: PeopleKind, delta: number): boolean {
  const next = values[kind] + delta;
  return next >= 0 && next <= MAX_PEOPLE_PER_KIND;
}

/** Suma o resta una persona, siempre dentro de 0 y el tope. */
export function changePeople(values: FamilyFormValues, kind: PeopleKind, delta: number): FamilyFormValues {
  if (!canChangePeople(values, kind, delta)) return values;
  return { ...values, [kind]: values[kind] + delta };
}

/** Deja solo dígitos, coma y punto mientras se tipea un monto. */
export function sanitizeAmountInput(raw: string): string {
  return raw.replace(/[^\d.,]/g, "");
}

/** Acepta "2500", "2500.5" y "2500,5". */
export function parseAmount(raw: string): number | null {
  const trimmed = raw.trim().replace(",", ".");
  if (trimmed === "") return null;
  const value = Number(trimmed);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

// ── Filas de "¿Qué puso?" ─────────────────────────────────────────────────────

export function canAddContributionRow(values: FamilyFormValues): boolean {
  return values.items.length < MAX_CONTRIBUTION_ITEMS;
}

export function addContributionRow(values: FamilyFormValues): FamilyFormValues {
  if (!canAddContributionRow(values)) return values;
  return { ...values, items: [...values.items, contributionRow(nextRowKey(values.items))] };
}

export function updateContributionRow(
  values: FamilyFormValues,
  key: string,
  patch: Partial<Pick<ContributionRowValues, "description" | "amount">>
): FamilyFormValues {
  return {
    ...values,
    items: values.items.map((row) =>
      row.key === key
        ? {
            ...row,
            ...patch,
            ...(patch.amount !== undefined ? { amount: sanitizeAmountInput(patch.amount) } : {}),
          }
        : row
    ),
  };
}

/** Siempre queda al menos una fila para cargar. */
export function removeContributionRow(values: FamilyFormValues, key: string): FamilyFormValues {
  const items = values.items.filter((row) => row.key !== key);
  return {
    ...values,
    items: items.length > 0 ? items : [contributionRow(nextRowKey(values.items))],
  };
}

/** Total en vivo mientras se carga: suma solo los montos que ya se pueden leer. */
export function getFormTotal(values: FamilyFormValues): number {
  if (isFamilyAmountLocked(values)) return 0;

  const amounts: ContributionItem[] = [];
  for (const row of values.items) {
    const amount = parseAmount(row.amount);
    if (amount !== null) amounts.push({ description: "", amount });
  }
  return sumContributionItems(amounts);
}

// ── Validación ────────────────────────────────────────────────────────────────

export function parseFamilyForm(values: FamilyFormValues): FamilyFormResult {
  const errors: FamilyFormErrors = {};
  const amountLocked = isFamilyAmountLocked(values);
  const items: ContributionItem[] = [];
  const itemErrors: Record<string, string> = {};

  if (values.name.trim() === "") {
    errors.name = "Poné un nombre para identificarla.";
  }
  if (getPeopleCount(values) < 1) {
    errors.people = "Sumá al menos un adulto o un menor.";
  }

  if (!amountLocked) {
    for (const row of values.items) {
      const description = row.description.trim();
      const rawAmount = row.amount.trim();
      // Fila vacía: no puso nada en esa línea.
      if (description === "" && rawAmount === "") continue;

      const amount = parseAmount(rawAmount);
      if (amount === null) {
        itemErrors[row.key] =
          rawAmount === "" ? "¿Cuánto salió? Si no costó nada, poné 0." : "Ingresá un monto válido.";
        continue;
      }
      items.push({ description, amount });
    }
  }

  if (Object.keys(itemErrors).length > 0) errors.items = itemErrors;
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    family: {
      name: values.name.trim(),
      adults: values.adults,
      minors: values.minors,
      ...toContributionFields(items),
    },
  };
}
