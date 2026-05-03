# ¿Quién puso qué?

Calculadora mobile first para repartir gastos compartidos en reuniones, asados, viajes y eventos chicos.

La app puede ser divertida. La cuenta no.

Deploy público: `https://quien-puso-que.vercel.app` (placeholder hasta publicar el primer deploy).

## Descripción breve

**¿Quién puso qué?** ayuda a responder, sin planillas ni discusiones eternas, quién pagó de más, quién tiene que poner plata y qué transferencias conviene hacer para cerrar un evento grupal.

Funciona sin backend: todo se calcula en el navegador y el borrador queda guardado localmente.

## El problema que resuelve

Termina la juntada. Una familia compró carne, otra llevó bebidas, alguien pagó hielo, otra familia no puso nada todavía y hay un menor invitado que no debería entrar en la cuenta. La pregunta aparece sola:

> ¿Quién le debe cuánto a quién?

Esta app convierte esos datos en:

- un criterio de reparto claro
- balances por familia
- transferencias sugeridas
- un texto listo para pegar en WhatsApp

## Casos de uso

- Asados, cumpleaños y reuniones familiares.
- Escapadas de fin de semana.
- Compras comunitarias para eventos.
- Grupos donde algunas familias tienen muchos integrantes y otras vienen de a una persona.
- Eventos con menores invitados que no aportan.

## Cómo funciona

1. Creás el evento.
2. Cargás familias: nombre, integrantes, monto pagado y nota opcional.
3. Si una familia tiene 1 integrante, indicás si es adulto o menor.
4. La app recomienda repartir por familia o por persona.
5. Podés aceptar la recomendación o elegir manualmente.
6. Se calculan balances y transferencias.
7. Copiás el resumen para WhatsApp.
8. Descargás el ticket PDF final.

La app también incluye una ayuda visible en `/ayuda`, pensada para usuarios no técnicos. Explica cómo cargar familias, cuándo una familia aporta, cómo se elige el criterio y cómo leer balances y transferencias.

## Familias de un solo integrante

La regla especial vive en `lib/calculations/eligibility.ts`.

| Caso | Entra en el reparto | Personas elegibles |
|---|---:|---:|
| 1 adulto | Sí | 1 |
| 1 menor | No | 0 |
| 2 o más integrantes | Sí | cantidad de integrantes |

Una familia de 1 menor queda marcada como **no aportante**. No paga, no cobra y no genera transferencias.

## Reparto por familia

Cada familia habilitada paga una parte igual del gasto total.

```text
cuota_por_familia = gasto_total / familias_habilitadas
```

Es simple y suele funcionar bien cuando los grupos tienen tamaños parecidos o cuando el evento se quiere cerrar rápido.

## Reparto por persona

Cada integrante habilitado cuenta como una parte.

```text
cuota_por_persona = gasto_total / personas_habilitadas
cuota_familia = cuota_por_persona * integrantes_habilitados_de_la_familia
```

Es más fino cuando hay familias de tamaños muy distintos.

## Motor de recomendación

El motor está en `lib/calculations/recommendSplitMode.ts`.

No decide por capricho: calcula métricas del grupo y genera señales con peso.

- Muchas familias de 1 adulto favorecen `by-person`.
- Muchas familias grandes favorecen `by-family`.
- Si el impacto económico entre criterios es alto, favorece `by-person`.
- Si el impacto es bajo y los tamaños son parecidos, favorece `by-family`.
- Si no hay una señal fuerte, sugiere `by-family` por simpleza y con confianza baja.

La recomendación es una ayuda. El usuario siempre puede elegir otro criterio.

## Cálculo de balances

El cálculo principal está en `lib/calculations/calculateBalances.ts`.

```text
balance = monto_pagado - cuota_esperada
```

| Balance | Estado | Significado |
|---:|---|---|
| mayor a 0 | cobra | puso de más |
| menor a 0 | paga | puso de menos |
| igual a 0 | equilibrado | está justo |
| familia no elegible | no aporta | no entra en el reparto |

Los estados son parte del contrato `FamilyBalance`. Los componentes los muestran, no los reinterpretan.

## Cálculo de transferencias

El cálculo está en `lib/calculations/calculateTransfers.ts`.

La app separa:

- deudores: familias con estado `pays`
- acreedores: familias con estado `receives`

Luego aplica un emparejamiento greedy ordenado de mayor a menor deuda o crédito. El objetivo es generar pocas transferencias, con montos enteros en pesos.

## Persistencia local del borrador

El evento actual se guarda automáticamente en `localStorage` con la clave:

```text
quien-puso-que:current-draft
```

Se guarda:

- nombre del evento
- moneda
- familias cargadas
- modo seleccionado
- modo confirmado, si existe
- si se aceptó o no la recomendación
- fecha de creación
- fecha de última edición

La recuperación ocurre solo del lado cliente y valida datos antes de usarlos. Si `localStorage` no está disponible, la app sigue funcionando sin persistencia.

## Historial local de eventos cerrados

El historial local guarda eventos ya calculados en `localStorage`, separados del borrador actual.

Clave:

```text
quien-puso-que:closed-events
```

Un **evento borrador** es el evento en edición. Un **evento cerrado** es una foto final del cálculo confirmado por el usuario.

Cada evento cerrado guarda:

- id
- nombre
- fecha de creación
- fecha de cierre
- total
- criterio usado
- snapshot de familias
- snapshot de balances
- snapshot de transferencias
- snapshot de recomendación
- nota opcional

El historial se consulta desde el inicio de la app y permite borrar eventos cerrados individualmente. No guarda imágenes ni archivos pesados.

## Ticket PDF final

El ticket PDF es la salida formal del sistema. Se genera desde resultados con el botón `Descargar ticket PDF`.

Incluye:

- nombre de la app y del evento
- fecha de generación
- foto opcional del evento
- gasto total
- familias cargadas y habilitadas
- personas habilitadas
- criterio usado
- criterio recomendado y confianza
- explicación breve del criterio
- tabla de familias, cuotas, balances y estados
- familias no aportantes
- transferencias sugeridas
- nota de cierre

La foto opcional se procesa localmente en el navegador. No se sube a servidores, no se guarda en historial y no se persiste en `localStorage`.

## Ejemplo completo

Evento: **Asado del sábado**

| Familia | Integrantes | Tipo | Pagó |
|---|---:|---|---:|
| Los García | 4 | - | $8.000 |
| Los Rodríguez | 2 | - | $3.000 |
| Los López | 1 | adulto | $0 |
| Los Martínez | 1 | menor | $0 |
| Los Fernández | 3 | - | $5.000 |

Total: **$16.000**. Familias habilitadas: 4. Personas habilitadas: 10. Los Martínez no aportan porque es un menor sin cargo.

Con reparto por familia:

```text
cuota = 16.000 / 4 = 4.000
```

Balances:

- Los García cobra $4.000.
- Los Rodríguez paga $1.000.
- Los López paga $4.000.
- Los Martínez no aporta.
- Los Fernández cobra $1.000.

Transferencias sugeridas:

- Los López le transfiere $4.000 a Los García.
- Los Rodríguez le transfiere $1.000 a Los Fernández.

## Stack técnico

- Next.js App Router (`next` 16.2.4 en `package.json`)
- React 19
- TypeScript
- Tailwind CSS v4
- nanoid
- jsPDF para generar el ticket PDF en el navegador
- Sin backend
- Sin base de datos
- Sin autenticación

## Correr localmente

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`.

Para verificar producción:

```bash
npm run lint
npm test
npm run build
```

## Desplegar en Vercel

1. Subir el repo a GitHub.
2. Importarlo desde Vercel.
3. Usar la configuración automática para Next.js.
4. Deploy.

No requiere variables de entorno para el MVP.

## Estado del proyecto

- [x] Flujo mobile first: setup, familias, recomendación y resultados.
- [x] Alta, edición y eliminación de familias.
- [x] Reglas de elegibilidad.
- [x] Reparto por familia y por persona.
- [x] Motor de recomendación.
- [x] Balances y transferencias.
- [x] Resumen para WhatsApp con fallback de copiado.
- [x] Borrador local en `localStorage`.
- [x] Historial local de eventos cerrados.
- [x] Tests automatizados.
- [x] Ticket PDF final con foto opcional local.
- [x] Ayuda visible para usuarios finales.

## Roadmap

- Exportar o compartir eventos cerrados.
- Tests unitarios para cálculos y storage.
- Mejoras de accesibilidad y QA visual responsive.
- Soporte opcional para más monedas.
- Mejoras visuales del ticket PDF y opciones de impresión.

## Licencia

Licencia pendiente de definir. Antes de publicar el repo como open source conviene agregar un archivo `LICENSE`.

## Filosofía

- Cálculos claros antes que magia.
- UI amable, pero resultados precisos.
- Sin backend mientras el problema pueda resolverse bien en el navegador.
- Separación estricta entre lógica de negocio y componentes.
- Texto en español argentino, directo y sin solemnidad innecesaria.
