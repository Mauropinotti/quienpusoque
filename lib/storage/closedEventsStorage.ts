import type { FamilyBalance, Transfer } from "@/types/calculation";
import type { ClosedEvent } from "@/types/event";
import type {
  RecommendationConfidence,
  RecommendationMetrics,
  SplitRecommendation,
} from "@/types/recommendation";
import {
  getBrowserStorage,
  readStorageJson,
  writeStorageString,
} from "./browserStorage";
import {
  isRecord,
  isSplitMode,
  isValidDate,
  isValidFamily,
} from "./validators";

export const CLOSED_EVENTS_STORAGE_KEY = "quien-puso-que:closed-events";

const STORAGE_VERSION = 1;
const MAX_CLOSED_EVENTS = 50;

interface ClosedEventsPayload {
  version: typeof STORAGE_VERSION;
  events: ClosedEvent[];
}

export interface SaveClosedEventResult {
  saved: boolean;
  events: ClosedEvent[];
}

function isConfidence(value: unknown): value is RecommendationConfidence {
  return value === "low" || value === "medium" || value === "high";
}

function isValidBalance(value: unknown): value is FamilyBalance {
  if (!isRecord(value)) return false;

  const {
    familyId,
    name,
    paidAmount,
    expectedShare,
    balance,
    status,
    isEligibleToPay,
    eligiblePersons,
  } = value;

  return (
    typeof familyId === "string" &&
    familyId.trim() !== "" &&
    typeof name === "string" &&
    name.trim() !== "" &&
    typeof paidAmount === "number" &&
    Number.isFinite(paidAmount) &&
    typeof expectedShare === "number" &&
    Number.isFinite(expectedShare) &&
    typeof balance === "number" &&
    Number.isFinite(balance) &&
    (status === "pays" ||
      status === "receives" ||
      status === "balanced" ||
      status === "guest") &&
    typeof isEligibleToPay === "boolean" &&
    typeof eligiblePersons === "number" &&
    Number.isInteger(eligiblePersons) &&
    eligiblePersons >= 0
  );
}

function isValidTransfer(value: unknown): value is Transfer {
  if (!isRecord(value)) return false;

  const {
    fromFamilyId,
    fromFamilyName,
    toFamilyId,
    toFamilyName,
    amount,
  } = value;

  return (
    typeof fromFamilyId === "string" &&
    fromFamilyId.trim() !== "" &&
    typeof fromFamilyName === "string" &&
    fromFamilyName.trim() !== "" &&
    typeof toFamilyId === "string" &&
    toFamilyId.trim() !== "" &&
    typeof toFamilyName === "string" &&
    toFamilyName.trim() !== "" &&
    typeof amount === "number" &&
    Number.isFinite(amount) &&
    amount >= 0
  );
}

function isValidMetrics(value: unknown): value is RecommendationMetrics {
  if (!isRecord(value)) return false;

  return [
    value.eligibleFamilies,
    value.eligiblePersons,
    value.singleAdultFamilyRatio,
    value.largeFamilyRatio,
    value.averageFamilySize,
    value.averageImpactBetweenModes,
    value.maxImpactBetweenModes,
  ].every((metric) => typeof metric === "number" && Number.isFinite(metric));
}

function isValidRecommendation(value: unknown): value is SplitRecommendation {
  if (!isRecord(value)) return false;

  const { recommendedMode, confidence, reasons, metrics } = value;

  return (
    isSplitMode(recommendedMode) &&
    isConfidence(confidence) &&
    Array.isArray(reasons) &&
    reasons.every((reason) => typeof reason === "string") &&
    isValidMetrics(metrics)
  );
}

function isValidClosedEvent(value: unknown): value is ClosedEvent {
  if (!isRecord(value)) return false;

  const {
    id,
    eventName,
    createdAt,
    closedAt,
    totalAmount,
    splitModeUsed,
    familiesSnapshot,
    balancesSnapshot,
    transfersSnapshot,
    recommendationSnapshot,
    optionalNote,
  } = value;

  return (
    typeof id === "string" &&
    id.trim() !== "" &&
    typeof eventName === "string" &&
    eventName.trim() !== "" &&
    isValidDate(createdAt) &&
    isValidDate(closedAt) &&
    typeof totalAmount === "number" &&
    Number.isFinite(totalAmount) &&
    totalAmount >= 0 &&
    isSplitMode(splitModeUsed) &&
    Array.isArray(familiesSnapshot) &&
    familiesSnapshot.every(isValidFamily) &&
    Array.isArray(balancesSnapshot) &&
    balancesSnapshot.every(isValidBalance) &&
    Array.isArray(transfersSnapshot) &&
    transfersSnapshot.every(isValidTransfer) &&
    (recommendationSnapshot === null ||
      isValidRecommendation(recommendationSnapshot)) &&
    (optionalNote === undefined || typeof optionalNote === "string")
  );
}

function parsePayload(value: unknown): ClosedEvent[] {
  if (!isRecord(value)) return [];

  const { version, events } = value;

  if (version !== STORAGE_VERSION) return [];
  if (!Array.isArray(events)) return [];

  return events.filter(isValidClosedEvent);
}

function sortByClosedAt(events: ClosedEvent[]): ClosedEvent[] {
  return [...events].sort((a, b) => b.closedAt.localeCompare(a.closedAt));
}

function writeClosedEvents(events: ClosedEvent[]): boolean {
  const payload: ClosedEventsPayload = {
    version: STORAGE_VERSION,
    events: events.slice(0, MAX_CLOSED_EVENTS),
  };

  return writeStorageString(CLOSED_EVENTS_STORAGE_KEY, JSON.stringify(payload));
}

// ── Store en memoria ──────────────────────────────────────────────────────────
//
// El historial se lee y valida una sola vez; después vive en memoria y los
// componentes se suscriben con useSyncExternalStore. Antes, cada guardado
// releía y revalidaba todo el historial dos veces (al guardar y al refrescar
// la lista).

const EMPTY_EVENTS: ClosedEvent[] = [];
let cachedEvents: ClosedEvent[] | null = null;
let cachedFor: Storage | null = null;
const listeners = new Set<() => void>();

function setCachedEvents(events: ClosedEvent[]) {
  cachedEvents = events;
  cachedFor = getBrowserStorage();
  listeners.forEach((listener) => listener());
}

function handleStorageEvent(event: StorageEvent) {
  // Otra pestaña modificó el historial: invalidar y releer.
  if (event.key !== null && event.key !== CLOSED_EVENTS_STORAGE_KEY) return;
  setCachedEvents(readClosedEvents());
}

export function subscribeToClosedEvents(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1 && typeof window !== "undefined") {
    window.addEventListener("storage", handleStorageEvent);
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorageEvent);
    }
  };
}

export function getClosedEventsSnapshot(): ClosedEvent[] {
  const storage = getBrowserStorage();
  if (cachedEvents === null || cachedFor !== storage) {
    cachedEvents = storage ? readClosedEvents() : EMPTY_EVENTS;
    cachedFor = storage;
  }
  return cachedEvents;
}

export function getServerClosedEventsSnapshot(): ClosedEvent[] {
  return EMPTY_EVENTS;
}

/** Solo para tests: fuerza a releer el storage en el próximo snapshot. */
export function resetClosedEventsCache() {
  cachedEvents = null;
  cachedFor = null;
}

// ── API pública ───────────────────────────────────────────────────────────────

/** Lectura directa del storage, siempre validada. */
export function readClosedEvents(): ClosedEvent[] {
  return sortByClosedAt(
    parsePayload(readStorageJson(CLOSED_EVENTS_STORAGE_KEY))
  );
}

export function saveClosedEvent(event: ClosedEvent): SaveClosedEventResult {
  const currentEvents = getClosedEventsSnapshot();
  if (!isValidClosedEvent(event)) {
    return { saved: false, events: currentEvents };
  }

  const nextEvents = [
    event,
    ...currentEvents.filter((currentEvent) => currentEvent.id !== event.id),
  ].slice(0, MAX_CLOSED_EVENTS);

  if (!writeClosedEvents(nextEvents)) {
    return { saved: false, events: currentEvents };
  }

  setCachedEvents(nextEvents);
  return { saved: true, events: nextEvents };
}

export function deleteClosedEvent(eventId: string): ClosedEvent[] {
  const currentEvents = getClosedEventsSnapshot();
  if (eventId.trim() === "") return currentEvents;

  const nextEvents = currentEvents.filter((event) => event.id !== eventId);
  if (writeClosedEvents(nextEvents)) setCachedEvents(nextEvents);
  return getClosedEventsSnapshot();
}

export function clearClosedEvents(): ClosedEvent[] {
  if (writeClosedEvents([])) setCachedEvents(EMPTY_EVENTS);
  return getClosedEventsSnapshot();
}
