# Flujo UX

La app está pensada para usarse desde el celular, en una mesa, con poca paciencia y bastante hambre. Tiene que ser clara, rápida y confiable.

## Rutas

```text
/          landing (presentación + botón de inicio)
/calcular  calculadora: setup -> families -> recommendation -> results
/ayuda     guía para usuarios no técnicos
```

Todas se prerenderizan estáticas. No hay backend.

## Lenguaje visual

"Papel, brasa y carbón": fondo de papel punteado, bordes de tinta, sombras
duras y acentos color brasa. El resultado se presenta como un **ticket
térmico** con bordes en zigzag, que es también el objeto que se comparte.

- Texto siempre en tinta sobre brasa (el blanco sobre brasa no pasa contraste).
- Números en monoespaciada con cifras tabulares.
- Animaciones solo en CSS. Con `prefers-reduced-motion` se desactivan.

## Landing (`/`)

Objetivo: explicar en segundos qué hace la app y llevar al cálculo.

- Título con palabras que rotan: "¿Quién puso el carbón? / el hielo? / … / qué?"
- Botón principal **Empezar el cálculo** → `/calcular`.
- Link secundario **Ver un asado de ejemplo** → `/calcular?demo=1`.
- Ticket de muestra calculado en build con el motor real (no es una imagen).
- Cinta animada, "Tres pasos y a la sobremesa" y bloque de privacidad.
- **Progreso** (`#versiones`): la versión actual ("Quienpusoque V1.3") con sus
  novedades y el historial de versiones. Se llega desde el aviso "Nuevo ·
  Quienpusoque V1.3" del inicio, el menú (`Novedades`) y el pie, que muestra
  la versión en todas las páginas. Los datos salen de `lib/releases.ts`.

## Arranque de la calculadora

El estado vive en el navegador, así que la calculadora se monta del lado
cliente. Para que eso no se note:

- Visitante nuevo: el HTML ya trae una réplica inerte del paso 1; cuando la
  app monta, la reemplaza sin moverse nada.
- Hay borrador o `?demo`: un script inline marca `<html data-calc-resume>`
  antes del primer paint y se muestra un skeleton neutro. Nunca aparece el
  paso 1 para después saltar a otro paso.
- `?demo` carga el ejemplo y se quita de la URL, para que recargar no pise lo
  que el usuario edite después.

## 1. Setup

Objetivo: crear el evento.

- Pregunta: "¿Cómo se llama la juntada?"
- Input `Nombre del evento` dentro de un `<form>`: Enter avanza.
- Sugerencias rápidas: Asado del sábado, Cumple, Escapada, Cena de fin de año.
- Botón `Cargar familias` (deshabilitado sin nombre).
- Tarjeta `Probar con datos de ejemplo`.
- Tarjeta `¿Tenés un cálculo guardado?` con `Importar cálculo`: carga un
  archivo exportado antes y retoma la cuenta (ver "Exportar e importar").
- Si hay borrador: aviso y `Empezar de nuevo`.
- Historial de cuentas cerradas debajo.

## 2. Families

Objetivo: cargar y mantener la lista de participantes.

Formulario `Sumá una familia`:

- nombre
- **¿Quiénes vienen?**: dos contadores − / + para `Adultos` y `Menores`
  (0 a 20 cada uno, al menos una persona). Por defecto, 2 adultos.
- sin adultos (menores que vinieron solos): casilla **Va a pagar su parte**.
  Marcada, entran en la cuenta y su parte la paga su padre, madre o tutor; sin
  marcar, quedan invitados
- **¿Qué puso?**: una fila por cosa, con `Qué puso` y `Cuánto salió` (prefijo
  `$`, acepta coma o punto decimal). `Sumar otra cosa` agrega una fila (hasta
  12) y lleva el foco a ella; el tacho la quita.
- `Total que puso` se calcula en vivo con la suma de las filas: el usuario no
  lo tipea.
- menores solos invitados: en lugar de las filas, `Monto pagado` bloqueado en $0.
- en el celular cada fila ocupa dos renglones (qué / cuánto); desde `sm`, uno
- los errores aparecen al intentar agregar, no mientras se tipea; una cosa sin
  monto se marca en su propia fila

La validación vive en `lib/forms/familyForm.ts`.

Lista `En la mesa`:

- tarjeta por familia con avatar, "2 adultos y 1 menor" (puntos llenos y
  puntos mostaza), total y, debajo, cada cosa con su monto
- `Exportar cálculo` junto al título (si hay al menos una familia)
- badge `No aporta` para menores solos invitados y `Paga su tutor` para los
  que pagan su parte
- edición inline y eliminación con confirmación
- avisos si no hay gasto o falta una familia que aporte

Barra fija inferior con el total puesto y `Cómo repartir` (requiere al menos 2
familias en la cuenta y algún adulto).

## 3. Criterion: ¿Cómo pagan los menores?

Objetivo: elegir cuánto cuenta cada menor. Desde V1.3 no hay sugerencia
automática ni reparto "por familia": siempre se reparte por persona, por
porciones (ver `docs/calculation-model.md`).

- Encabezado `¿Cómo pagan los menores?` con una línea que explica las
  porciones.
- Conteo: familias en la cuenta, adultos, menores con su familia y menores
  solos que pagan.
- Radios nativos (flechas del teclado y lectores de pantalla sin código
  extra), cada uno con lo que pagaría un adulto y un menor:
  - `Igual que un adulto (100%)`: cada menor es una porción entera.
  - `La mitad (50%)`: cada menor es media porción; paga la mitad que un adulto.
  - `No pagan (0%)`: el total se divide entre los adultos.
- Sin menores en la cuenta no se pregunta: todos pagan una parte igual.
- **Menores que vinieron solos**: lista con su estado (paga su parte a
  través de su tutor / invitado). Se cambia editando la familia.
- Tabla **Así le toca a cada uno**: lo que pondría cada familia con 100%, 50%
  y 0%, resaltando la opción elegida.
- Botón fijo `Ver resultado`.

Reglas:

- por defecto, 100%; la elección se recuerda al volver a familias y abrir el
  paso otra vez
- al confirmar, el criterio queda guardado en el borrador

## 4. Results

Objetivo: cerrar la cuenta.

- Título `¡Cuenta cerrada!`.
- El ticket: por familia, nombre, estado y balance; debajo, "2 adultos y 1
  menor", cada cosa que puso con su monto, "puso · le tocaba" y la cuenta
  ("= 1 adulto × $1.846,15 + 1 menor × $923,08"). Los menores solos que pagan
  llevan la marca "Menor · paga su parte a través de su padre, madre o
  tutor". Después el total, el criterio con
  la parte unitaria, **Cómo se repartió** (los pasos del cálculo) y **Quién le
  pasa a quién** con las transferencias numeradas. Si transfiere o cobra un
  menor solo, aparece "Padre/madre o tutor encargado de {nombre}".
- Bloque `Compartir y cerrar`:
  - `Copiar resumen para WhatsApp`
  - `Descargar ticket PDF`
  - foto opcional del evento
  - `Exportar cálculo`
  - `Guardar en el historial`
- `Editar familias` y `Nuevo evento` (este último pide confirmación).

Badges:

- `Paga`
- `Cobra`
- `Equilibrado`
- `No aporta`

## Copiar para WhatsApp

El resumen incluye el criterio, **Cómo se calculó** (los mismos pasos del
ticket), **Lo que puso cada uno** (cada familia con su total y cada cosa con
su monto; una sola cosa va en la misma línea), **Le toca a cada familia** (la
cuenta de cada una) y los menores solos invitados. Las transferencias de un
menor solo dicen "Padre/madre o tutor encargado de {nombre} le transfiere…".

El botón usa `navigator.clipboard` cuando está disponible.

Si el navegador bloquea el copiado, se muestra un fallback visual con el texto en un `textarea` seleccionado para copiar manualmente.

## Descargar ticket PDF

El usuario puede seleccionar una foto opcional y descargar un ticket PDF desde resultados.

La foto:

- se procesa localmente (`lib/image/prepareTicketPhoto.ts`)
- se recorta a la proporción del PDF; la vista previa muestra exactamente ese recorte
- no se sube a servidores
- no se guarda en historial
- no se persiste en el borrador

El PDF se genera con datos estructurados del cálculo, no capturando la pantalla. Si no hay foto, se genera igual. Ver `docs/pdf-ticket.md`.

## Exportar e importar

Para seguir una cuenta otro día o en otro dispositivo, sin servidor.

- `Exportar cálculo` (paso 2, junto a `En la mesa`, y en `Compartir y
  cerrar`) baja `quien-puso-que-{evento}-{yyyy-mm-dd}.json` con el estado en
  curso: nombre, moneda, familias con su desglose, criterio elegido y
  confirmado, y fecha de creación. No incluye la foto ni el historial.
- `Importar cálculo` (paso 1) lee ese archivo. Si ya hay una cuenta en curso,
  pide confirmación antes de reemplazarla. Lo importado se retoma en la carga
  de familias y pasa a ser el borrador.
- Todo el archivo se valida antes de tocar el estado (`lib/exchange/eventFile.ts`):
  formato y versión, moneda, fechas, familias, ids únicos y desglose. Los
  totales se recalculan desde el desglose. Si algo no cierra, no se carga nada
  y se explica por qué.
- La versión 3 guarda solo criterios por persona y `paysOwnShare` en menores
  solos. La 2 (adultos y menores) y la 1 (integrantes) se siguen importando:
  "por familia" queda sin confirmar y la aceptación de la sugerencia se ignora
  (ver `docs/calculation-model.md`).

Formato:

```json
{
  "format": "quien-puso-que/calculo",
  "version": 3,
  "exportedAt": "2026-11-16T15:00:00.000Z",
  "event": {
    "eventName": "Asado del sábado",
    "currency": "ARS",
    "createdAt": "2026-11-16T14:30:00.000Z",
    "splitMode": null,
    "selectedMode": "by-person-minors-half",
    "families": [
      {
        "id": "demo-garcia",
        "name": "Los García",
        "adults": 2,
        "minors": 2,
        "paidAmount": 8000,
        "items": [
          { "description": "Carne", "amount": 6500 },
          { "description": "Carbón", "amount": 1500 }
        ]
      }
    ]
  }
}
```

## Persistencia local del borrador

La app guarda el evento actual en `localStorage`:

```text
quien-puso-que:current-draft
```

Datos:

- nombre del evento
- moneda
- familias
- modo seleccionado
- modo confirmado
- fecha de creación
- fecha de última edición

Cuándo se escribe:

- con debounce de 400 ms (tipear un nombre es una sola escritura)
- solo si el contenido cambió
- siempre al ocultar o cerrar la pestaña (`pagehide` / `visibilitychange`)

## Recuperación del borrador

La lectura ocurre solo en el cliente, al inicializar el estado de la
calculadora. Antes de restaurar, se validan estructura, familias, modos y fecha.

Destino:

- modo confirmado + 2 o más familias: `results`
- familias sin modo confirmado: `families`
- solo nombre: `setup`

Si el storage falla o trae datos inválidos, se ignora el borrador y la app arranca vacía.

## Borrar evento actual

`Empezar de nuevo` y `Nuevo evento` limpian:

- estado de la calculadora
- selección de criterio
- borrador de `localStorage`

## Evento borrador

Evento en edición. Puede estar incompleto. Existe para no perder datos al recargar.

## Evento cerrado

Evento final confirmado para historial local. Es una foto del resultado calculado, separada del borrador actual.

Se guarda en:

```text
quien-puso-que:closed-events
```

Guardar un evento cerrado no borra automáticamente el borrador. El usuario puede seguir editando o empezar uno nuevo. Si el navegador no permite guardar, se muestra un aviso.

## Historial local

El historial se muestra en el paso 1 como `Cuentas cerradas`. Cada tarjeta permite:

- ver total, fecha, criterio y cantidad de familias
- desplegar transferencias
- borrar el evento cerrado con confirmación visual

La lista se actualiza sola al guardar o borrar, y también si se modifica desde otra pestaña.

Si `localStorage` está vacío, se muestra un estado vacío y el flujo principal sigue igual.

## Limitaciones UX actuales

- El historial solo existe en el navegador actual.
- El PDF se descarga localmente; no hay almacenamiento remoto.
- La foto del PDF no se guarda para futuras sesiones.
- No hay sincronización entre dispositivos: para pasar una cuenta de un
  celular a otro se exporta el archivo y se importa en el otro.
- No hay modo offline formal, aunque el borrador local ayuda si la página ya cargó.

## Ayuda para usuarios

La página `/ayuda` explica:

- qué hace la app
- cómo crear un evento
- cómo cargar familias y lo que puso cada una
- cómo exportar e importar un cálculo
- adultos y menores, y cómo pagan los menores (100%, 50% o 0%)
- quién paga y quién no paga
- reparto por porciones y menores solos que pagan su parte
- balances, cobros, pagos y transferencias
- salidas: pantalla, WhatsApp, PDF e historial local

El botón final vuelve a la calculadora. Si hay borrador local, dice `Seguir con mi cuenta`; si no, `Empezar el cálculo`.

## Errores y páginas inexistentes

- `app/not-found.tsx`: 404 con salida a la calculadora y al inicio.
- `app/error.tsx`: si algo falla al renderizar, permite reintentar; el borrador sigue guardado.
