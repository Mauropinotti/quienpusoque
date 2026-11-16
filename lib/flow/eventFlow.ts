import type { EventData, EventSnapshot } from "@/types/event";
import type { Family, SplitBasis, SplitMode } from "@/types/family";
import type { EventTicketPhoto } from "@/types/pdf";
import type { LocalEventDraft } from "@/lib/storage/localEventStorage";
import { getSplitBasis, isPersonSplitMode } from "@/lib/calculations/splitModes";
import { DEMO_EVENT_NAME, DEMO_FAMILIES } from "./demoEvent";

/**
 * Máquina de estados del flujo de cálculo. Es un reducer puro: no lee
 * storage, no genera ids ni fechas (llegan en la acción). La página solo
 * despacha acciones y deriva datos con `lib/flow/eventInsights.ts`.
 */

export type FlowStep = "setup" | "families" | "recommendation" | "results";

export const FLOW_STEPS: FlowStep[] = [
  "setup",
  "families",
  "recommendation",
  "results",
];

export interface EventFlowState {
  step: FlowStep;
  eventData: EventData;
  createdAt: string;
  /** Criterio elegido en pantalla (puede no estar confirmado). */
  selectedMode: SplitMode;
  recommendationAccepted: boolean | null;
  savedClosedEventId: string | null;
  historySaveError: string;
  /** Foto opcional del ticket. Solo en memoria: nunca se persiste. */
  ticketPhoto: EventTicketPhoto | null;
}

export type EventFlowAction =
  | { type: "event-renamed"; name: string }
  | { type: "step-changed"; step: FlowStep }
  | { type: "family-added"; family: Family }
  | { type: "family-updated"; family: Family }
  | { type: "family-removed"; id: string }
  | { type: "recommendation-opened"; recommendedMode: SplitBasis }
  | { type: "mode-selected"; mode: SplitMode }
  | { type: "mode-confirmed"; recommendedMode: SplitBasis | null }
  | { type: "closed-event-saved"; id: string }
  | { type: "closed-event-save-failed"; message: string }
  | { type: "ticket-photo-changed"; photo: EventTicketPhoto | null }
  | { type: "demo-loaded"; now: string }
  /** Cálculo leído de un archivo exportado (ya validado en lib/exchange). */
  | { type: "event-imported"; event: EventSnapshot }
  | { type: "reset"; now: string };

export const EMPTY_EVENT_DATA: EventData = {
  eventName: "",
  currency: "ARS",
  splitMode: null,
  families: [],
};

export function createEmptyFlowState(now: string): EventFlowState {
  return {
    step: "setup",
    eventData: EMPTY_EVENT_DATA,
    createdAt: now,
    selectedMode: "by-family",
    recommendationAccepted: null,
    savedClosedEventId: null,
    historySaveError: "",
    ticketPhoto: null,
  };
}

export function getStepFromDraft(draft: LocalEventDraft): FlowStep {
  if (draft.splitMode && draft.families.length >= 2) return "results";
  if (draft.families.length > 0) return "families";
  return "setup";
}

function createFlowStateFromSnapshot(
  snapshot: EventSnapshot,
  step: FlowStep
): EventFlowState {
  return {
    ...createEmptyFlowState(snapshot.createdAt),
    step,
    eventData: {
      eventName: snapshot.eventName,
      currency: snapshot.currency,
      splitMode: snapshot.splitMode,
      families: snapshot.families,
    },
    selectedMode: snapshot.selectedMode,
    recommendationAccepted: snapshot.recommendationAccepted,
  };
}

export function createFlowStateFromDraft(
  draft: LocalEventDraft
): EventFlowState {
  return createFlowStateFromSnapshot(draft, getStepFromDraft(draft));
}

/**
 * Un cálculo importado se retoma en la carga de familias: ahí se ve todo lo
 * que trajo el archivo y se puede seguir sumando gente o cosas.
 */
export function getStepFromImport(event: EventSnapshot): FlowStep {
  return event.families.length > 0 || event.eventName.trim() !== ""
    ? "families"
    : "setup";
}

export function createDemoFlowState(now: string): EventFlowState {
  return {
    ...createEmptyFlowState(now),
    step: "families",
    eventData: {
      ...EMPTY_EVENT_DATA,
      eventName: DEMO_EVENT_NAME,
      families: DEMO_FAMILIES,
    },
  };
}

/** Cualquier cambio en familias invalida lo que dependía del cálculo anterior. */
function withFamilies(
  state: EventFlowState,
  families: Family[]
): EventFlowState {
  return {
    ...state,
    eventData: { ...state.eventData, families },
    recommendationAccepted: null,
    savedClosedEventId: null,
    historySaveError: "",
    ticketPhoto: null,
  };
}

export function eventFlowReducer(
  state: EventFlowState,
  action: EventFlowAction
): EventFlowState {
  switch (action.type) {
    case "event-renamed":
      if (action.name === state.eventData.eventName) return state;
      return {
        ...state,
        eventData: { ...state.eventData, eventName: action.name },
      };

    case "step-changed":
      if (action.step === state.step) return state;
      return { ...state, step: action.step };

    case "family-added":
      return withFamilies(state, [...state.eventData.families, action.family]);

    case "family-updated":
      return withFamilies(
        state,
        state.eventData.families.map((family) =>
          family.id === action.family.id ? action.family : family
        )
      );

    case "family-removed":
      return withFamilies(
        state,
        state.eventData.families.filter((family) => family.id !== action.id)
      );

    case "recommendation-opened":
      return {
        ...state,
        step: "recommendation",
        // Si sugiere por persona y ya habían elegido cómo pagan los menores,
        // se respeta esa elección.
        selectedMode:
          action.recommendedMode === "by-person" && isPersonSplitMode(state.selectedMode)
            ? state.selectedMode
            : action.recommendedMode,
        recommendationAccepted: null,
      };

    case "mode-selected":
      if (action.mode === state.selectedMode) return state;
      return {
        ...state,
        selectedMode: action.mode,
        recommendationAccepted: null,
      };

    case "mode-confirmed":
      return {
        ...state,
        step: "results",
        eventData: { ...state.eventData, splitMode: state.selectedMode },
        // Se acepta la sugerencia si coincide la base (familia o persona):
        // cuánto pagan los menores es una decisión aparte del grupo.
        recommendationAccepted: action.recommendedMode
          ? getSplitBasis(state.selectedMode) === action.recommendedMode
          : null,
        savedClosedEventId: null,
        historySaveError: "",
      };

    case "closed-event-saved":
      return {
        ...state,
        savedClosedEventId: action.id,
        historySaveError: "",
      };

    case "closed-event-save-failed":
      return { ...state, historySaveError: action.message };

    case "ticket-photo-changed":
      return { ...state, ticketPhoto: action.photo };

    case "demo-loaded": {
      const demo = createDemoFlowState(action.now);
      return {
        ...demo,
        eventData: { ...demo.eventData, currency: state.eventData.currency },
      };
    }

    case "event-imported":
      return createFlowStateFromSnapshot(action.event, getStepFromImport(action.event));

    case "reset":
      return createEmptyFlowState(action.now);
  }
}
