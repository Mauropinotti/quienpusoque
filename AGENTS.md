# AGENTS.md - Guía para agentes autónomos

## Proyecto

**¿Quién puso qué?** es una calculadora de gastos compartidos para reuniones y eventos. El MVP resuelve un evento desde el celular: cargar familias, elegir criterio, ver balances, generar transferencias, guardar historial local, copiar WhatsApp y descargar un ticket PDF final.

## Stack actual

- Next.js App Router (`next` 16.2.4 en `package.json`)
- React 19
- TypeScript
- Tailwind CSS v4
- nanoid
- jsPDF para generación estructurada del PDF (carga diferida)
- Vitest (unitarios) y Playwright (E2E)
- Sin backend, sin base de datos, sin autenticación

## Arquitectura

- `app/page.tsx`: landing estática (Server Components).
- `app/calcular/page.tsx`: shell de la calculadora y script anti-flash.
- `components/calculator/CalculatorApp.tsx`: estado global (`useReducer`) y orquestación del flujo.
- `components/landing/`: secciones de la landing.
- `components/`: UI por paso y componentes base.
- `lib/flow/`: reducer puro del flujo, derivados (`deriveEventInsights`, `deriveSettlement`), arranque y evento de ejemplo.
- `lib/forms/`: validación del formulario de familias.
- `lib/image/`: recorte y compresión de la foto del ticket.
- `types/`: contratos TypeScript entre capas.
- `lib/calculations/`: funciones puras de elegibilidad, recomendación, balances, transferencias y suma de lo que puso cada familia (`contributions.ts`).
- `lib/formatting/`: formateo de moneda y porcentajes.
- `lib/text/`: generación de texto para WhatsApp.
- `lib/pdf/`: generación estructurada del ticket PDF final.
- `lib/storage/`: acceso defensivo a `localStorage`.
- `lib/exchange/`: exportar e importar el cálculo en curso como archivo `.json` (validación completa antes de cargar).
- `hooks/`: coordinación cliente, por ejemplo `useEventDraft`.
- `docs/`: documentación funcional y técnica (incluye `docs/performance.md`).
- `tests/`: unitarios. `e2e/`: flujos reales con Playwright. `scripts/perf/`: medición.
- `app/ayuda/page.tsx` y `components/help/`: ayuda visible para usuarios finales.

## Reglas de negocio

- Cada familia declara `adults` y `minors` (0 a 20, al menos una persona).
- Con al menos 1 adulto: aporta, `eligiblePersons = adults + minors`.
- Sin adultos: no aporta, `eligiblePersons = 0`; sus menores no cuentan.
- `by-family`: divide el total por familias que aportan.
- `by-person`: divide el total por adultos + menores, todos iguales.
- `by-person-minors-half`: cada menor paga 50% de la parte por persona; lo que no pagan se reparte en partes iguales entre los adultos.
- `by-person-minors-zero`: divide el total solo entre los adultos.
- Los pasos del reparto (`SplitBreakdown`) se redondean a centavos uno por uno y se muestran iguales en ticket, PDF y WhatsApp (`lib/text/describeSplit.ts`).
- `balance = paidAmount - expectedShare`.
- `paidAmount = suma de items[].amount`: el total lo calcula la app (`lib/calculations/contributions.ts`), nunca se tipea ni se confía en uno guardado.
- El `status` canónico (`receives`, `pays`, `balanced`, `guest`) se calcula en `calculateBalances` y la UI no debe reinterpretarlo.

## Storage local

Borrador actual:

```text
quien-puso-que:current-draft
```

Eventos cerrados:

```text
quien-puso-que:closed-events
```

Reglas:

- Acceder siempre vía `lib/storage/browserStorage.ts`.
- Solo acceder a `localStorage` del lado cliente.
- Validar todo dato recuperado (storage o archivo importado) antes de usarlo.
- No romper SSR ni hydration.
- Si `localStorage` falla, la app debe seguir funcionando.
- No guardar información sensible.

## PDF final

El ticket PDF es la salida final del cálculo. Se genera del lado cliente con `jsPDF` desde `lib/pdf/generateEventTicketPdf.ts`.

Reglas:

- No convertir el PDF en backend.
- No subir fotos.
- No guardar fotos pesadas en `localStorage`.
- La foto opcional se procesa localmente y se usa solo para el PDF actual.
- Preferir generación estructurada a screenshots de UI.
- Actualizar `docs/pdf-ticket.md` ante cambios.

## Qué no debe hacer un agente

- No poner reglas de cálculo dentro de `.tsx`.
- No reinterpretar balances en UI.
- No modificar tipos compartidos sin actualizar consumers y docs.
- No guardar datos fuera de `localStorage`.
- No persistir fotos del ticket sin decisión explícita.
- No agregar dependencias por conveniencia menor.
- No importar jsPDF de forma estática ni meterlo en el bundle inicial.
- No empeorar las métricas de `docs/performance.md` sin medir y justificar.
- No presentar roadmap como funcionalidad hecha.
- No convertir la ayuda en documentación técnica ni duplicar lógica de cálculo.

## Documentación a actualizar ante cambios

- Fórmulas: `README.md`, `docs/calculation-model.md`, `docs/examples.md`.
- Recomendación: `README.md`, `docs/recommendation-criteria.md`.
- Flujo o UI: `README.md`, `docs/ux-flow.md`.
- Rendimiento: `docs/performance.md`.
- Storage o formato del archivo exportado: `README.md`, `docs/ux-flow.md`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`.
- PDF: `README.md`, `docs/pdf-ticket.md`, `docs/ux-flow.md`, `docs/examples.md`.
- Ayuda de usuario: `README.md`, `docs/ux-flow.md`, `components/help/`.

## Ejecutar

```bash
npm install
npm run dev
```

Verificar:

```bash
npm test
npm run lint
npm run build
npm run test:e2e
```
