import type { ClosedEvent } from "@/types/event";
import type { SplitRecommendation } from "@/types/recommendation";
import type { EventFlowState } from "./eventFlow";
import type { Settlement } from "./eventInsights";

interface BuildClosedEventInput {
  id: string;
  closedAt: string;
  state: Pick<EventFlowState, "eventData" | "createdAt">;
  settlement: Settlement;
  recommendation: SplitRecommendation | null;
}

/** Foto final del cálculo confirmado, lista para el historial local. */
export function buildClosedEvent({
  id,
  closedAt,
  state,
  settlement,
  recommendation,
}: BuildClosedEventInput): ClosedEvent {
  return {
    id,
    eventName: state.eventData.eventName.trim() || "Evento sin nombre",
    createdAt: state.createdAt,
    closedAt,
    totalAmount: settlement.totalAmount,
    splitModeUsed: settlement.splitMode,
    familiesSnapshot: state.eventData.families,
    balancesSnapshot: settlement.balances,
    transfersSnapshot: settlement.transfers,
    recommendationSnapshot: recommendation,
  };
}
