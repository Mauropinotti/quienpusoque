import type { EventData } from "@/types/event";
import type { Family, SplitMode } from "@/types/family";
import { isSingleMinor } from "@/lib/calculations/eligibility";
import {
  getBrowserStorage,
  readStorageJson,
  removeStorageKey,
  writeStorageString,
} from "./browserStorage";
import { isRecord, isSplitMode, isValidFamily } from "./validators";

export const CURRENT_DRAFT_STORAGE_KEY = "quien-puso-que:current-draft";

const DRAFT_VERSION = 1;

export interface LocalEventDraft {
  version: typeof DRAFT_VERSION;
  eventName: string;
  currency: string;
  createdAt: string;
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
  createdAt: string;
}

function parseDraft(value: unknown): LocalEventDraft | null {
  if (!isRecord(value)) return null;

  const {
    version,
    eventName,
    currency,
    createdAt,
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
  if (
    createdAt !== undefined &&
    (typeof createdAt !== "string" || Number.isNaN(Date.parse(createdAt)))
  ) {
    return null;
  }

  return {
    version: DRAFT_VERSION,
    eventName,
    currency,
    createdAt: typeof createdAt === "string" ? createdAt : updatedAt,
    // Borradores anteriores a la regla pueden traer monto cargado en un menor solo.
    families: (families as Family[]).map((family) =>
      isSingleMinor(family) ? { ...family, paidAmount: 0 } : family
    ),
    selectedMode,
    splitMode,
    recommendationAccepted,
    updatedAt,
  };
}

/**
 * Huella del contenido persistible (sin `updatedAt`). Si no cambió, no hace
 * falta volver a escribir el borrador.
 */
export function getDraftFingerprint({
  eventData,
  selectedMode,
  recommendationAccepted,
  createdAt,
}: SaveEventDraftInput): string {
  return JSON.stringify([
    eventData.eventName,
    eventData.currency,
    eventData.splitMode,
    eventData.families,
    selectedMode,
    recommendationAccepted,
    createdAt,
  ]);
}

/** Un borrador vacío no vale la pena guardarlo: se borra. */
export function hasDraftContent(eventData: EventData): boolean {
  return (
    eventData.eventName.trim().length > 0 ||
    eventData.families.length > 0 ||
    eventData.splitMode !== null
  );
}

/** Chequeo barato (sin parsear) para textos de UI como "seguir con tu cuenta". */
export function hasStoredDraft(): boolean {
  try {
    return getBrowserStorage()?.getItem(CURRENT_DRAFT_STORAGE_KEY) != null;
  } catch {
    return false;
  }
}

export function readCurrentEventDraft(): LocalEventDraft | null {
  return parseDraft(readStorageJson(CURRENT_DRAFT_STORAGE_KEY));
}

export function saveCurrentEventDraft({
  eventData,
  selectedMode,
  recommendationAccepted,
  createdAt,
}: SaveEventDraftInput): LocalEventDraft | null {
  const draft: LocalEventDraft = {
    version: DRAFT_VERSION,
    eventName: eventData.eventName,
    currency: eventData.currency,
    createdAt,
    families: eventData.families,
    selectedMode,
    splitMode: eventData.splitMode,
    recommendationAccepted,
    updatedAt: new Date().toISOString(),
  };

  return writeStorageString(CURRENT_DRAFT_STORAGE_KEY, JSON.stringify(draft))
    ? draft
    : null;
}

export function clearCurrentEventDraft(): boolean {
  return removeStorageKey(CURRENT_DRAFT_STORAGE_KEY);
}
