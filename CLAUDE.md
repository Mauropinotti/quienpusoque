# CLAUDE.md — Guía para agentes de código

## Proyecto

**¿Quién puso qué?** — App de distribución de gastos compartidos.

Stack: Next.js 15, React 19, TypeScript estricto, Tailwind CSS v4, sin backend.

## Regla principal

**La lógica de negocio NO va en componentes React.**

Todo cálculo vive en `lib/calculations/`. Los componentes solo reciben datos procesados como props y renderizan UI.

## Estructura de archivos

```
lib/calculations/           ← funciones puras, sin React, sin side effects
lib/formatting/             ← helpers de formato (moneda, porcentaje)
lib/text/                   ← generación de texto para WhatsApp
types/                      ← tipos TypeScript compartidos entre capas
components/ui/              ← primitivos UI (Button, Input, Card, Badge)
components/event/           ← componentes del paso "setup"
components/families/        ← componentes del paso "families"
components/recommendation/  ← componentes del paso "recommendation"
components/results/         ← componentes del paso "results"
app/page.tsx                ← estado global del flujo guiado, orquesta todo
```

## Flujo de datos

```
app/page.tsx (estado)
  → computeAllEligibility()    [lib]
  → recommendSplitMode()       [lib]
  → calculateBalances()        [lib]
  → calculateTransfers()       [lib]
  → componentes (solo props)
```

## Tipos clave

- `Family` — datos crudos de una familia
- `FamilyWithEligibility` — Family + isEligibleToPay + eligiblePersons
- `FamilyBalance` — resultado del cálculo de balances
- `Transfer` — una transferencia sugerida de A a B
- `SplitRecommendation` — modo recomendado + confianza + razones + métricas

## Convenciones

- TypeScript estricto, sin `any`
- Funciones puras en `lib/` — mismos inputs, mismo output, sin side effects
- Componentes pequeños y declarativos
- Tailwind CSS v4 (sin tailwind.config.ts, se configura via globals.css)
- `nanoid` para IDs únicos
- Sin backend, sin auth, sin base de datos en el MVP

## Agregar una nueva función de cálculo

1. Crear el archivo en `lib/calculations/nombreFuncion.ts`
2. Exportar función pura tipada
3. Importar en `app/page.tsx` y pasar resultado como prop a componentes

## No hacer

- No mezclar cálculos dentro de componentes
- No usar `useEffect` para derivar cálculos (usar `useMemo` o calcular en el handler)
- No agregar dependencias sin justificación
