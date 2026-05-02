# Flujo UX

## Pasos del flujo guiado

```text
[setup] -> [families] -> [recommendation] -> [results]
```

## 1. Setup

- Nombre del evento.
- Acción para probar con datos de ejemplo.
- Si existe un borrador recuperado, el nombre vuelve cargado automáticamente.

## 2. Families

- Formulario para agregar familias.
- Campos: nombre, integrantes, tipo Adulto/Menor si tiene 1 integrante, monto pagado y nota.
- Lista de familias cargadas.
- Edición inline desde cada tarjeta.
- Eliminación con confirmación visual.
- Acción “Empezar de nuevo” para borrar el evento actual y su borrador local.

## 3. Recommendation

- Muestra el criterio recomendado con razones.
- Permite aceptar la recomendación o elegir manualmente.
- Al confirmar, se guarda si la recomendación fue aceptada o no.

## 4. Results

- Total del evento.
- Criterio usado.
- Balances con badges: paga, cobra, no aporta, equilibrado.
- Transferencias sugeridas.
- Botón para copiar resumen para WhatsApp.
- Acción “Nuevo evento” para borrar el evento actual y limpiar el borrador.

## Persistencia local

El evento actual se guarda automáticamente como borrador en `localStorage`, con la clave:

```text
quien-puso-que:current-draft
```

Se guarda:

- nombre del evento
- moneda
- familias cargadas
- modo seleccionado
- modo confirmado
- si el criterio recomendado fue aceptado o no
- fecha de última edición

## Recuperación

La recuperación ocurre solo del lado cliente, después de hidratar la app. Antes de usar un borrador se validan estructura, tipos, familias, modo de reparto y fecha.

- Si el borrador tiene criterio confirmado y al menos 2 familias, vuelve a resultados.
- Si tiene familias pero no criterio confirmado, vuelve a familias.
- Si solo tiene nombre de evento, vuelve a setup.

## Limitaciones

- El borrador existe solo en el navegador actual.
- No sincroniza entre dispositivos.
- Puede perderse si el usuario limpia datos del sitio.
- En modo incógnito puede durar solo hasta cerrar la sesión.
- Si `localStorage` no está disponible, la app sigue funcionando sin persistencia.
