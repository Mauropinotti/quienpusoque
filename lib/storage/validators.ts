import type { Family, SingleMemberType, SplitMode } from "@/types/family";

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

export function isValidFamily(value: unknown): value is Family {
  if (!isRecord(value)) return false;

  const { id, name, members, singleMemberType, paidAmount, notes } = value;

  if (typeof id !== "string" || id.trim() === "") return false;
  if (typeof name !== "string" || name.trim() === "") return false;
  if (typeof members !== "number") return false;
  if (!Number.isInteger(members) || members < 1 || members > 5) return false;
  if (!isSingleMemberType(singleMemberType)) return false;
  if (members === 1 && singleMemberType === null) return false;
  if (members > 1 && singleMemberType !== null) return false;
  if (typeof paidAmount !== "number" || !Number.isFinite(paidAmount)) return false;
  if (paidAmount < 0) return false;
  if (notes !== undefined && typeof notes !== "string") return false;

  return true;
}
