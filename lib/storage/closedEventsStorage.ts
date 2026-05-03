import type { FamilyBalance, Transfer } from "@/types/calculation";
import type { ClosedEvent } from "@/types/event";
import type { Family, SingleMemberType, SplitMode } from "@/types/family";
import type {
  RecommendationConfidence,
  RecommendationMetrics,
  SplitRecommendation,
} from "@/types/recommendation";

export const CLOSED_EVENTS_STORAGE_KEY = "quien-puso-que:closed-events";

const STORAGE_VERSION = 1;
const MAX_CLOSED_EVENTS = 50;

interface ClosedEventsPayload {
  version: typeof STORAGE_VERSION;
  events: ClosedEvent[];
}

function canUseLocalStorage(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const testKey = `${CLOSED_EVENTS_STORAGE_KEY}:test`;
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

function isConfidence(value: unknown): value is RecommendationConfidence {
  return value === "low" || value === "medium" || value === "high";
}

function isValidDate(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
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

function writeClosedEvents(events: ClosedEvent[]): boolean {
  if (!canUseLocalStorage()) return false;

  const payload: ClosedEventsPayload = {
    version: STORAGE_VERSION,
    events: events.slice(0, MAX_CLOSED_EVENTS),
  };

  try {
    window.localStorage.setItem(
      CLOSED_EVENTS_STORAGE_KEY,
      JSON.stringify(payload)
    );
    return true;
  } catch {
    return false;
  }
}

export function readClosedEvents(): ClosedEvent[] {
  if (!canUseLocalStorage()) return [];

  try {
    const raw = window.localStorage.getItem(CLOSED_EVENTS_STORAGE_KEY);
    if (!raw) return [];
    return parsePayload(JSON.parse(raw)).sort((a, b) =>
      b.closedAt.localeCompare(a.closedAt)
    );
  } catch {
    return [];
  }
}

export function saveClosedEvent(event: ClosedEvent): ClosedEvent[] {
  if (!isValidClosedEvent(event)) return readClosedEvents();

  const currentEvents = readClosedEvents();
  const nextEvents = [
    event,
    ...currentEvents.filter((currentEvent) => currentEvent.id !== event.id),
  ].slice(0, MAX_CLOSED_EVENTS);

  writeClosedEvents(nextEvents);
  return nextEvents;
}

export function deleteClosedEvent(eventId: string): ClosedEvent[] {
  if (eventId.trim() === "") return readClosedEvents();

  const nextEvents = readClosedEvents().filter((event) => event.id !== eventId);
  writeClosedEvents(nextEvents);
  return nextEvents;
}
