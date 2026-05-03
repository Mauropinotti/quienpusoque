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

Componentes relacionados:

```text
components/results/ExportPdfButton.tsx
components/event/EventPhotoUploader.tsx
```

Tipos:

```text
types/pdf.ts
```

## Estructura del PDF

1. Nombre de la app: `¿Quién puso qué?`
2. Nombre del evento.
3. Fecha de generación.
4. Foto opcional del evento.
5. Resumen general:
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
10. Nota de cierre.
11. Firma visual: `Cuentas claras siempre!`
12. Pie de página: `desarrollado por MauroHP - Lista 127 8B 2026.-`

## Foto opcional

La foto se selecciona desde el dispositivo del usuario.

Privacidad:

- no se sube a servidores
- no se guarda en `localStorage`
- no queda en el historial
- se usa solo para armar el PDF actual

Procesamiento:

- se lee con `FileReader`
- se carga en un `canvas`
- se reduce a un tamaño razonable
- se exporta como JPEG comprimido para insertar en el PDF

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
