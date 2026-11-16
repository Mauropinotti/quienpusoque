import type { SplitBasis, SplitMode } from "@/types/family";

export const SPLIT_MODES: readonly SplitMode[] = [
  "by-family",
  "by-person",
  "by-person-minors-half",
  "by-person-minors-zero",
];

/** Las tres respuestas a "¿cómo pagan los menores?" cuando se reparte por persona. */
export const PERSON_SPLIT_MODES = [
  "by-person",
  "by-person-minors-half",
  "by-person-minors-zero",
] as const satisfies readonly SplitMode[];

export type PersonSplitMode = (typeof PERSON_SPLIT_MODES)[number];

export function isSplitModeValue(value: unknown): value is SplitMode {
  return typeof value === "string" && (SPLIT_MODES as readonly string[]).includes(value);
}

export function isPersonSplitMode(mode: SplitMode): mode is PersonSplitMode {
  return mode !== "by-family";
}

/** Por familia o por persona, sin importar cómo pagan los menores. */
export function getSplitBasis(mode: SplitMode): SplitBasis {
  return isPersonSplitMode(mode) ? "by-person" : "by-family";
}

/** Parte de la cuota por persona que paga cada menor. */
export const MINOR_SHARE_RATIO: Record<PersonSplitMode, number> = {
  "by-person": 1,
  "by-person-minors-half": 0.5,
  "by-person-minors-zero": 0,
};
