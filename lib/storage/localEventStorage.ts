import type { EventData } from "@/types/event";
import type { Family, SingleMemberType, SplitMode } from "@/types/family";

export const CURRENT_DRAFT_STORAGE_KEY = "quien-puso-que:current-draft";

const DRAFT_VERSION = 1;

export interface LocalEventDraft {
  version: typeof DRAFT_VERSION;
  eventName: string;
  currency: string;
  families: Family[];
  selectedMode: SplitMode;
  splitMode: SplitMode | null;
  recommendationAccepted: boolean | null;
  updatedAt: string;
}

export interface SaveEventDraftInput {
  eventData: EventData;
  selectedMode: SplitMode;
  recommendationAccepted: boolean | null;
}

function canUseLocalStorage(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const testKey = `${CURRENT_DRAFT_STORAGE_KEY}:test`;
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSplitMode(value: unknown): value is SplitMode {
  return value === "by-family" || value === "by-person";
}

function isSingleMemberType(value: unknown): value is SingleMemberType {
  return value === "adult" || value === "minor" || value === null;
}

function isValidFamily(value: unknown): value is Family {
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

function parseDraft(value: unknown): LocalEventDraft | null {
  if (!isRecord(value)) return null;

  const {
    version,
    eventName,
    currency,
    families,
    selectedMode,
    splitMode,
    recommendationAccepted,
    updatedAt,
  } = value;

  if (version !== DRAFT_VERSION) return null;
  if (typeof eventName !== "string") return null;
  if (typeof currency !== "string" || currency.trim() === "") return null;
  if (!Array.isArray(families) || !families.every(isValidFamily)) return null;
  if (!isSplitMode(selectedMode)) return null;
  if (splitMode !== null && !isSplitMode(splitMode)) return null;
  if (
    recommendationAccepted !== null &&
    typeof recommendationAccepted !== "boolean"
  ) {
    return null;
  }
  if (typeof updatedAt !== "string" || Number.isNaN(Date.parse(updatedAt))) {
    return null;
  }

  return {
    version: DRAFT_VERSION,
    eventName,
    currency,
    families,
    selectedMode,
    splitMode,
    recommendationAccepted,
    updatedAt,
  };
}

export function readCurrentEventDraft(): LocalEventDraft | null {
  if (!canUseLocalStorage()) return null;

  try {
    const raw = window.localStorage.getItem(CURRENT_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    return parseDraft(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveCurrentEventDraft({
  eventData,
  selectedMode,
  recommendationAccepted,
}: SaveEventDraftInput): LocalEventDraft | null {
  if (!canUseLocalStorage()) return null;

  const draft: LocalEventDraft = {
    version: DRAFT_VERSION,
    eventName: eventData.eventName,
    currency: eventData.currency,
    families: eventData.families,
    selectedMode,
    splitMode: eventData.splitMode,
    recommendationAccepted,
    updatedAt: new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(CURRENT_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    return draft;
  } catch {
    return null;
  }
}

export function clearCurrentEventDraft(): boolean {
  if (!canUseLocalStorage()) return false;

  try {
    window.localStorage.removeItem(CURRENT_DRAFT_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
