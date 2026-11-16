# Versiones

El historial que se muestra en la landing sale de `lib/releases.ts`. Al
publicar una versión: agregarla arriba ahí, subir `version` en `package.json`
y sumarla acá.

## Quienpusoque V1.2 · noviembre de 2026 · Cuentas a la vista

- Cada familia carga qué puso y cuánto salió cada cosa; la app suma el total
  (`paidAmount = suma de items`).
- Adultos y menores explícitos. Por persona, los menores pagan el 100%, el 50%
  (lo que no pagan se reparte en partes iguales entre los adultos) o nada.
  Una familia sin adultos no aporta.
- Ticket, PDF y WhatsApp muestran el cálculo paso a paso y la cuenta de cada
  familia.
- Exportar el cálculo en curso a un `.json` e importarlo desde el paso 1.
  Formato del archivo: versión 2 (la 1 se sigue leyendo).
- Los borradores, el historial y los archivos anteriores se migran solos.

## Quienpusoque V1.1 · octubre de 2026 · Landing y rediseño

- Landing estática con ticket de ejemplo calculado en build.
- Rediseño "papel, brasa y carbón", mobile first.
- Rendimiento medido (ver `docs/performance.md`) y accesibilidad 100 en
  Lighthouse.
- Suite E2E con Playwright sobre el build de producción.

## Quienpusoque V1.0 · mayo de 2026 · La primera cuenta

- Familias, elegibilidad, reparto por familia o por persona y recomendación.
- Balances y transferencias mínimas.
- Resumen para WhatsApp y ticket PDF con foto opcional.
- Borrador e historial en `localStorage`.
