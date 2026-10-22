import type { EventData } from "@/types/event";
import type { Family, SplitMode } from "@/types/family";
import type { EventTicketPhoto } from "@/types/pdf";
import type { LocalEventDraft } from "@/lib/storage/localEventStorage";
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
  | { type: "recommendation-opened"; recommendedMode: SplitMode }
  | { type: "mode-selected"; mode: SplitMode }
  | { type: "mode-confirmed"; recommendedMode: SplitMode | null }
  | { type: "closed-event-saved"; id: string }
  | { type: "closed-event-save-failed"; message: string }
  | { type: "ticket-photo-changed"; photo: EventTicketPhoto | null }
  | { type: "demo-loaded"; now: string }
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

export function createFlowStateFromDraft(
  draft: LocalEventDraft
): EventFlowState {
  return {
    ...createEmptyFlowState(draft.createdAt),
    step: getStepFromDraft(draft),
    eventData: {
      eventName: draft.eventName,
      currency: draft.currency,
      splitMode: draft.splitMode,
      families: draft.families,
    },
    selectedMode: draft.selectedMode,
    recommendationAccepted: draft.recommendationAccepted,
  };
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
        selectedMode: action.recommendedMode,
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
        recommendationAccepted: action.recommendedMode
          ? state.selectedMode === action.recommendedMode
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

    case "reset":
      return createEmptyFlowState(action.now);
  }
}
