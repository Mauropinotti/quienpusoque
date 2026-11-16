import type { ContributionItem, Family, SingleMemberType, SplitMode } from "@/types/family";
import { isSingleMinor } from "@/lib/calculations/eligibility";
import {
  MAX_CONTRIBUTION_ITEMS,
  toContributionFields,
} from "@/lib/calculations/contributions";

// Validadores compartidos por el borrador y el historial. Todo dato que viene
// de localStorage pasa por acá antes de llegar a la UI.

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isSplitMode(value: unknown): value is SplitMode {
  return value === "by-family" || value === "by-person";
}

export function isSingleMemberType(value: unknown): value is SingleMemberType {
  return value === "adult" || value === "minor" || value === null;
}

export function isValidDate(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function isValidAmount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function isValidContributionItem(value: unknown): value is ContributionItem {
  if (!isRecord(value)) return false;
  return typeof value.description === "string" && isValidAmount(value.amount);
}

export function isValidFamily(value: unknown): value is Family {
  if (!isRecord(value)) return false;

  const { id, name, members, singleMemberType, paidAmount, items, notes } = value;

  if (typeof id !== "string" || id.trim() === "") return false;
  if (typeof name !== "string" || name.trim() === "") return false;
  if (typeof members !== "number") return false;
  if (!Number.isInteger(members) || members < 1 || members > 5) return false;
  if (!isSingleMemberType(singleMemberType)) return false;
  if (members === 1 && singleMemberType === null) return false;
  if (members > 1 && singleMemberType !== null) return false;
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
 * Deja una familia ya validada en la forma que espera la app:
 * - un menor solo no aporta: monto 0 y sin desglose;
 * - si hay desglose, el total es su suma (nunca se confía en el guardado);
 * - una `notes` de versiones anteriores pasa a ser el único ítem, con el total.
 */
export function normalizeFamily(family: Family): Family {
  const { notes, items, ...base } = family as Family & { notes?: string };

  if (isSingleMinor(base)) return { ...base, paidAmount: 0 };

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
