# AGENTS.md - Guía para agentes autónomos

## Proyecto

**¿Quién puso qué?** es una calculadora de gastos compartidos para reuniones y eventos. El MVP resuelve un evento desde el celular: cargar familias, elegir criterio, ver balances, generar transferencias, guardar historial local, copiar WhatsApp y descargar un ticket PDF final.

## Stack actual

- Next.js App Router (`next` 16.2.4 en `package.json`)
- React 19
- TypeScript
- Tailwind CSS v4
- nanoid
- jsPDF para generación estructurada del PDF
- Sin backend, sin base de datos, sin autenticación

## Arquitectura

- `app/page.tsx`: estado global y orquestación del flujo.
- `components/`: UI por paso y componentes base.
- `types/`: contratos TypeScript entre capas.
- `lib/calculations/`: funciones puras de elegibilidad, recomendación, balances y transferencias.
- `lib/formatting/`: formateo de moneda y porcentajes.
- `lib/text/`: generación de texto para WhatsApp.
- `lib/pdf/`: generación estructurada del ticket PDF final.
- `lib/storage/`: acceso defensivo a `localStorage`.
- `hooks/`: coordinación cliente, por ejemplo `useEventDraft`.
- `docs/`: documentación funcional y técnica.
- `app/ayuda/page.tsx` y `components/help/`: ayuda visible para usuarios finales.

## Reglas de negocio

- 1 adulto: aporta, `eligiblePersons = 1`.
- 1 menor: no aporta, `eligiblePersons = 0`.
- 2 o más integrantes: aporta, `eligiblePersons = members`.
- `by-family`: divide el total por familias habilitadas.
- `by-person`: divide el total por personas habilitadas.
- `balance = paidAmount - expectedShare`.
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

- Solo acceder a `localStorage` del lado cliente.
- Validar todo dato recuperado antes de usarlo.
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
- No presentar roadmap como funcionalidad hecha.
- No convertir la ayuda en documentación técnica ni duplicar lógica de cálculo.

## Documentación a actualizar ante cambios

- Fórmulas: `README.md`, `docs/calculation-model.md`, `docs/examples.md`.
- Recomendación: `README.md`, `docs/recommendation-criteria.md`.
- Flujo o UI: `README.md`, `docs/ux-flow.md`.
- Storage: `README.md`, `docs/ux-flow.md`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`.
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
```
