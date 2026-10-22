// Medidas del espacio de la foto en el ticket PDF. Vive separado de
// generateEventTicketPdf.ts para que la UI pueda usarlo sin arrastrar jsPDF
// al bundle principal.

export const TICKET_PHOTO_SLOT_MM = { width: 190, height: 64 } as const;

export const TICKET_PHOTO_ASPECT =
  TICKET_PHOTO_SLOT_MM.width / TICKET_PHOTO_SLOT_MM.height;

/** ~160 dpi sobre 190 mm: nítido impreso y liviano en el PDF. */
export const TICKET_PHOTO_MAX_WIDTH_PX = 1200;

export const TICKET_PHOTO_JPEG_QUALITY = 0.82;
