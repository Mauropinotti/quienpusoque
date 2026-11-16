// Nombres de archivo de las salidas (ticket PDF, cálculo exportado). Vive
// aparte del generador del PDF para que la UI no arrastre jsPDF al importarlo.

const APP_FILE_PREFIX = "quien-puso-que";

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

/** yyyy-mm-dd en hora local: la fecha que ve el usuario. */
export function formatFileDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** quien-puso-que-{evento}-{yyyy-mm-dd}.{extensión} */
export function buildEventFileName(eventName: string, date: Date, extension: string): string {
  const eventSlug = slugify(eventName) || "evento";
  return `${APP_FILE_PREFIX}-${eventSlug}-${formatFileDate(date)}.${extension}`;
}
