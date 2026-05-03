# Flujo UX

La app está pensada para usarse desde el celular, en una mesa, con poca paciencia y bastante hambre. Tiene que ser clara, rápida y confiable.

## Flujo guiado

```text
setup -> families -> recommendation -> results
```

## 1. Setup

Objetivo: crear el evento.

UI:

- título de la app
- input de nombre del evento
- botón para avanzar a familias
- acción para probar datos de ejemplo

Reglas:

- el nombre es requerido para avanzar
- si hay un borrador recuperado con solo nombre, se vuelve a este paso

## 2. Families

Objetivo: cargar y mantener la lista de participantes.

Formulario:

- nombre
- cantidad de integrantes
- selector Adulto/Menor si tiene 1 integrante
- monto pagado
- nota o detalle

Lista:

- tarjetas claras por familia
- monto pagado destacado
- badge `No aporta` para menor solo
- edición inline
- eliminación con confirmación visual
- total acumulado

Acciones:

- `Ver recomendación` cuando hay al menos 2 familias
- `Empezar de nuevo` para borrar estado actual y borrador local

## 3. Recommendation

Objetivo: explicar el criterio sugerido y permitir decisión manual.

UI:

- recomendación destacada
- confianza
- razones breves
- selector `Por familia` / `Por persona`
- botón `Ver resultado`

Reglas:

- al entrar al paso, la app selecciona el modo recomendado
- si el usuario cambia el modo, se marca que la recomendación no quedó aceptada todavía
- al confirmar, se guarda si el modo elegido coincide con la recomendación

## 4. Results

Objetivo: cerrar la cuenta.

UI:

- total del evento
- criterio usado
- balances
- transferencias sugeridas
- botón para copiar resumen para WhatsApp
- botón `Editar familias`
- botón `Nuevo evento`

Badges:

- `Paga`
- `Cobra`
- `Equilibrado`
- `No aporta`

## Copiar para WhatsApp

El botón usa `navigator.clipboard` cuando está disponible.

Si el navegador bloquea el copiado, se muestra un fallback visual con el texto en un `textarea` seleccionado para copiar manualmente.

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
- fecha de última edición

La lectura se hace solo del lado cliente, después de hydration.

## Recuperación del borrador

Antes de restaurar, se validan estructura, familias, modos y fecha.

Destino:

- modo confirmado + 2 o más familias: `results`
- familias sin modo confirmado: `families`
- solo nombre: `setup`

Si el storage falla o trae datos inválidos, se ignora el borrador y la app arranca vacía.

## Borrar evento actual

`Empezar de nuevo` y `Nuevo evento` limpian:

- estado React
- selección de criterio
- aceptación de recomendación
- borrador de `localStorage`

## Evento borrador

Evento en edición. Puede estar incompleto. Existe para no perder datos al recargar.

## Evento cerrado

Evento final confirmado para historial local. Todavía no está implementado.

Cuando exista, no debe pisar el borrador actual: serán conceptos separados.

## Limitaciones UX actuales

- No hay historial de eventos cerrados.
- No hay confirmación de cierre final.
- No hay exportación PDF.
- No hay sincronización entre dispositivos.
- No hay modo offline formal, aunque el borrador local ayuda si la página ya cargó.
