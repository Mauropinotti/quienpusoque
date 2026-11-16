# ¿Quién puso qué?

**Repartí los gastos del asado sin planillas ni discusiones.** Cargás quién vino y cuánto puso; la app reparte por familia o por persona, te sugiere el criterio más justo y arma las transferencias mínimas para mandar al grupo, con resumen para WhatsApp y ticket PDF.

Sin registro, sin backend, sin base de datos: todo corre en el navegador.

![Landing de ¿Quién puso qué?](docs/screenshots/landing.jpg)

> Deploy: `https://quien-puso-que.vercel.app` (pendiente del primer deploy). Para verlo localmente: `npm install && npm run dev`.

## El problema

Termina la juntada. Una familia compró carne, otra llevó bebidas, alguien pagó el hielo, otra no puso nada todavía y hay un menor invitado que no debería entrar en la cuenta. La pregunta aparece sola:

> ¿Quién le debe cuánto a quién?

## Cómo se usa

![Flujo en el celular: evento, familias, criterio y ticket](docs/screenshots/flujo-movil.jpg)

1. **Evento**: le ponés nombre a la juntada, o importás un cálculo que exportaste antes y seguís donde lo dejaste.
2. **Familias**: quién vino, cuántos adultos y cuántos menores son, y qué puso cada uno, cosa por cosa ("carne $10.000", "hielo $2.000"). La app suma el total. Una familia sin adultos no aporta.
3. **Criterio**: la app recomienda repartir por familia o por persona y explica por qué. Por persona, el grupo elige cómo pagan los menores: igual que los adultos, la mitad (lo que no pagan se reparte entre los adultos) o nada. Se ve cuánto le tocaría a cada uno antes de decidir.
4. **Ticket**: balances con el detalle de lo que puso cada uno, el cálculo paso a paso y la cuenta de cada familia, transferencias numeradas, copiar para WhatsApp, PDF, exportar el cálculo y guardar en el historial.

La ayuda para usuarios está en `/ayuda`.

## Lo que hay detrás

| | |
|---|---|
| **Motor de cálculo puro** | Elegibilidad, recomendación, balances y transferencias son funciones puras en `lib/calculations/`, sin React. Las transferencias usan aritmética entera para no arrastrar errores de punto flotante. |
| **Flujo como máquina de estados** | `lib/flow/eventFlow.ts` es un reducer puro y testeado: no lee storage, no genera ids ni fechas. La UI solo despacha acciones. |
| **Rendimiento medido** | 16 teclas en un input pasaban de 48 operaciones de `localStorage` a 1; agregar una familia, de 33 renders a 10. Landing sin JS propio, pasos con carga diferida y jsPDF por intención. Detalle y metodología en [`docs/performance.md`](docs/performance.md). |
| **Lighthouse móvil** | Performance 98–99 y **100** en accesibilidad, buenas prácticas y SEO en las tres rutas. CLS 0. |
| **Sin flash al volver** | Si hay una cuenta a medio hacer, un script inline decide antes del primer paint qué mostrar; nunca se ve el paso 1 para después saltar. |
| **Probado de punta a punta** | 97 tests unitarios (Vitest) y 30 E2E (Playwright, móvil y desktop) sobre el build de producción: portapapeles, descarga y validación del PDF, exportar e importar el cálculo, recarga inmediata, teclado, recorte de foto. Un error de consola hace fallar el test. |
| **Cuentas a la vista** | Cada familia carga qué puso y cuánto salió cada cosa; el total lo calcula la app y el desglose aparece en el ticket, el PDF y el WhatsApp. |
| **Privacidad por diseño** | El cálculo, el borrador, el historial y la foto del ticket nunca salen del navegador. El cálculo exportado es un archivo que guarda el usuario. |

## Reglas de negocio

### Quién aporta

La regla vive en `lib/calculations/eligibility.ts`.

Cada familia declara cuántos **adultos** y cuántos **menores** son.

| Caso | Entra en el reparto | Personas que cuentan |
|---|---:|---:|
| Con al menos 1 adulto | Sí | adultos + menores |
| Sin adultos (solo menores) | No | 0 |

Una familia sin adultos queda como **no aportante**: no paga, no cobra y no genera transferencias. Por eso el formulario bloquea su monto en $0.

### Lo que puso cada uno

Cada familia carga cada cosa con lo que salió y la app calcula el total:
`paidAmount = suma de items[].amount` (`lib/calculations/contributions.ts`).
El reparto usa ese total; el desglose es el respaldo que se muestra en todas
las salidas.

### Por familia o por persona

```text
por familia:            parte = gasto_total / familias_que_aportan
por persona (100%):     parte = gasto_total / (adultos + menores)
menores al 50%:         parte = gasto_total / (adultos + menores)
                        menor = parte × 50%
                        adulto = parte + (menores × (parte − menor)) / adultos
menores al 0%:          adulto = gasto_total / adultos;  menor = 0
```

Por familia es simple y sirve con grupos de tamaño parecido. Por persona es más fino cuando hay familias chicas y grandes; ahí se decide cuánto pagan los menores. El cálculo completo, con el ejemplo de $12.000 entre 6 adultos y 2 menores, está en [`docs/calculation-model.md`](docs/calculation-model.md). Ticket, PDF y WhatsApp muestran cada paso.

### Recomendación

`lib/calculations/recommendSplitMode.ts` calcula métricas del grupo y genera señales con peso:

La recomendación elige la base (por familia o por persona); cuánto pagan los menores lo decide el grupo.

- Muchas familias de 1 adulto favorecen `by-person`.
- Muchas familias grandes favorecen `by-family`.
- Si el impacto económico entre criterios es alto, favorece `by-person`.
- Si el impacto es bajo y los tamaños son parecidos, favorece `by-family`.
- Sin señales fuertes, sugiere `by-family` por simpleza, con confianza baja.

La recomendación es una ayuda: siempre se puede elegir otro criterio. Más en [`docs/recommendation-criteria.md`](docs/recommendation-criteria.md).

### Balances y transferencias

```text
balance = monto_pagado - cuota_esperada
```

| Balance | Estado | Significado |
|---:|---|---|
| mayor a 0 | cobra | puso de más |
| menor a 0 | paga | puso de menos |
| igual a 0 | equilibrado | está justo |
| familia no elegible | no aporta | no entra en el reparto |

El estado lo calcula `calculateBalances`; la UI no lo reinterpreta. Las transferencias (`calculateTransfers`) emparejan deudores y acreedores de mayor a menor con un greedy determinístico, en pesos enteros, para minimizar la cantidad de movimientos. Modelo completo en [`docs/calculation-model.md`](docs/calculation-model.md).

## Ejemplo completo

Evento: **Asado del sábado**

| Familia | Adultos | Menores | Pagó |
|---|---:|---:|---:|
| Los García | 2 | 2 | $8.000 |
| Los Rodríguez | 2 | 0 | $3.000 |
| Los López | 1 | 0 | $0 |
| Los Martínez | 0 | 1 | $0 |
| Los Fernández | 2 | 1 | $5.000 |

Total: **$16.000**. Aportan 4 familias: 7 adultos y 3 menores. Los Martínez (sin adultos) no aportan.

Por familia, cada una pone `16.000 / 4 = 4.000`:

- Los López le transfieren $4.000 a Los García.
- Los Rodríguez le transfieren $1.000 a Los Fernández.

Por persona con menores al 50%: `16.000 / 10 = 1.600` por persona, cada menor paga $800, los 3 menores dejan $2.400 que se reparten entre los 7 adultos ($342,86 más cada uno) y cada adulto paga $1.942,86.

El cálculo por familia es el ticket de muestra de la landing: se genera en build con el motor real. Más casos en [`docs/examples.md`](docs/examples.md).

## Ticket PDF

<img src="docs/screenshots/ticket-pdf.jpg" alt="Ticket PDF generado por la app" width="420">

Se genera en el navegador con `jsPDF` (sin screenshots ni servidor) e incluye resumen, criterio, cómo se calculó paso a paso, lo que le toca a cada familia, tabla de familias (adultos, menores y lo que puso cada una), no aportantes y transferencias. La foto opcional se recorta al formato del ticket sin deformarse y no se guarda en ningún lado. Detalle en [`docs/pdf-ticket.md`](docs/pdf-ticket.md).

## Persistencia local

| Clave | Contenido |
|---|---|
| `quien-puso-que:current-draft` | la cuenta en edición; se guarda sola (debounce + al cerrar la pestaña) |
| `quien-puso-que:closed-events` | historial de cuentas cerradas (máximo 50) |

Todo lo que se lee del storage se valida antes de usarlo. Si el navegador bloquea `localStorage`, la app sigue funcionando sin persistencia.

## Stack

- Next.js 16 (App Router, Turbopack) · React 19 · TypeScript
- Tailwind CSS v4 con tokens propios
- jsPDF (carga diferida) · nanoid
- Vitest · Playwright · Lighthouse
- Tipografía: Bricolage Grotesque (OFL), subset propio autoalojado

## Estructura

```text
app/                  rutas: landing, /calcular, /ayuda, metadatos, íconos
components/
  landing/            secciones de la landing (Server Components)
  calculator/         CalculatorApp: estado y flujo; fallback; stepper
  event/ families/    pasos 1 y 2 (incluye importar y exportar el cálculo)
  recommendation/     paso 3
  results/            ticket, WhatsApp, PDF
  history/ help/      historial y ayuda
  ui/ layout/         primitivas, íconos, header, footer
hooks/                persistencia del borrador
lib/
  calculations/       motor de cálculo (puro), suma de lo que puso cada uno
  flow/               reducer del flujo y derivados
  forms/ image/ pdf/  validación, foto, PDF
  storage/            acceso defensivo a localStorage
  exchange/           exportar e importar el cálculo como archivo .json
  text/ formatting/   WhatsApp, moneda, fechas
types/                contratos
tests/  e2e/          unitarios y E2E
scripts/perf/         medición de red y renders
docs/                 producto, cálculo, UX, PDF y rendimiento
```

Regla principal: **la lógica de negocio no va en componentes React**. Ver [`CLAUDE.md`](CLAUDE.md) / [`AGENTS.md`](AGENTS.md).

## Correr localmente

```bash
npm install
npm run dev          # http://localhost:3000
```

Verificación:

```bash
npm test             # unitarios
npm run lint
npm run build
npx playwright install chromium   # una sola vez
npm run test:e2e     # E2E sobre el build de producción
```

Si el entorno ya tiene un Chromium, `PLAYWRIGHT_CHROMIUM_PATH=/ruta/a/chrome npm run test:e2e`.

## Desplegar en Vercel

1. Subir el repo a GitHub.
2. Importarlo desde Vercel con la configuración automática para Next.js.
3. Deploy. No requiere variables de entorno; Vercel Analytics se activa solo dentro de Vercel.

## Estado

Versión actual: **Quienpusoque V1.2** (noviembre de 2026). La landing tiene una sección de progreso con las novedades y el historial; el detalle está en [`CHANGELOG.md`](CHANGELOG.md).

- [x] Landing y calculadora mobile first.
- [x] Alta, edición y eliminación de familias.
- [x] Reglas de elegibilidad, reparto por familia y por persona.
- [x] Motor de recomendación con comparación por familia.
- [x] Balances y transferencias mínimas.
- [x] Resumen para WhatsApp con fallback de copiado.
- [x] Borrador e historial locales.
- [x] Ticket PDF con foto opcional.
- [x] Desglose de lo que puso cada uno, con total calculado por la app.
- [x] Exportar e importar el cálculo en curso para retomarlo después.
- [x] Adultos y menores explícitos; por persona, menores al 100%, 50% o 0%, con el cálculo a la vista.
- [x] Ayuda para usuarios finales.
- [x] Tests unitarios y E2E.
- [x] Accesibilidad AA (Lighthouse 100).

## Roadmap

- Exportar o compartir eventos cerrados del historial (el cálculo en curso ya se exporta).
- Modo offline con service worker.
- Soporte opcional para más monedas.
- Monitoreo de errores en producción (Sentry con carga diferida).

## Licencia

Código bajo licencia MIT. La tipografía Bricolage Grotesque se distribuye bajo SIL Open Font License 1.1 (`app/fonts/OFL.txt`).

## Filosofía

- Cálculos claros antes que magia.
- UI amable, pero resultados precisos.
- Sin backend mientras el problema pueda resolverse bien en el navegador.
- Separación estricta entre lógica de negocio y componentes.
- Medir antes de optimizar.
- Texto en español argentino, directo y sin solemnidad innecesaria.

¡Cuentas claras siempre!
