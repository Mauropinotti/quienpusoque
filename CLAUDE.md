# CLAUDE.md - Guía para agentes de código

## Proyecto

**¿Quién puso qué?** distribuye gastos compartidos de eventos chicos. Corre en el navegador: sin backend, sin base de datos y sin autenticación.

## Regla principal

La lógica de negocio **no va en componentes React**. Las reglas viven en `lib/` y los contratos en `types/`.

## Arquitectura

```text
app/page.tsx                estado global y flujo
components/event/           setup y foto opcional
components/families/        alta, edición, eliminación y listado
components/recommendation/  recomendación y selector de criterio
components/results/         resumen, PDF, WhatsApp, historial
components/help/            ayuda visible para usuarios finales
components/ui/              Button, Input, Card, Badge
hooks/                      hooks cliente
lib/calculations/           funciones puras de cálculo
lib/formatting/             moneda y porcentaje
lib/storage/                localStorage defensivo
lib/text/                   texto para WhatsApp
lib/pdf/                    ticket PDF final
types/                      contratos compartidos
docs/                       documentación técnica y de producto
```

## Flujo de datos

```text
app/page.tsx
  -> computeAllEligibility()
  -> recommendSplitMode()
  -> calculateBalances()
  -> calculateTransfers()
  -> componentes por props
```

## Reglas clave

- 1 adulto aporta.
- 1 menor no aporta.
- 2 o más integrantes aportan.
- `by-family`: partes iguales por familia habilitada.
- `by-person`: partes iguales por persona habilitada.
- `balance = paidAmount - expectedShare`.
- `status` lo calcula `calculateBalances`; la UI no lo recalcula.

## localStorage

El borrador actual usa `quien-puso-que:current-draft`.

El historial cerrado usa `quien-puso-que:closed-events`.

Todo acceso debe ser cliente, defensivo y validado. Si storage falla, la app sigue funcionando.

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

## Verificación

```bash
npm test
npm run lint
npm run build
```
