# Versiones

El historial que se muestra en la landing sale de `lib/releases.ts`. Al
publicar una versión: agregarla arriba ahí, subir `version` en `package.json`
y sumarla acá.

## Quienpusoque V1.3 · noviembre de 2026 · Reparto por porciones

- Un solo criterio: por persona, por **porciones**. Cada adulto cuenta una
  porción y cada menor la fracción elegida: 1 (100%), ½ (50%) o 0 (0%).
  `precio por porción = total ÷ (adultos + menores × fracción)`; cada adulto
  paga una porción y cada menor su fracción.
- Al 50% un menor paga exactamente la mitad que un adulto (antes, en V1.2,
  pagaba la mitad de la parte igual y la diferencia la absorbían los adultos:
  terminaba pagando menos de la mitad). El caso 1 adulto + 1 menor paga 1,5
  porciones.
- Menores que vinieron solos: "Va a pagar su parte". Si se marca, entran en
  la cuenta con su fracción y en el ticket, el PDF y el WhatsApp aparece
  "Padre/madre o tutor encargado de X le transfiere…"; si no, quedan
  invitados.
- Se quitan la sugerencia automática de criterio y el reparto "por familia".
  Los borradores y archivos con "por familia" piden volver a elegir; el
  historial los sigue mostrando como "por familia".
- Archivo exportado: versión 3 (lee la 1 y la 2).

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
