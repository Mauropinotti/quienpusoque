import type { Family, SplitMode } from "./family";

export interface EventData {
  eventName: string;
  currency: string;
  splitMode: SplitMode | null;
  families: Family[];
}
