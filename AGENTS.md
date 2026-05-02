# AGENTS.md — Guía para agentes autónomos

## Proyecto

**¿Quién puso qué?** — Calculadora de gastos compartidos en reuniones y eventos.

## Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- nanoid

## Arquitectura

La lógica de negocio está completamente separada de los componentes React:

- `lib/calculations/` — cálculos puros (elegibilidad, balances, transferencias, recomendación)
- `lib/formatting/` — formateo de moneda y porcentajes
- `lib/text/` — generación de texto para WhatsApp
- `types/` — contratos TypeScript entre capas
- `components/` — UI organizada por paso del flujo

## Estado de la app

El estado global vive en `app/page.tsx`. El flujo tiene 4 pasos: setup → families → recommendation → results.

## Reglas al modificar código

1. Las funciones de cálculo en `lib/` deben ser puras y testeables.
2. No agregar lógica de negocio dentro de componentes `.tsx`.
3. Los tipos en `types/` son el contrato entre capas — no romperlos sin actualizar todos los consumers.
4. Tailwind v4: no existe `tailwind.config.ts`. Los estilos base van en `app/globals.css`.

## Archivos críticos

- `types/family.ts` — definición de Family, SplitMode, SingleMemberType
- `types/calculation.ts` — FamilyBalance, Transfer
- `types/recommendation.ts` — SplitRecommendation
- `lib/calculations/eligibility.ts` — regla del menor de 1 integrante
- `lib/calculations/recommendSplitMode.ts` — motor de recomendación
- `app/page.tsx` — orquestador del flujo

## Ejecutar

```bash
npm install && npm run dev
```
