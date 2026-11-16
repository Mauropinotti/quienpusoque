import type { ContributionItem, Family, SplitBasis, SplitMode } from "@/types/family";
import { MAX_PEOPLE_PER_KIND, isGuestFamily } from "@/lib/calculations/eligibility";
import {
  MAX_CONTRIBUTION_ITEMS,
  toContributionFields,
} from "@/lib/calculations/contributions";
import { isSplitModeValue } from "@/lib/calculations/splitModes";

// Validadores compartidos por el borrador, el historial y el archivo
// exportado. Todo dato que viene de afuera pasa por acá antes de llegar a la UI.

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isSplitMode(value: unknown): value is SplitMode {
  return isSplitModeValue(value);
}

export function isSplitBasis(value: unknown): value is SplitBasis {
  return value === "by-family" || value === "by-person";
}

export function isValidDate(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function isValidAmount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isValidCount(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= MAX_PEOPLE_PER_KIND
  );
}

export function isValidContributionItem(value: unknown): value is ContributionItem {
  if (!isRecord(value)) return false;
  return typeof value.description === "string" && isValidAmount(value.amount);
}

/**
 * Familia guardada por versiones anteriores: `members` (1 a 5) y, si era una
 * sola persona, `singleMemberType`. No distinguía adultos de menores.
 */
interface LegacyFamily extends Omit<Family, "adults" | "minors"> {
  members: number;
  singleMemberType: "adult" | "minor" | null;
}

/** Familia tal como puede llegar de storage o de un archivo. */
export type StoredFamily = Family | LegacyFamily;

function isLegacyComposition(value: Record<string, unknown>): boolean {
  const { members, singleMemberType } = value;
  if (typeof members !== "number" || !Number.isInteger(members)) return false;
  if (members < 1 || members > 5) return false;
  if (members === 1) return singleMemberType === "adult" || singleMemberType === "minor";
  return singleMemberType === null;
}

function hasComposition(value: Record<string, unknown>): boolean {
  if ("adults" in value || "minors" in value) {
    return (
      isValidCount(value.adults) &&
      isValidCount(value.minors) &&
      (value.adults as number) + (value.minors as number) >= 1
    );
  }
  return isLegacyComposition(value);
}

export function isValidFamily(value: unknown): value is StoredFamily {
  if (!isRecord(value)) return false;

  const { id, name, paidAmount, items, notes } = value;

  if (typeof id !== "string" || id.trim() === "") return false;
  if (typeof name !== "string" || name.trim() === "") return false;
  if (!hasComposition(value)) return false;
  if (!isValidAmount(paidAmount)) return false;
  if (
    items !== undefined &&
    (!Array.isArray(items) ||
      items.length > MAX_CONTRIBUTION_ITEMS ||
      !items.every(isValidContributionItem))
  ) {
    return false;
  }
  // `notes` era el detalle libre previo al desglose por ítems.
  if (notes !== undefined && typeof notes !== "string") return false;

  return true;
}

/**
 * Las versiones anteriores no distinguían adultos de menores:
 * - 1 adulto → 1 adulto; 1 menor → 1 menor (sin adultos: no aporta, como antes);
 * - 2 o más integrantes → todos adultos. Así el reparto da lo mismo que daba.
 */
function toComposition(family: StoredFamily): Pick<Family, "adults" | "minors"> {
  if ("adults" in family) return { adults: family.adults, minors: family.minors };
  if (family.members === 1 && family.singleMemberType === "minor") return { adults: 0, minors: 1 };
  return { adults: family.members, minors: 0 };
}

/**
 * Deja una familia ya validada en la forma que espera la app:
 * - adultos y menores explícitos (migra el formato anterior);
 * - una familia sin adultos no aporta: monto 0 y sin desglose;
 * - si hay desglose, el total es su suma (nunca se confía en el guardado);
 * - una `notes` de versiones anteriores pasa a ser el único ítem, con el total.
 */
export function normalizeFamily(family: StoredFamily): Family {
  const { id, name, paidAmount, items } = family;
  const notes = (family as { notes?: string }).notes;
  const base: Family = { id, name, ...toComposition(family), paidAmount };

  if (isGuestFamily(base)) return { ...base, paidAmount: 0 };

  if (items && items.length > 0) {
    return { ...base, ...withoutUndefinedItems(toContributionFields(items)) };
  }

  const legacyNote = notes?.trim() ?? "";
  if (legacyNote !== "") {
    return { ...base, items: [{ description: legacyNote, amount: base.paidAmount }] };
  }

  return base;
}

/** Lo guardado no lleva `items: undefined`: así el objeto se compara igual al recargar. */
function withoutUndefinedItems(fields: Pick<Family, "paidAmount" | "items">) {
  return fields.items ? fields : { paidAmount: fields.paidAmount };
}
