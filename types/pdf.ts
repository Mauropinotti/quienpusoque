import type { FamilyBalance, SplitBreakdown, Transfer } from "./calculation";
import type { Family, SplitMode } from "./family";

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
  /** Los pasos del cálculo, para mostrarlos tal cual. */
  breakdown: SplitBreakdown;
  photo?: EventTicketPhoto | null;
}
