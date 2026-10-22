# Rendimiento

Cómo se midió, qué se cambió y qué se descartó. Todos los números salen de
herramientas, no de estimaciones, y comparan el commit original (`612ef33`)
contra la versión actual con el mismo instrumental.

## Cómo se mide

| Qué | Herramienta | Detalle |
|---|---|---|
| Core Web Vitals y puntajes | Lighthouse 13.5 (API programática) | Móvil con throttling simulado (Moto G Power, CPU 4x, 4G lento). Mediana de 5 corridas sobre `next build && next start`. |
| Bytes por fase | `scripts/perf/network.mjs` (Playwright + Chrome DevTools Protocol) | Separa lo pedido antes del evento `load` de lo prefetcheado después. Cache deshabilitada. |
| Renders innecesarios | `scripts/perf/renders.mjs` | Instala un hook con la misma API que React DevTools (`__REACT_DEVTOOLS_GLOBAL_HOOK__`) y cuenta qué componentes se renderizan en cada commit. Solo recorre subárboles procesados, igual que DevTools. Se corre contra `next dev` para conservar los nombres. |
| Operaciones de storage | `scripts/perf/renders.mjs` | Envuelve `Storage.prototype` y cuenta `getItem`, `setItem`, `removeItem` y bytes escritos por escenario. |
| Flujos reales | Playwright (`npm run test:e2e`) | 12 escenarios × móvil y desktop sobre el build de producción. Cualquier error de consola hace fallar el test. |

```bash
npm run build && npm run start                       # terminal 1
node scripts/perf/network.mjs http://localhost:3000 / /calcular /ayuda
npx lighthouse http://localhost:3000/calcular --form-factor=mobile

npm run dev                                          # renders (nombres legibles)
node scripts/perf/renders.mjs http://localhost:3000/calcular
```

## Resultados

### Lighthouse (móvil, mediana de 5)

| Ruta | Perf | Accesib. | Buenas prácticas | SEO | FCP | LCP | TBT | CLS |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Antes · app en `/` | 99 | 95 | 96 | 100 | 759 ms | 2257 ms | 51 ms | 0 |
| Antes · `/ayuda` | 98 | 95 | 96 | 100 | 759 ms | 1813 ms | 80 ms | 0 |
| **Ahora · landing `/`** | 98 | **100** | **100** | 100 | 777 ms | 2378 ms | 48 ms | 0 |
| **Ahora · app `/calcular`** | 99 | **100** | **100** | 100 | 763 ms | **1857 ms** | 67 ms | 0 |
| **Ahora · `/ayuda`** | 99 | **100** | **100** | 100 | 759 ms | 2014 ms | 41 ms | 0 |

- Accesibilidad y buenas prácticas pasan a 100 en todas las rutas: se
  corrigieron un `aria-label` en un `div` sin rol, contraste insuficiente en
  la ayuda y el 404 + error de consola del script de Vercel Analytics fuera
  de Vercel.
- La calculadora carga su paso inicial ~400 ms antes (LCP 2257 → 1857 ms).
- En `/ayuda` el LCP de texto subió ~200 ms bajo 4G simulado: es el costo de
  una tipografía display con más glifos que la anterior (ver "Fuentes").
  En conexiones reales queda muy por debajo del umbral de 2,5 s.

### Red: lo que baja antes del `load`

| Ruta | JS inicial | JS propio inicial | JS después del load | CSS | Fuente |
|---|---:|---:|---:|---:|---:|
| Antes · app en `/` | 164,1 KB | 12,8 KB (toda la app) | 6,0 KB | 6,6 KB | 28,9 KB |
| **Ahora · `/calcular`** | 165,7 KB | **10,5 KB** (shell + paso 1) | 21,1 KB (pasos en idle) | 9,2 KB | 35,1 KB |
| **Ahora · landing `/`** | 159,3 KB | **0 KB** (Server Components) | 10,5 KB (prefetch de `/calcular`) | 9,2 KB | 35,1 KB |

Tamaños comprimidos. ~155 KB son el runtime de React + Next (react-dom solo
pesa 70 KB) y no dependen de la app. jsPDF (134 KB) nunca está en la carga
inicial.

### Renders y storage por interacción

| Escenario | Renders antes | Renders ahora | Ops. storage antes | Ops. storage ahora |
|---|---:|---:|---:|---:|
| Tipear el nombre del evento (16 teclas) | 96 | **64** | 48 | **1** |
| Cargar el ejemplo (5 familias) | 29 | 24 | 3 | 1 |
| Agregar una familia | 33 | **10** | 3 | 1 |
| Cambiar de criterio | 14 | **6** | 3 | 1 |
| Guardar en el historial | 32 | **6** | 6 | 1 |

Los íconos SVG nuevos y el wrapper interno de `next/dynamic` se excluyen del
conteo para que la comparación sea justa.

## Qué se hizo, punto por punto

### 1. Renders innecesarios

- **Estado del flujo en un reducer puro** (`lib/flow/eventFlow.ts`). `dispatch`
  es estable, así que los callbacks no cambian entre renders y `memo` funciona.
  Las acciones que no cambian nada devuelven el mismo estado (React corta el
  render).
- **Derivados con dependencias exactas** (`lib/flow/eventInsights.ts`). Antes,
  el cálculo de balances dependía de `eventData` completo: cada tecla en el
  nombre del evento recalculaba elegibilidad, recomendación, balances y
  transferencias. Ahora depende solo de familias, moneda y criterio.
- **Elegibilidad en una pasada**: la página la calculaba dos veces por render.
- **`memo` donde mide**: tarjetas de familia (agregar una ya no re-renderiza
  las demás), ticket, métricas, comparador, botones de compartir, historial.
- **Avatar con color por id**, no por índice: borrar una familia no repinta
  todas las siguientes.
- **Elementos constantes**: el historial se pasa como elemento de módulo, así
  React ni siquiera visita el wrapper de `next/dynamic` al tipear.

### 2. Bundle y lazy loading

- **Landing 100% Server Components**: 0 KB de JS propio. El ticket de ejemplo
  se calcula en build con el motor real (`deriveSettlement`).
- **Calculadora con `next/dynamic`**: el paso 1 viene en el chunk inicial;
  recomendación, resultados e historial en chunks aparte, **precargados con
  `requestIdleCallback`** para que la transición sea instantánea.
- **jsPDF por intención**: ya era dinámico; ahora se pide en `pointerenter`,
  `focus` o `touchstart` del botón, así el click no espera la descarga.
- **Ayuda como Server Component** con una isla cliente mínima para el CTA.
- **Fallback sin flash ni CLS en `/calcular`**: el HTML trae una réplica
  inerte del paso 1 (LCP en el primer paint) y un script inline de una línea
  marca `<html data-calc-resume>` antes del primer paint si hay borrador, para
  mostrar un skeleton en su lugar. Medido contra la versión con skeleton
  genérico: CLS 0,056 → 0 y LCP 2730 → 1867 ms (esta última medición incluye
  también el subset de la fuente).
- Se eliminaron 5 SVG de plantilla sin uso y componentes reemplazados.

### 3. Requests y caching

- **Vercel Analytics solo en Vercel**: en otros hosts el script daba 404 y un
  error en consola en cada página.
- **Prefetch con intención**: el CTA principal prefetchea `/calcular`; links
  secundarios (ayuda, footer, logo) usan `prefetch={false}`. El ancla
  "Cómo funciona" era un `<Link href="#...">` que prefetcheaba la misma
  landing 3 veces: ahora es un `<a>`.
- **Headers**: fuentes y chunks con hash `immutable` por un año (Next);
  íconos e imagen social con `max-age=86400, stale-while-revalidate=604800`;
  headers de seguridad (`nosniff`, `Referrer-Policy`, `X-Frame-Options`,
  `Permissions-Policy`).
- **Todas las rutas son estáticas** (`○` en el build), incluidas manifest,
  íconos e imagen OG.

### 4. "Queries lentas" y N+1

La app no tiene base de datos: su "capa de datos" es `localStorage`, y ahí
estaban los equivalentes.

- **Sondeo de storage en cada operación**: `canUseLocalStorage()` escribía y
  borraba una clave de prueba antes de cada lectura o escritura (2 operaciones
  extra por llamada). Ahora se sondea una vez por instancia
  (`lib/storage/browserStorage.ts`).
- **Borrador escrito en cada tecla**: ahora con debounce de 400 ms, dedupe por
  huella de contenido y flush garantizado en `pagehide` / `visibilitychange`
  (un test E2E recarga inmediatamente después de editar y verifica que no se
  pierde nada).
- **Historial releído en cada guardado**: guardar leía, parseaba y validaba
  todo el historial; después la lista lo volvía a leer con un `refreshKey`.
  Ahora vive en un store en memoria con suscripción
  (`useSyncExternalStore`), se valida una vez y se sincroniza entre pestañas
  con el evento `storage`.
- **N+1 en el PDF**: cada fila de la tabla buscaba su familia con `find()`
  sobre todas (O(n²)). Ahora es un `Map` por id.
- **`Intl.NumberFormat` por monto**: construir un formatter es caro y se
  creaba uno por cada número en pantalla. Ahora se cachean por moneda y
  decimales; las fechas igual.

### 5. Imágenes, fuentes y scripts

- **Fuente**: Bricolage Grotesque variable, autoalojada con `next/font/local`
  y **subset propio** (Latin básico + Latin-1 + puntuación tipográfica, eje de
  peso 400–800): 41,2 KB → 35,4 KB respecto del subset "latin" de Google. El
  build ya no descarga fuentes. Fallback con métricas ajustadas: CLS 0.
- **Foto del ticket**: se decodifica con `createImageBitmap` (fuera del hilo
  principal, sin pasar el archivo a base64) y se recorta tipo *cover* al
  aspecto exacto del PDF. Antes se estiraba a 190×36 mm sin respetar la
  proporción.
- **favicon.ico**: era el de create-next-app (25,9 KB). Ahora es la marca
  propia en 3,4 KB, más `apple-icon`, íconos de manifest y maskable.
- **Imagen social**: JPEG estático de 100 KB prerenderizado con la fuente
  real (no se genera en runtime).
- **Íconos de UI**: SVG inline de pocos bytes, sin librería.

## Experimentos descartados

| Experimento | Resultado | Decisión |
|---|---|---|
| `experimental.inlineCss` | FCP 777 → 923 ms, +26 KB por página (el CSS queda en el HTML y en el payload RSC), LCP de `/calcular` 1857 → 2615 ms | Descartado |
| Fuente con `preload: false` | FCP 777 → 1074 ms y CLS 0,043 en `/ayuda` | Descartado |
| Skeleton genérico en `/calcular` | LCP 2730 ms, CLS 0,056 (el footer saltaba al montar la app) | Reemplazado por la réplica inerte del paso 1 |

## Pendiente / fuera de alcance

- **Monitoreo en producción**: en esta sesión no había MCP de Sentry ni de
  Chrome DevTools conectados; se usó Playwright + CDP + Lighthouse en su
  lugar. La app tiene error boundary (`app/error.tsx`); sumar Sentry sería el
  próximo paso, cargando el SDK de forma diferida para no sumarlo al JS
  inicial.
- **Modo offline**: un service worker haría la app usable sin conexión. Se
  dejó afuera para no introducir problemas de cache vieja sin un plan de
  versionado.
