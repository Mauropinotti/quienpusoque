# AGENTS.md - Guía para agentes autónomos

## Proyecto

**¿Quién puso qué?** es una calculadora de gastos compartidos para reuniones y eventos. El objetivo del MVP es resolver un evento chico desde el celular: cargar familias, elegir criterio de reparto, ver balances, generar transferencias y copiar un resumen para WhatsApp.

## Stack actual

- Next.js App Router (`next` 16.2.4 en `package.json`)
- React 19
- TypeScript
- Tailwind CSS v4
- nanoid
- Sin backend, sin base de datos, sin autenticación

## Arquitectura

La lógica de negocio está separada de React:

- `app/page.tsx`: estado global y orquestación del flujo.
- `components/`: UI por paso y componentes base.
- `types/`: contratos TypeScript entre capas.
- `lib/calculations/`: funciones puras de elegibilidad, recomendación, balances y transferencias.
- `lib/formatting/`: formateo de moneda y porcentajes.
- `lib/text/`: generación de texto para WhatsApp.
- `lib/storage/`: acceso defensivo a `localStorage`.
- `hooks/`: coordinación cliente, por ejemplo `useEventDraft`.
- `docs/`: documentación funcional y técnica.

## Flujo de la app

```text
setup -> families -> recommendation -> results
```

El estado global vive en `app/page.tsx`. Los resultados de recomendación, balances y transferencias deben derivarse usando funciones puras de `lib/`.

## Reglas de negocio

### Familias

`Family` vive en `types/family.ts`:

- `name`: nombre visible.
- `members`: entero de 1 a 5.
- `singleMemberType`: `adult`, `minor` o `null`.
- `paidAmount`: monto pagado, no negativo.
- `notes`: detalle opcional.

### Elegibilidad

Regla canónica en `lib/calculations/eligibility.ts`:

- 1 adulto: paga, `eligiblePersons = 1`.
- 1 menor: no aporta, `eligiblePersons = 0`.
- 2 o más integrantes: paga, `eligiblePersons = members`.

No dupliques esta regla en componentes.

### Criterios de reparto

- `by-family`: el total se divide por familias habilitadas.
- `by-person`: el total se divide por personas habilitadas y cada familia paga proporcionalmente a sus integrantes elegibles.

### Balances

Regla en `calculateBalances`:

```text
balance = paidAmount - expectedShare
```

El `status` canónico puede ser:

- `receives`: cobra.
- `pays`: paga.
- `balanced`: equilibrado.
- `guest`: no aporta.

Los componentes deben consumir `status`; no deben recalcularlo.

### Transferencias

`calculateTransfers` usa un emparejamiento greedy entre deudores y acreedores. Trabaja con pesos enteros para evitar deriva de punto flotante en el loop.

## Motor de recomendación

`recommendSplitMode` usa un sistema de señales con peso:

- muchas familias de 1 adulto favorecen `by-person`
- muchas familias grandes favorecen `by-family`
- impacto promedio alto favorece `by-person`
- impacto máximo alto es señal crítica para `by-person`
- impacto bajo con tamaños similares favorece `by-family`

Si modificás criterios o umbrales, actualizá:

- `docs/recommendation-criteria.md`
- `README.md`
- ejemplos relevantes en `docs/examples.md`

## localStorage

El borrador actual se guarda en:

```text
quien-puso-que:current-draft
```

Los eventos cerrados se guardan en:

```text
quien-puso-que:closed-events
```

Implementación:

- `lib/storage/localEventStorage.ts`: lee, valida, guarda y borra.
- `hooks/useEventDraft.ts`: integra storage con el estado cliente.

Reglas:

- Solo acceder a `localStorage` del lado cliente.
- Validar todo dato recuperado antes de usarlo.
- No romper SSR ni hydration.
- Si `localStorage` no existe o falla, la app debe seguir funcionando.
- No guardar información sensible.

## Evento borrador y evento cerrado

Un **evento borrador** es el evento actual en edición. Puede estar en setup, families, recommendation o results. Se guarda para no perder datos al recargar.

Un **evento cerrado** es una versión final confirmada para historial local. Guarda snapshots de familias, balances, transferencias y recomendación. No debe pisar el borrador actual.

## Restricciones del MVP

- No backend.
- No base de datos.
- No autenticación.
- No historial remoto.
- No sincronización entre dispositivos.
- No librerías nuevas sin una razón fuerte.
- No ticket PDF todavía.
- No subida de fotos todavía.

## Qué no debe hacer un agente

- No poner reglas de cálculo dentro de `.tsx`.
- No reinterpretar balances en UI.
- No modificar tipos compartidos sin actualizar consumers y docs.
- No guardar datos fuera de `localStorage`.
- No presentar roadmap como funcionalidad hecha.
- No agregar dependencias por conveniencia menor.
- No borrar cambios del usuario.

## Cómo modificar cálculos sin romper la app

1. Identificar el contrato en `types/`.
2. Cambiar la función pura en `lib/calculations/`.
3. Mantener entradas y salidas deterministas.
4. Actualizar orquestación en `app/page.tsx` solo si cambia el contrato.
5. Actualizar UI solo para mostrar nuevos datos, no para calcularlos.
6. Actualizar documentación técnica y ejemplos.
7. Correr `npm run lint` y `npm run build`.

## Documentación a actualizar ante cambios

- Cambios de reglas o fórmulas: `README.md`, `docs/calculation-model.md`, `docs/examples.md`.
- Cambios de recomendación: `README.md`, `docs/recommendation-criteria.md`.
- Cambios de flujo o UI: `README.md`, `docs/ux-flow.md`.
- Cambios de storage: `README.md`, `docs/ux-flow.md`, este archivo, `CLAUDE.md`, `GEMINI.md`.
- Cambios de alcance del MVP: `README.md` y guías de agentes.

## Ejecutar

```bash
npm install
npm run dev
```

Verificar:

```bash
npm run lint
npm run build
```
