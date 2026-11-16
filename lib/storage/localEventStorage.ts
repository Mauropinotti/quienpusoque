import type { EventData } from "@/types/event";
import type { Family, SplitMode } from "@/types/family";
import {
  getBrowserStorage,
  readStorageJson,
  removeStorageKey,
  writeStorageString,
} from "./browserStorage";
import {
  isRecord,
  isValidFamily,
  readStoredSelectedMode,
  readStoredSplitMode,
  normalizeFamily,
  type StoredFamily,
} from "./validators";

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
  updatedAt: string;
}

export interface SaveEventDraftInput {
  eventData: EventData;
  selectedMode: SplitMode;
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
    updatedAt,
  } = value;

  // Borradores anteriores a V1.3 pueden traer "por familia" y la aceptación
  // de la sugerencia (que ya no existe y se ignora).
  const storedSelectedMode = readStoredSelectedMode(selectedMode);
  const storedSplitMode = readStoredSplitMode(splitMode);

  if (version !== DRAFT_VERSION) return null;
  if (typeof eventName !== "string") return null;
  if (typeof currency !== "string" || currency.trim() === "") return null;
  if (!Array.isArray(families) || !families.every(isValidFamily)) return null;
  if (storedSelectedMode === undefined) return null;
  if (storedSplitMode === undefined) return null;
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
    // Borradores viejos pueden traer integrantes sin distinguir adultos de
    // menores, monto en una familia sin adultos o la nota libre previa al
    // desglose: normalizeFamily los pone al día.
    families: (families as StoredFamily[]).map(normalizeFamily),
    selectedMode: storedSelectedMode,
    splitMode: storedSplitMode,
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
  createdAt,
}: SaveEventDraftInput): string {
  return JSON.stringify([
    eventData.eventName,
    eventData.currency,
    eventData.splitMode,
    eventData.families,
    selectedMode,
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
    updatedAt: new Date().toISOString(),
  };

  return writeStorageString(CURRENT_DRAFT_STORAGE_KEY, JSON.stringify(draft))
    ? draft
    : null;
}

export function clearCurrentEventDraft(): boolean {
  return removeStorageKey(CURRENT_DRAFT_STORAGE_KEY);
}
