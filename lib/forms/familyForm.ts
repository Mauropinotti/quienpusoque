import type { Family, SingleMemberType } from "@/types/family";
import { isSingleMinor } from "@/lib/calculations/eligibility";

export const MEMBER_OPTIONS = [1, 2, 3, 4, 5] as const;

export interface FamilyFormValues {
  name: string;
  members: number;
  singleMemberType: SingleMemberType;
  /** Texto tal como lo tipeó el usuario. */
  paidAmount: string;
  notes: string;
}

export interface FamilyFormErrors {
  name?: string;
  singleMemberType?: string;
  paidAmount?: string;
}

export type FamilyFormResult =
  | { ok: true; family: Omit<Family, "id"> }
  | { ok: false; errors: FamilyFormErrors };

export function emptyFamilyFormValues(): FamilyFormValues {
  return {
    name: "",
    members: 2,
    singleMemberType: null,
    paidAmount: "",
    notes: "",
  };
}

export function familyToFormValues(family: Family): FamilyFormValues {
  return {
    name: family.name,
    members: family.members,
    singleMemberType: family.singleMemberType,
    paidAmount: String(family.paidAmount),
    notes: family.notes ?? "",
  };
}

/** Un menor que viene solo no aporta: su monto queda fijo en 0. */
export function isFamilyAmountLocked(values: FamilyFormValues): boolean {
  return isSingleMinor(values);
}

/** Acepta "2500", "2500.5" y "2500,5". */
export function parseAmount(raw: string): number | null {
  const trimmed = raw.trim().replace(",", ".");
  if (trimmed === "") return null;
  const value = Number(trimmed);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export function parseFamilyForm(values: FamilyFormValues): FamilyFormResult {
  const errors: FamilyFormErrors = {};
  const amountLocked = isFamilyAmountLocked(values);
  const amount = amountLocked ? 0 : parseAmount(values.paidAmount);

  if (values.name.trim() === "") {
    errors.name = "Poné un nombre para identificarla.";
  }
  if (values.members === 1 && values.singleMemberType === null) {
    errors.singleMemberType = "Indicá si es adulto o menor.";
  }
  if (amount === null) {
    errors.paidAmount = "Ingresá un monto válido. Puede ser 0.";
  }

  if (Object.keys(errors).length > 0 || amount === null) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    family: {
      name: values.name.trim(),
      members: values.members,
      singleMemberType: values.members === 1 ? values.singleMemberType : null,
      paidAmount: amount,
      notes: values.notes.trim() || undefined,
    },
  };
}
