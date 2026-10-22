import type { EventTicketPhoto } from "@/types/pdf";
import {
  TICKET_PHOTO_ASPECT,
  TICKET_PHOTO_JPEG_QUALITY,
  TICKET_PHOTO_MAX_WIDTH_PX,
} from "@/lib/pdf/ticketPhoto";

export interface CropRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

/**
 * Recorte centrado tipo `object-fit: cover` para llevar una imagen de
 * cualquier proporción al aspecto del ticket sin deformarla.
 */
export function computeCoverCrop(
  sourceWidth: number,
  sourceHeight: number,
  targetAspect: number
): CropRect {
  const sourceAspect = sourceWidth / sourceHeight;

  if (sourceAspect > targetAspect) {
    // Más ancha que el destino: se recortan los costados.
    const sw = Math.round(sourceHeight * targetAspect);
    return { sx: Math.round((sourceWidth - sw) / 2), sy: 0, sw, sh: sourceHeight };
  }

  // Más alta que el destino: se recorta arriba y abajo.
  const sh = Math.round(sourceWidth / targetAspect);
  return { sx: 0, sy: Math.round((sourceHeight - sh) / 2), sw: sourceWidth, sh };
}

/** Tamaño final: nunca agranda una imagen chica. */
export function computeOutputSize(
  crop: CropRect,
  targetAspect: number,
  maxWidth: number
): { width: number; height: number } {
  const width = Math.min(maxWidth, crop.sw);
  return { width, height: Math.round(width / targetAspect) };
}

interface DecodedImage {
  source: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
}

async function decodeImage(file: File): Promise<DecodedImage> {
  // createImageBitmap decodifica fuera del hilo principal y respeta la
  // orientación EXIF. Evita además pasar el archivo completo a base64.
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        release: () => bitmap.close(),
      };
    } catch {
      // Safari viejo o formato no soportado: probamos con <img>.
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      release: () => URL.revokeObjectURL(url),
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

/**
 * Prepara la foto opcional del ticket en el navegador: recorta al aspecto del
 * PDF, achica y comprime a JPEG. No sube nada ni persiste nada.
 */
export async function prepareTicketPhoto(file: File): Promise<EventTicketPhoto> {
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo no es una imagen.");
  }

  const decoded = await decodeImage(file);

  try {
    const crop = computeCoverCrop(decoded.width, decoded.height, TICKET_PHOTO_ASPECT);
    const output = computeOutputSize(crop, TICKET_PHOTO_ASPECT, TICKET_PHOTO_MAX_WIDTH_PX);

    const canvas = document.createElement("canvas");
    canvas.width = output.width;
    canvas.height = output.height;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("El navegador no permitió preparar la imagen.");

    context.imageSmoothingQuality = "high";
    context.drawImage(
      decoded.source,
      crop.sx,
      crop.sy,
      crop.sw,
      crop.sh,
      0,
      0,
      output.width,
      output.height
    );

    return {
      dataUrl: canvas.toDataURL("image/jpeg", TICKET_PHOTO_JPEG_QUALITY),
      name: file.name,
      type: "image/jpeg",
      size: file.size,
    };
  } finally {
    decoded.release();
  }
}
