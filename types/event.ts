import type { Family, SplitMode } from "./family";
import type { FamilyBalance, Transfer } from "./calculation";
import type { SplitRecommendation } from "./recommendation";

export interface EventData {
  eventName: string;
  currency: string;
  splitMode: SplitMode | null;
  families: Family[];
}

export interface ClosedEvent {
  id: string;
  eventName: string;
  createdAt: string;
  closedAt: string;
  totalAmount: number;
  splitModeUsed: SplitMode;
  familiesSnapshot: Family[];
  balancesSnapshot: FamilyBalance[];
  transfersSnapshot: Transfer[];
  recommendationSnapshot: SplitRecommendation | null;
  optionalNote?: string;
}
