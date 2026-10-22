// Formatters de fecha reutilizables (crear Intl.DateTimeFormat es caro).

const shortDateTime = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const mediumDateTime = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "medium",
  timeStyle: "short",
});

/** 03/05/2026, 15:00 */
export function formatShortDateTime(value: string | Date): string {
  return shortDateTime.format(typeof value === "string" ? new Date(value) : value);
}

/** 3 may 2026, 15:00 */
export function formatMediumDateTime(value: string | Date): string {
  return mediumDateTime.format(typeof value === "string" ? new Date(value) : value);
}
