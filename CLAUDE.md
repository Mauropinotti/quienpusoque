# CLAUDE.md - Guía para agentes de código

## Proyecto

**¿Quién puso qué?** distribuye gastos compartidos de eventos chicos. Corre en el navegador: sin backend, sin base de datos y sin autenticación.

## Regla principal

La lógica de negocio **no va en componentes React**. Las reglas viven en `lib/` y los contratos en `types/`. Esto incluye validación de formularios (`lib/forms/`) y transiciones del flujo (`lib/flow/`).

## Arquitectura

```text
app/page.tsx                landing (Server Components, sin JS propio)
app/calcular/page.tsx       shell estático de la calculadora + script anti-flash
app/ayuda/page.tsx          ayuda (Server Component)
app/fonts/                  subset propio de Bricolage Grotesque (OFL)
components/landing/         secciones de la landing
components/calculator/      CalculatorApp (estado y flujo), fallback, stepper
components/layout/          header, footer, marca
components/event/           setup y foto opcional
components/families/        alta, edición, eliminación y listado
components/recommendation/  recomendación y selector de criterio
components/results/         ticket (SettlementTicket), PDF, WhatsApp
components/history/         historial de cuentas cerradas
components/help/            ayuda visible para usuarios finales
components/ui/              Button, ButtonLink, Input, Card, Badge, íconos
hooks/                      hooks cliente (persistencia del borrador)
lib/calculations/           funciones puras de cálculo
lib/flow/                   reducer del flujo, derivados, arranque, demo
lib/forms/                  validación del formulario de familias
lib/image/                  preparación de la foto del ticket
lib/formatting/             moneda y porcentaje
lib/storage/                localStorage defensivo
lib/text/                   texto para WhatsApp
lib/pdf/                    ticket PDF final
types/                      contratos compartidos
tests/                      tests unitarios (Vitest)
e2e/                        tests E2E (Playwright) sobre el build
scripts/perf/               medición de red y renders
docs/                       documentación técnica y de producto
```

## Flujo de datos

```text
components/calculator/CalculatorApp.tsx
  useReducer(eventFlowReducer)            lib/flow/eventFlow.ts
  deriveEventInsights(families)           elegibilidad + recomendación
  deriveSettlement(families, mode)        calculateBalances + calculateTransfers
  -> componentes por props (memo, callbacks estables con dispatch)
```

## Reglas clave

- 1 adulto aporta.
- 1 menor no aporta.
- 2 o más integrantes aportan.
- `by-family`: partes iguales por familia habilitada.
- `by-person`: partes iguales por persona habilitada.
- `balance = paidAmount - expectedShare`.
- `status` lo calcula `calculateBalances`; la UI no lo recalcula.

## Rendimiento

- Derivados en `useMemo` con dependencias exactas; no depender de `eventData` completo.
- Callbacks con `dispatch`; componentes de lista y pasos con `memo`.
- Recomendación, resultados e historial se cargan con `next/dynamic`.
- jsPDF solo con `import()` dinámico; nunca importarlo desde la UI.
- Medir antes y después: `docs/performance.md`.

## localStorage

El borrador actual usa `quien-puso-que:current-draft`.

El historial cerrado usa `quien-puso-que:closed-events`.

Todo acceso debe ser cliente, defensivo y validado. Si storage falla, la app sigue funcionando.

Usar siempre `lib/storage/browserStorage.ts` (sondeo cacheado). El borrador se escribe con debounce desde `hooks/useEventDraft.ts`; el historial vive en un store en memoria (`useSyncExternalStore`).

## PDF final

El ticket PDF se genera con `jsPDF` en `lib/pdf/generateEventTicketPdf.ts`.

Reglas:

- No backend para PDF.
- No subir fotos.
- No guardar fotos pesadas en `localStorage`.
- La foto opcional se procesa en el navegador y se usa solo para el PDF actual.
- Mantener generación estructurada, no screenshots.
- Si cambia el PDF, actualizar `docs/pdf-ticket.md`.

## Qué no hacer

- No meter fórmulas en componentes.
- No acceder a `localStorage` durante SSR.
- No usar datos recuperados de storage sin validar.
- No cambiar `types/` sin actualizar consumers.
- No persistir imágenes del ticket en historial sin decisión explícita.
- No poner lógica de cálculo dentro de la ayuda; solo describe el funcionamiento.
- No cambiar el tono a corporativo rígido: la app es cálida, clara y argentina.
- No usar texto blanco sobre `ember`: no pasa contraste. Sobre brasa va `ink`.

## Verificación

```bash
npm test
npm run lint
npm run build
npm run test:e2e   # levanta el build; PLAYWRIGHT_CHROMIUM_PATH si ya hay Chromium
```
