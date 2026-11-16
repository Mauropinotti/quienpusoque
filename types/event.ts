import type { Family, LegacySplitMode, SplitMode } from "./family";
import type { FamilyBalance, Transfer } from "./calculation";

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
  /** Las cuentas cerradas antes de V1.3 pueden haber usado "por familia". */
  splitModeUsed: SplitMode | LegacySplitMode;
  familiesSnapshot: Family[];
  balancesSnapshot: FamilyBalance[];
  transfersSnapshot: Transfer[];
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
  families: Family[];
}

/** Archivo `.json` que baja "Exportar cálculo" y lee "Importar cálculo". */
export interface EventExportFile {
  format: "quien-puso-que/calculo";
  /**
   * 3: solo criterios por persona y menores solos que pagan su parte.
   * 2: familias con adultos y menores. 1: con integrantes. Las tres se leen.
   */
  version: 3;
  exportedAt: string;
  event: EventSnapshot;
}
