import type { Release } from "@/types/release";

// Historial de versiones. La primera es la actual: la usan la landing, el pie
// y la sección "Versiones". Al publicar una versión nueva, agregarla arriba y
// subir `version` en package.json (ver CHANGELOG.md).

export const APP_CODENAME = "Quienpusoque";

export const RELEASES: readonly Release[] = [
  {
    version: "1.2",
    month: "2026-11",
    title: "Cuentas a la vista",
    changes: [
      "Cada familia carga qué puso y cuánto salió cada cosa. La app suma el total.",
      "Adultos y menores por separado. Por persona, los menores pagan el 100%, el 50% o nada.",
      "El ticket, el PDF y el WhatsApp muestran el cálculo paso a paso y la cuenta de cada familia.",
      "Exportá el cálculo a un archivo e importalo después para seguir donde lo dejaste.",
    ],
  },
  {
    version: "1.1",
    month: "2026-10",
    title: "Landing y rediseño",
    changes: [
      "Landing nueva, con un ticket de ejemplo calculado con el motor real.",
      "Rediseño “papel, brasa y carbón”, pensado para usar en la mesa con el celular.",
      "Más rápida y accesible: 100 en accesibilidad en Lighthouse.",
      "Pruebas de punta a punta en celular y escritorio.",
    ],
  },
  {
    version: "1.0",
    month: "2026-05",
    title: "La primera cuenta",
    changes: [
      "Carga de familias y reparto por familia o por persona, con recomendación.",
      "Balances y la menor cantidad de transferencias posible.",
      "Resumen para WhatsApp y ticket PDF con foto opcional.",
      "Borrador e historial guardados en el navegador.",
    ],
  },
];

export const CURRENT_RELEASE: Release = RELEASES[0];

/** "Quienpusoque V1.2". */
export function releaseName(release: Release = CURRENT_RELEASE): string {
  return `${APP_CODENAME} V${release.version}`;
}

const monthFormatter = new Intl.DateTimeFormat("es-AR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** "noviembre de 2026". */
export function formatReleaseMonth(release: Release): string {
  return monthFormatter.format(new Date(`${release.month}-01T00:00:00Z`));
}
