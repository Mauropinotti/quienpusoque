# GEMINI.md - Contexto para Gemini

## Proyecto

**¿Quién puso qué?** es una app web para repartir gastos de eventos grupales. Calcula quién puso de más, quién paga, quién cobra, qué transferencias conviene hacer y genera un ticket PDF final.

## Tecnología

- Next.js App Router (`next` 16.2.4)
- React 19
- TypeScript
- Tailwind CSS v4
- nanoid
- jsPDF
- Sin backend
- Sin base de datos
- Sin autenticación

## Principio central

Separación estricta entre lógica y UI:

- `lib/calculations/`: funciones puras.
- `lib/pdf/`: generación del ticket PDF.
- `components/`: renderizado e interacción.
- `types/`: contratos.
- `app/page.tsx`: orquestación del flujo.

## Reglas de negocio

- Familia de 1 adulto: paga.
- Familia de 1 menor: no aporta.
- Familia de 2 o más integrantes: paga.
- `by-family`: divide el total entre familias habilitadas.
- `by-person`: divide el total entre personas habilitadas.
- `balance = paidAmount - expectedShare`.
- Las transferencias salen de `FamilyBalance[]`, no de familias crudas.

## Storage local

Borrador actual:

```text
quien-puso-que:current-draft
```

Historial:

```text
quien-puso-que:closed-events
```

Reglas:

- solo cliente
- validar antes de restaurar
- tolerar errores y storage bloqueado
- no guardar información sensible

## PDF final

El ticket PDF se genera en cliente con `jsPDF`.

Reglas:

- no usar backend
- no subir fotos
- no guardar imágenes pesadas en `localStorage`
- la foto opcional se procesa localmente y se usa solo para el PDF actual
- mantener el PDF como salida estructurada del cálculo
- actualizar `docs/pdf-ticket.md` ante cambios

## Qué no debe hacer un agente

- No agregar reglas de cálculo en React.
- No recalcular `status` en componentes.
- No acceder a `window` o `localStorage` fuera del cliente.
- No usar datos de storage sin validar.
- No persistir fotos del ticket innecesariamente.
- No agregar librerías innecesarias.

## Documentación a actualizar

- Fórmulas: `docs/calculation-model.md`.
- Recomendación: `docs/recommendation-criteria.md`.
- UX: `docs/ux-flow.md`.
- PDF: `docs/pdf-ticket.md`.
- Casos: `docs/examples.md`.
- Resumen público: `README.md`.
