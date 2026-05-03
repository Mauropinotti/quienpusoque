# CLAUDE.md - Guía para agentes de código

## Proyecto

**¿Quién puso qué?** distribuye gastos compartidos de eventos chicos. El MVP corre completamente en el navegador: no hay backend, base de datos ni autenticación.

## Regla principal

La lógica de negocio **no va en componentes React**.

Los componentes renderizan formularios, tarjetas y resultados. Las reglas viven en `lib/` y los contratos en `types/`.

## Arquitectura

```text
app/page.tsx                estado global y flujo
components/event/           setup del evento
components/families/        alta, edición, eliminación y listado
components/recommendation/  recomendación y selector de criterio
components/results/         resumen, balances, transferencias y copiar
components/ui/              Button, Input, Card, Badge
hooks/                      hooks cliente
lib/calculations/           funciones puras de cálculo
lib/formatting/             moneda y porcentaje
lib/storage/                localStorage defensivo
lib/text/                   texto para WhatsApp
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

Usar `useMemo` para derivar resultados desde estado cuando corresponda. Evitar `useEffect` para cálculos puros.

## Tipos clave

- `Family`: datos crudos de cada familia.
- `FamilyWithEligibility`: familia con elegibilidad calculada.
- `FamilyBalance`: resultado por familia.
- `Transfer`: transferencia sugerida.
- `SplitRecommendation`: modo recomendado, confianza, razones y métricas.
- `LocalEventDraft`: borrador validado para `localStorage`.

## Reglas de negocio

### Elegibilidad

Fuente: `lib/calculations/eligibility.ts`.

- 1 adulto: aporta.
- 1 menor: no aporta.
- 2 o más integrantes: aportan.

### Reparto

- `by-family`: partes iguales por familia habilitada.
- `by-person`: partes iguales por persona habilitada.

### Balance

```text
balance = paidAmount - expectedShare
```

El estado resultante (`pays`, `receives`, `balanced`, `guest`) se calcula en `calculateBalances`. La UI no debe recalcularlo.

### Transferencias

`calculateTransfers` toma balances canónicos y genera transferencias entre deudores y acreedores. No acepta familias crudas.

## Recomendación

`recommendSplitMode` compara composición e impacto económico. Si cambiás señales, pesos o textos de razones, actualizá `docs/recommendation-criteria.md`.

## localStorage

El borrador actual usa:

```text
quien-puso-que:current-draft
```

`localEventStorage.ts`:

- valida disponibilidad de `window.localStorage`
- parsea JSON con guardas
- valida familias, modos y fecha
- guarda `updatedAt`
- borra el borrador actual

`closedEventsStorage.ts`:

- usa `quien-puso-que:closed-events`
- valida snapshots de eventos cerrados
- guarda hasta 50 eventos
- permite borrar eventos cerrados individualmente

`useEventDraft.ts`:

- corre solo en cliente
- restaura después de hydration
- evita romper SSR
- guarda cambios del evento actual

## Evento borrador

Evento en edición. Puede no tener familias, puede no tener criterio confirmado y puede estar incompleto. Se guarda para evitar pérdida de datos al recargar.

## Evento cerrado

Resultado final confirmado que se guarda en el historial local. Es una foto del cálculo: familias, balances, transferencias, recomendación, total y criterio usado.

## Restricciones del MVP

- No backend.
- No auth.
- No base de datos.
- No sincronización entre dispositivos.
- No PDF todavía.
- No subida de foto todavía.
- No dependencias nuevas salvo necesidad clara.

## Qué no hacer

- No meter fórmulas en componentes.
- No acceder a `localStorage` durante SSR.
- No usar datos recuperados de storage sin validar.
- No cambiar `types/` sin actualizar todos los consumers.
- No documentar el ticket PDF ni la subida de foto como terminados.
- No cambiar el tono a corporativo rígido: la app es cálida, clara y argentina.

## Cómo modificar cálculos

1. Empezar por `types/`.
2. Modificar la función pura en `lib/calculations/`.
3. Mantener determinismo.
4. Actualizar pruebas o ejemplos manuales.
5. Ajustar UI solo si cambia el dato mostrado.
6. Actualizar docs.
7. Correr `npm run lint` y `npm run build`.

## Documentación obligatoria ante cambios

- Fórmulas: `docs/calculation-model.md`.
- Recomendación: `docs/recommendation-criteria.md`.
- Flujo: `docs/ux-flow.md`.
- Casos concretos: `docs/examples.md`.
- Alcance público: `README.md`.
- Instrucciones para agentes: `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`.
