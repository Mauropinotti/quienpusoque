# GEMINI.md — Contexto para Gemini

## Proyecto: ¿Quién puso qué?

App web para distribuir gastos en eventos grupales. Calcula quién pagó de más, quién debe pagar, y qué transferencias hacer para que todos queden equilibrados.

## Tecnología

Next.js 15 + React 19 + TypeScript + Tailwind CSS v4. Sin backend. Sin base de datos. Deploy en Vercel.

## Principio de diseño

**Separación estricta entre lógica y UI.**

- `lib/calculations/` → funciones puras sin React
- `components/` → solo renderizado, sin reglas de negocio
- `app/page.tsx` → orquesta el estado y llama a las funciones de lib

## Dominio del negocio

**Family**: grupo que participa del evento. Tiene nombre, cantidad de integrantes (1-5), tipo si es 1 integrante (adult/minor), y monto pagado.

**Elegibilidad**: una familia con 1 integrante menor NO paga. Una familia con 1 adulto o con 2+ integrantes SÍ paga.

**Modos de reparto**:
- `by-family`: partes iguales por familia
- `by-person`: proporcional a integrantes elegibles

**Recomendación**: el sistema evalúa ambos modos y recomienda el más justo según la composición del grupo.

**Transferencias**: algoritmo greedy que minimiza la cantidad de transferencias necesarias.

## Estructura clave

```
types/          → contratos TypeScript
lib/            → lógica pura
components/     → UI por dominio
app/page.tsx    → estado + orquestación
```

## Convenciones

- TypeScript estricto, sin `any`
- Tailwind v4 (configuración vía globals.css, sin tailwind.config.ts)
- español argentino en UI y comentarios
