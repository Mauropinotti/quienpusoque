# Ticket PDF

El ticket PDF es la salida formal del cálculo de **¿Quién puso qué?**. Se genera al final del flujo, desde la pantalla de resultados.

## Objetivo

Crear un documento compartible e imprimible con el resumen completo del evento:

- datos generales
- criterio usado
- recomendación de la app
- familias y balances
- familias no aportantes
- transferencias sugeridas
- nota de cierre

## Generación técnica

La generación ocurre 100% del lado cliente usando `jsPDF`.

No se usa backend, base de datos, autenticación ni captura visual de pantalla. El PDF se arma de forma estructurada con texto, tablas, colores e imagen opcional.

## Por qué jsPDF

Se incorpora `jsPDF` porque permite construir PDFs reales desde el navegador sin servidor y sin depender de screenshots. Es una dependencia razonable para esta fase porque el PDF pasa a ser la salida principal del sistema.

## Archivo principal

```text
lib/pdf/generateEventTicketPdf.ts
```

Componentes y módulos relacionados:

```text
components/results/ExportPdfButton.tsx   botón + carga diferida de jsPDF
components/event/EventPhotoUploader.tsx  selector de foto con vista previa
lib/image/prepareTicketPhoto.ts          recorte y compresión de la foto
lib/pdf/ticketPhoto.ts                   medidas del espacio de la foto
```

`ticketPhoto.ts` vive separado del generador para que la UI pueda usar las
medidas sin arrastrar jsPDF al bundle principal.

## Carga de jsPDF

jsPDF (~134 KB comprimido) está en su propio chunk. `ExportPdfButton` lo pide
cuando el usuario muestra intención (`pointerenter`, `focus` o `touchstart`
sobre el botón), así el click no espera la descarga. Los datos del ticket se
arman al hacer click (`getData`), de modo que la fecha de generación es la del
momento de la descarga.

Tipos:

```text
types/pdf.ts
```

## Estructura del PDF

El diseño usa la misma paleta que la app (papel, brasa y carbón) y, con foto
y hasta 5 o 6 familias, entra en una sola hoja A4.

1. Encabezado en tinta con el nombre de la app y acento de brasa.
2. Nombre del evento.
3. Fecha de generación.
4. Foto opcional del evento (190 × 64 mm).
5. Resumen general en grilla de 3 columnas:
   - gasto total
   - familias cargadas
   - familias habilitadas
   - personas habilitadas
   - criterio usado
   - criterio recomendado
6. Explicación breve del criterio.
7. Tabla de familias:
   - nombre
   - integrantes
   - adulto / menor si corresponde
   - monto pagado
   - cuota correspondiente
   - balance
   - estado
8. Familias no aportantes.
9. Transferencias sugeridas.
10. Nota de cierre, como pie discreto sin título, que termina con
    `¡Cuentas claras siempre!`
11. Pie de página: `desarrollado por MauroHP - Lista 127 8B 2026.-`

Los títulos de sección reservan lugar para su primer bloque: nunca quedan
huérfanos al pie de una hoja. La tabla de familias usa un `Map` por id para
cruzar balances con familias (antes era un `find()` por fila).

## Foto opcional

La foto se selecciona desde el dispositivo del usuario.

Privacidad:

- no se sube a servidores
- no se guarda en `localStorage`
- no queda en el historial
- se usa solo para armar el PDF actual

Procesamiento (`lib/image/prepareTicketPhoto.ts`):

- se decodifica con `createImageBitmap`, fuera del hilo principal y respetando
  la orientación EXIF (con fallback a `<img>` + `URL.createObjectURL`)
- se recorta centrada tipo *cover* al aspecto exacto del espacio del PDF
  (190:64), así nunca se deforma
- se reduce a un máximo de 1200 px de ancho (~160 dpi impreso), sin agrandar
  imágenes chicas
- se exporta como JPEG al 82% para insertar en el PDF

La vista previa en pantalla usa la misma proporción: lo que se ve es lo que se
imprime.

Si falla la imagen, el PDF puede generarse igual sin foto.

## Nombre del archivo

Formato:

```text
quien-puso-que-{nombre-del-evento}-{yyyy-mm-dd}.pdf
```

Ejemplo:

```text
quien-puso-que-asado-del-sabado-2026-05-02.pdf
```

## Limitaciones

- La calidad de la foto depende del archivo original y del navegador.
- El ticket no guarda imágenes pesadas en historial local.
- En navegadores con restricciones de descarga, puede fallar la descarga automática.
- No hay edición manual del PDF antes de descargar.
- No hay firma digital ni comprobante legal: es un resumen de cálculo generado con datos cargados por el usuario.

## Decisiones de privacidad

El PDF mantiene el modelo local del MVP:

- cálculo local
- imagen local
- descarga local
- sin envío de datos
- sin almacenamiento remoto

Si una fase futura agrega compartir en la nube, debe ser opcional y documentar claramente qué se sube.
