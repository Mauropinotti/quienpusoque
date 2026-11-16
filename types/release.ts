/** Una versión publicada de la app, para la sección "Versiones" de la landing. */
export interface Release {
  /** "1.2": mayor.menor, igual que `package.json`. */
  version: string;
  /** Mes de publicación, "2026-11". */
  month: string;
  title: string;
  /** Qué cambió, en lenguaje de usuario. */
  changes: string[];
}
