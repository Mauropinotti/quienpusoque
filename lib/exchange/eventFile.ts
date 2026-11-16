import type { EventData, EventExportFile, EventSnapshot } from "@/types/event";
import type { Family, SplitMode } from "@/types/family";
import { buildEventFileName } from "@/lib/formatting/fileName";
import {
  isRecord,
  isSplitMode,
  isValidDate,
  isValidFamily,
  normalizeFamily,
} from "@/lib/storage/validators";

// Exportar / importar el cálculo en curso como un archivo .json, para
// retomarlo en otro momento o en otro dispositivo. Todo pasa en el navegador:
// el archivo lo guarda y lo elige el usuario; la app no sube nada.

export const EVENT_FILE_FORMAT: EventExportFile["format"] = "quien-puso-que/calculo";
export const EVENT_FILE_VERSION: EventExportFile["version"] = 2;
/** Versiones que se pueden importar. La 1 guardaba integrantes sin separar adultos y menores. */
const READABLE_FILE_VERSIONS = new Set([1, 2]);
export const EVENT_FILE_EXTENSION = "json";
export const EVENT_FILE_MIME_TYPE = "application/json";
export const EVENT_FILE_ACCEPT = ".json,application/json";

/** Un cálculo real pesa pocos KB. El tope frena archivos equivocados. */
export const MAX_EVENT_FILE_BYTES = 1_000_000;
const MAX_IMPORTED_FAMILIES = 200;

export const IMPORT_ERRORS = {
  notAnEventFile: "Ese archivo no es un cálculo de ¿Quién puso qué?. Elegí el .json que exportaste.",
  tooLarge: "El archivo es demasiado grande para ser un cálculo. Elegí el .json que exportaste.",
  newerVersion: "El archivo es de una versión más nueva de la app. Recargá la página y probá de nuevo.",
  damaged: "El archivo está dañado o incompleto. No se cargó nada.",
  unreadable: "No se pudo leer el archivo. Probá de nuevo.",
} as const;

export type EventImportResult =
  | { ok: true; event: EventSnapshot }
  | { ok: false; error: string };

interface SnapshotSource {
  eventData: EventData;
  selectedMode: SplitMode;
  recommendationAccepted: boolean | null;
  createdAt: string;
}

export function buildEventSnapshot({
  eventData,
  selectedMode,
  recommendationAccepted,
  createdAt,
}: SnapshotSource): EventSnapshot {
  return {
    eventName: eventData.eventName,
    currency: eventData.currency,
    createdAt,
    splitMode: eventData.splitMode,
    selectedMode,
    recommendationAccepted,
    families: eventData.families,
  };
}

export function buildEventExportFile(
  snapshot: EventSnapshot,
  exportedAt: string
): EventExportFile {
  return {
    format: EVENT_FILE_FORMAT,
    version: EVENT_FILE_VERSION,
    exportedAt,
    event: snapshot,
  };
}

/** JSON con sangría: si alguien lo abre, se entiende qué tiene. */
export function serializeEventExportFile(file: EventExportFile): string {
  return `${JSON.stringify(file, null, 2)}\n`;
}

export function buildEventExportFileName(eventName: string, date: Date): string {
  return buildEventFileName(eventName, date, EVENT_FILE_EXTENSION);
}

/** Una moneda que Intl no conoce rompería todos los montos de la pantalla. */
function isSupportedCurrency(value: unknown): value is string {
  if (typeof value !== "string" || !/^[A-Z]{3}$/.test(value)) return false;
  try {
    new Intl.NumberFormat("es-AR", { style: "currency", currency: value });
    return true;
  } catch {
    return false;
  }
}

function parseFamilies(value: unknown): Family[] | null {
  if (!Array.isArray(value) || value.length > MAX_IMPORTED_FAMILIES) return null;
  if (!value.every(isValidFamily)) return null;

  // Ids repetidos romperían el cruce entre familias y balances.
  const ids = new Set(value.map((family) => family.id));
  if (ids.size !== value.length) return null;

  return value.map(normalizeFamily);
}

function parseSnapshot(value: unknown): EventSnapshot | null {
  if (!isRecord(value)) return null;

  const {
    eventName,
    currency,
    createdAt,
    splitMode,
    selectedMode,
    recommendationAccepted,
    families,
  } = value;

  if (typeof eventName !== "string") return null;
  if (!isSupportedCurrency(currency)) return null;
  if (!isValidDate(createdAt)) return null;
  if (splitMode !== null && !isSplitMode(splitMode)) return null;
  if (!isSplitMode(selectedMode)) return null;
  if (recommendationAccepted !== null && typeof recommendationAccepted !== "boolean") {
    return null;
  }

  const parsedFamilies = parseFamilies(families);
  if (!parsedFamilies) return null;

  return {
    eventName,
    currency,
    createdAt,
    splitMode,
    selectedMode,
    recommendationAccepted,
    families: parsedFamilies,
  };
}

/** Valida todo el archivo antes de tocar el estado: o entra entero o no entra. */
export function parseEventExportFile(text: string): EventImportResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: IMPORT_ERRORS.notAnEventFile };
  }

  if (!isRecord(data) || data.format !== EVENT_FILE_FORMAT) {
    return { ok: false, error: IMPORT_ERRORS.notAnEventFile };
  }
  if (typeof data.version !== "number" || !Number.isInteger(data.version)) {
    return { ok: false, error: IMPORT_ERRORS.damaged };
  }
  if (data.version > EVENT_FILE_VERSION) {
    return { ok: false, error: IMPORT_ERRORS.newerVersion };
  }
  if (!READABLE_FILE_VERSIONS.has(data.version)) {
    return { ok: false, error: IMPORT_ERRORS.damaged };
  }

  const event = parseSnapshot(data.event);
  return event ? { ok: true, event } : { ok: false, error: IMPORT_ERRORS.damaged };
}
