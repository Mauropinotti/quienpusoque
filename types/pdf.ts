import type { FamilyBalance, Transfer } from "./calculation";
import type { Family, SplitMode } from "./family";
import type { SplitRecommendation } from "./recommendation";

export interface EventTicketPhoto {
  dataUrl: string;
  name: string;
  type: string;
  size: number;
}

export interface EventTicketPdfData {
  appName: string;
  eventName: string;
  currency: string;
  generatedAt: Date;
  splitMode: SplitMode;
  families: Family[];
  balances: FamilyBalance[];
  transfers: Transfer[];
  recommendation: SplitRecommendation | null;
  photo?: EventTicketPhoto | null;
}
