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
- Si hay borrador: aviso y `Empezar de nuevo`.
- Historial de cuentas cerradas debajo.

## 2. Families

Objetivo: cargar y mantener la lista de participantes.

Formulario `Sumá una familia`:

- nombre
- integrantes del 1 al 5 (botones con puntitos)
- selector Adulto/Menor si tiene 1 integrante
- monto pagado con prefijo `$` (bloqueado en $0 si es 1 menor); acepta coma o punto decimal
- nota o detalle opcional
- los errores aparecen al intentar agregar, no mientras se tipea

La validación vive en `lib/forms/familyForm.ts`.

Lista `En la mesa`:

- tarjeta por familia con avatar, integrantes, nota y monto
- badge `No aporta` para menor solo
- edición inline y eliminación con confirmación
- avisos si no hay gasto o falta una familia que aporte

Barra fija inferior con el total puesto y `Ver recomendación` (requiere al
menos 2 familias y 2 habilitadas).

## 3. Recommendation

Objetivo: explicar el criterio sugerido y permitir decisión manual.

- Tarjeta "Nuestra sugerencia" con el criterio, medidor de confianza y razones.
- Selector `Por familia` / `Por persona` con radios nativos (flechas del
  teclado y lectores de pantalla funcionan sin código extra).
- Tabla **Así le toca a cada uno**: lo que pondría cada familia con cada
  criterio, resaltando el elegido.
- Métricas del grupo.
- Botón fijo `Ver resultado`.

Reglas:

- al entrar al paso, la app selecciona el modo recomendado
- si el usuario cambia el modo, se marca que la recomendación no quedó aceptada todavía
- al confirmar, se guarda si el modo elegido coincide con la recomendación

## 4. Results

Objetivo: cerrar la cuenta.

- Título `¡Cuenta cerrada!`.
- El ticket: balances por familia con su estado, total, criterio con cuota
  unitaria y **Quién le pasa a quién** con las transferencias numeradas.
- Bloque `Compartir y cerrar`:
  - `Copiar resumen para WhatsApp`
  - `Descargar ticket PDF`
  - foto opcional del evento
  - `Guardar en el historial`
- `Editar familias` y `Nuevo evento` (este último pide confirmación).

Badges:

- `Paga`
- `Cobra`
- `Equilibrado`
- `No aporta`

## Copiar para WhatsApp

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
- aceptación de recomendación
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
- aceptación de recomendación
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
- No hay sincronización entre dispositivos.
- No hay modo offline formal, aunque el borrador local ayuda si la página ya cargó.

## Ayuda para usuarios

La página `/ayuda` explica:

- qué hace la app
- cómo crear un evento
- cómo cargar familias
- reglas para adulto / menor
- quién paga y quién no paga
- diferencia entre reparto por familia y por persona
- balances, cobros, pagos y transferencias
- salidas: pantalla, WhatsApp, PDF e historial local

El botón final vuelve a la calculadora. Si hay borrador local, dice `Seguir con mi cuenta`; si no, `Empezar el cálculo`.

## Errores y páginas inexistentes

- `app/not-found.tsx`: 404 con salida a la calculadora y al inicio.
- `app/error.tsx`: si algo falla al renderizar, permite reintentar; el borrador sigue guardado.
