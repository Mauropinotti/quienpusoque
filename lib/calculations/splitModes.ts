import type { SplitMode } from "@/types/family";

/** Las tres respuestas a "¿cómo pagan los menores?". Siempre se reparte por persona. */
export const SPLIT_MODES: readonly SplitMode[] = [
  "by-person",
  "by-person-minors-half",
  "by-person-minors-zero",
];

export const DEFAULT_SPLIT_MODE: SplitMode = "by-person";

export function isSplitModeValue(value: unknown): value is SplitMode {
  return typeof value === "string" && (SPLIT_MODES as readonly string[]).includes(value);
}

/** Parte de la cuota por persona que paga cada menor. */
export const MINOR_SHARE_RATIO: Record<SplitMode, number> = {
  "by-person": 1,
  "by-person-minors-half": 0.5,
  "by-person-minors-zero": 0,
};
