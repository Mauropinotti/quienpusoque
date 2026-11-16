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

/** Cálculo en curso, tal como se exporta a un archivo para retomarlo después. */
export interface EventSnapshot {
  eventName: string;
  currency: string;
  createdAt: string;
  /** Criterio confirmado (null si todavía no se eligió). */
  splitMode: SplitMode | null;
  /** Criterio marcado en pantalla, aunque no esté confirmado. */
  selectedMode: SplitMode;
  recommendationAccepted: boolean | null;
  families: Family[];
}

/** Archivo `.json` que baja "Exportar cálculo" y lee "Importar cálculo". */
export interface EventExportFile {
  format: "quien-puso-que/calculo";
  /** 2: familias con adultos y menores. 1: con integrantes (se sigue leyendo). */
  version: 2;
  exportedAt: string;
  event: EventSnapshot;
}
