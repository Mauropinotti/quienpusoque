# Ticket PDF

El ticket PDF es la salida formal del cálculo de **¿Quién puso qué?**. Se genera al final del flujo, desde la pantalla de resultados.

## Objetivo

Crear un documento compartible e imprimible con el resumen completo del evento:

- datos generales
- criterio usado
- recomendación de la app
- cómo se calculó, paso a paso, y lo que le toca a cada familia
- familias y balances, con el detalle de lo que puso cada una
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

`buildEventTicketPdf(data)` arma el documento y lo devuelve sin descargarlo
(lo usan los tests para leer el contenido); `generateEventTicketPdf(data)` lo
arma y lo descarga. El nombre del archivo sale de `lib/formatting/fileName.ts`,
compartido con el cálculo exportado.

Tipos:

```text
types/pdf.ts
```

## Estructura del PDF

El diseño usa la misma paleta que la app (papel, brasa y carbón). Sin foto,
5 familias con su desglose y la cuenta por persona (pasos + "Le toca a cada
familia") entran en una sola hoja A4. Con foto, o con más familias, el ticket
pasa a una segunda hoja: se priorizó que cada cosa y cada paso del cálculo se
lean completos antes que comprimirlos.

1. Encabezado en tinta con el nombre de la app y acento de brasa.
2. Nombre del evento.
3. Fecha de generación.
4. Foto opcional del evento (190 × 64 mm).
5. Resumen general en grilla de 3 columnas:
   - gasto total
   - familias cargadas
   - familias que aportan
   - adultos + menores (de las familias que aportan)
   - criterio usado (por ejemplo, "por persona, menores al 50%")
   - base recomendada (por familia / por persona)
6. Explicación breve del criterio y su regla.
6b. **Cómo se calculó**: una operación por renglón, con montos que ya
    aparecieron antes (sale de `describeSplitSteps`, el mismo texto del ticket
    y del WhatsApp). Con menores al 50% muestra la parte igual, lo que paga
    cada menor, lo que dejan de pagar, cuánto suma cada adulto y lo que paga.
6c. **Le toca a cada familia** (criterios por persona): "Los Pérez: 2 adultos ×
    $1.750,00 + 1 menor × $750,00 = $4.250,00".
7. Tabla de familias:
   - nombre
   - adultos
   - menores
   - monto pagado (en negrita, igual que el nombre)
   - le toca (cuota correspondiente)
   - balance
   - estado
   - debajo de cada familia, cada cosa que puso ("· Carne") con su monto en
     la columna "Pagó", así la suma se puede chequear a ojo. Las
     descripciones largas siguen en el renglón de abajo con sangría.
8. Familias no aportantes (sin adultos), con su composición.
9. Transferencias sugeridas.
10. Nota de cierre, como pie discreto sin título, que termina con
    `¡Cuentas claras siempre!`
11. Pie de página: `desarrollado por MauroHP - Lista 127 8B 2026.-`

Los títulos de sección reservan lugar para su primer bloque: nunca quedan
huérfanos al pie de una hoja. Una familia nunca se separa de su detalle y, si
la tabla sigue en otra hoja, repite el encabezado. La tabla de familias usa
un `Map` por id para cruzar balances con familias (antes era un `find()` por
fila).

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
