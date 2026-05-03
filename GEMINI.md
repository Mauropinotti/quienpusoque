# GEMINI.md - Contexto para Gemini

## Proyecto

**¿Quién puso qué?** es una app web para repartir gastos de eventos grupales. Calcula quién puso de más, quién paga, quién cobra y qué transferencias conviene hacer.

## Tecnología

- Next.js App Router (`next` 16.2.4)
- React 19
- TypeScript
- Tailwind CSS v4
- nanoid
- Sin backend
- Sin base de datos
- Sin autenticación

## Principio central

Separación estricta entre lógica y UI:

- `lib/calculations/`: funciones puras.
- `components/`: renderizado e interacción.
- `types/`: contratos.
- `app/page.tsx`: orquestación del flujo.

## Dominio

Una `Family` representa un grupo participante:

- nombre
- cantidad de integrantes de 1 a 5
- tipo si tiene 1 integrante (`adult` o `minor`)
- monto pagado
- nota opcional

## Reglas de negocio

### Elegibilidad

- Familia de 1 adulto: paga.
- Familia de 1 menor: no aporta.
- Familia de 2 o más integrantes: paga.

La regla vive en `lib/calculations/eligibility.ts`.

### Modos de reparto

- `by-family`: divide el total entre familias habilitadas.
- `by-person`: divide el total entre personas habilitadas.

### Balance

```text
balance = paidAmount - expectedShare
```

Estados:

- `receives`: cobra.
- `pays`: paga.
- `balanced`: equilibrado.
- `guest`: no aporta.

### Transferencias

Se calculan desde `FamilyBalance[]`, no desde familias crudas. El algoritmo greedy empareja deudores y acreedores y usa pesos enteros para transferencias.

## Recomendación

`recommendSplitMode` compara ambos criterios con señales ponderadas:

- composición del grupo
- familias de 1 adulto
- familias numerosas
- impacto promedio entre modos
- impacto máximo entre modos
- similitud de tamaños

La recomendación no es una obligación: la UI permite elegir manualmente.

## localStorage

El MVP guarda solo el borrador actual:

```text
quien-puso-que:current-draft
```

Se guarda nombre, familias, modo seleccionado, modo confirmado, aceptación de recomendación, fecha de creación y fecha de última edición.

El historial de eventos cerrados usa:

```text
quien-puso-que:closed-events
```

Reglas:

- solo cliente
- validar antes de restaurar
- tolerar errores y storage bloqueado
- no guardar información sensible

## Evento borrador

Evento actual en edición. Puede estar incompleto. Sirve para no perder datos al recargar.

## Evento cerrado

Evento final confirmado guardado en historial local. Incluye snapshots de familias, balances, transferencias y recomendación.

## Restricciones del MVP

- No backend.
- No login.
- No base de datos.
- No PDF todavía.
- No subida de foto todavía.
- No sincronización.

## Qué no debe hacer un agente

- No agregar reglas de cálculo en React.
- No recalcular `status` en componentes.
- No acceder a `window` o `localStorage` fuera del cliente.
- No usar datos de storage sin validar.
- No presentar roadmap como funcionalidad lista.
- No agregar librerías innecesarias.

## Documentación a actualizar

- Fórmulas: `docs/calculation-model.md`.
- Recomendación: `docs/recommendation-criteria.md`.
- UX: `docs/ux-flow.md`.
- Casos: `docs/examples.md`.
- Resumen público: `README.md`.
