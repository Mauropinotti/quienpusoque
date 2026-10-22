import { jsPDF } from "jspdf";
import type { EventTicketPdfData } from "@/types/pdf";
import type { BalanceStatus } from "@/types/calculation";
import type { Family, SplitMode } from "@/types/family";
import { formatCurrency } from "@/lib/formatting/formatCurrency";
import { formatMediumDateTime } from "@/lib/formatting/formatDate";
import { TICKET_PHOTO_SLOT_MM } from "./ticketPhoto";

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 10;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const LINE_HEIGHT = 4.2;

// Misma paleta que la app (papel, brasa y carbón).
const COLOR = {
  ember: "#ff5b1f",
  ink: "#1b1410",
  paper: "#fff6e9",
  paperRow: "#fbf4ea",
  line: "#e6d6bd",
  stone950: "#1b1410",
  stone700: "#5c4f45",
  stone500: "#6b5d52",
  stone200: "#e6d6bd",
  red: "#b4182d",
  green: "#1f6b2a",
  blue: "#0b5a8a",
  amber: "#8a5a00",
};

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function fileDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function modeLabel(mode: SplitMode): string {
  return mode === "by-family" ? "por familia" : "por persona";
}

function statusLabel(status: BalanceStatus): string {
  if (status === "receives") return "cobra";
  if (status === "pays") return "paga";
  if (status === "guest") return "no aporta";
  return "equilibrado";
}

function statusColor(status: BalanceStatus): string {
  if (status === "receives") return COLOR.green;
  if (status === "pays") return COLOR.red;
  if (status === "guest") return COLOR.amber;
  return COLOR.blue;
}

function familyKind(family: Family): string {
  if (family.members !== 1) return "-";
  return family.singleMemberType === "minor" ? "menor" : "adulto";
}

function memberLabel(family: Family): string {
  return family.members === 1 ? "1" : String(family.members);
}

function getTotalAmount(data: EventTicketPdfData): number {
  return data.balances.reduce((sum, balance) => sum + balance.paidAmount, 0);
}

function getEligibleFamilyCount(data: EventTicketPdfData): number {
  return data.balances.filter((balance) => balance.isEligibleToPay).length;
}

function getEligiblePersonCount(data: EventTicketPdfData): number {
  return data.balances.reduce(
    (sum, balance) =>
      balance.isEligibleToPay ? sum + balance.eligiblePersons : sum,
    0
  );
}

function getCriterionExplanation(data: EventTicketPdfData): string {
  if (!data.recommendation) {
    return `Se usó reparto ${modeLabel(data.splitMode)} según el criterio elegido por el usuario.`;
  }

  const selectedRecommended =
    data.splitMode === data.recommendation.recommendedMode;
  const firstReason = data.recommendation.reasons[0];

  if (selectedRecommended && firstReason) {
    return `Se usó reparto ${modeLabel(data.splitMode)} porque la app recomendó ese criterio: ${firstReason}`;
  }

  if (selectedRecommended) {
    return `Se usó reparto ${modeLabel(data.splitMode)} porque coincide con la recomendación de la app.`;
  }

  return `Se usó reparto ${modeLabel(data.splitMode)} por elección del usuario. La app había recomendado reparto ${modeLabel(data.recommendation.recommendedMode)}.`;
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(COLOR.stone200);
    doc.line(MARGIN, PAGE_HEIGHT - 14, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(COLOR.stone500);
    doc.text("desarrollado por MauroHP - Lista 127 8B 2026.-", MARGIN, PAGE_HEIGHT - 8);
    doc.text(`Página ${page} de ${pageCount}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 8, {
      align: "right",
    });
  }
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed <= PAGE_HEIGHT - 18) return y;
  doc.addPage();
  return MARGIN;
}

/** El título reserva lugar para su primer bloque: nunca queda huérfano al pie. */
function addSectionTitle(doc: jsPDF, title: string, y: number, keepWithNext = 14): number {
  y = ensureSpace(doc, y, 9 + keepWithNext);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(COLOR.stone950);
  doc.text(title, MARGIN, y);
  return y + 5;
}

function addParagraph(doc: jsPDF, text: string, y: number): number {
  const lines = doc.splitTextToSize(text, CONTENT_WIDTH);
  y = ensureSpace(doc, y, lines.length * LINE_HEIGHT + 3);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR.stone700);
  doc.text(lines, MARGIN, y);
  return y + lines.length * LINE_HEIGHT + 2;
}

function addSummaryGrid(doc: jsPDF, data: EventTicketPdfData, y: number): number {
  const totalAmount = getTotalAmount(data);
  const recommended = data.recommendation
    ? modeLabel(data.recommendation.recommendedMode)
    : "sin recomendación";
  const items = [
    ["Gasto total", formatCurrency(totalAmount, data.currency)],
    ["Familias cargadas", String(data.families.length)],
    ["Familias habilitadas", String(getEligibleFamilyCount(data))],
    ["Personas habilitadas", String(getEligiblePersonCount(data))],
    ["Criterio usado", modeLabel(data.splitMode)],
    ["Recomendado", recommended],
  ];

  // 3 columnas x 2 filas: el ticket con foto entra en una sola hoja.
  const columns = 3;
  const gap = 4;
  const boxWidth = (CONTENT_WIDTH - gap * (columns - 1)) / columns;
  const boxHeight = 14;

  for (let index = 0; index < items.length; index += 1) {
    y = ensureSpace(doc, y, boxHeight + 4);
    const col = index % columns;
    const x = MARGIN + col * (boxWidth + gap);

    doc.setFillColor(COLOR.paper);
    doc.setDrawColor(COLOR.line);
    doc.roundedRect(x, y, boxWidth, boxHeight, 2, 2, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(COLOR.stone500);
    doc.text(items[index][0], x + 3, y + 5.5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(COLOR.stone950);
    doc.text(items[index][1], x + 3, y + 11);

    if (col === columns - 1 || index === items.length - 1) {
      y += boxHeight + 4;
    }
  }

  return y + 2;
}

function addFamiliesTable(doc: jsPDF, data: EventTicketPdfData, y: number): number {
  const headers = ["Familia", "Int.", "Tipo", "Pagó", "Cuota", "Balance", "Estado"];
  const widths = [42, 10, 16, 30, 30, 30, 30];
  const rowHeight = 7;

  y = ensureSpace(doc, y, rowHeight * 2);
  doc.setFillColor(COLOR.stone950);
  doc.rect(MARGIN, y, CONTENT_WIDTH, rowHeight, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor("#ffffff");

  let x = MARGIN + 2;
  headers.forEach((header, index) => {
    doc.text(header, x, y + 5);
    x += widths[index];
  });
  y += rowHeight;

  // Índice por id: antes cada fila hacía un find() sobre todas las familias
  // (O(n²), el clásico N+1 aplicado a un array).
  const familiesById = new Map(
    data.families.map((family) => [family.id, family])
  );

  data.balances.forEach((balance, index) => {
    const family = familiesById.get(balance.familyId);
    y = ensureSpace(doc, y, rowHeight * 2);

    if (index % 2 === 0) {
      doc.setFillColor(COLOR.paperRow);
      doc.rect(MARGIN, y, CONTENT_WIDTH, rowHeight, "F");
    }

    const row = [
      balance.name,
      family ? memberLabel(family) : "-",
      family ? familyKind(family) : "-",
      formatCurrency(balance.paidAmount, data.currency),
      formatCurrency(balance.expectedShare, data.currency),
      formatCurrency(balance.balance, data.currency),
      statusLabel(balance.status),
    ];

    x = MARGIN + 2;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.6);
    doc.setTextColor(COLOR.stone700);

    row.forEach((cell, cellIndex) => {
      const maxWidth = widths[cellIndex] - 2;
      const text = doc.splitTextToSize(cell, maxWidth)[0] ?? "";
      if (cellIndex === 6) doc.setTextColor(statusColor(balance.status));
      doc.text(text, x, y + 5);
      if (cellIndex === 6) doc.setTextColor(COLOR.stone700);
      x += widths[cellIndex];
    });

    y += rowHeight;
  });

  return y + 7;
}

function addNonContributors(doc: jsPDF, data: EventTicketPdfData, y: number): number {
  const guests = data.balances.filter((balance) => balance.status === "guest");
  if (guests.length === 0) return y;

  y = addSectionTitle(doc, "Familias no aportantes", y);
  guests.forEach((guest) => {
    y = ensureSpace(doc, y, 7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(COLOR.stone700);
    doc.text(`${guest.name}: Menor sin cargo`, MARGIN, y);
    y += 6;
  });

  return y + 2;
}

function addTransfers(doc: jsPDF, data: EventTicketPdfData, y: number): number {
  y = addSectionTitle(doc, "Transferencias sugeridas", y);

  if (data.transfers.length === 0) {
    return addParagraph(doc, "No hace falta transferir. El reparto quedó equilibrado.", y);
  }

  data.transfers.forEach((transfer) => {
    y = ensureSpace(doc, y, 8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(COLOR.stone700);
    doc.text(
      `${transfer.fromFamilyName} le transfiere ${formatCurrency(
        transfer.amount,
        data.currency
      )} a ${transfer.toFamilyName}`,
      MARGIN,
      y
    );
    y += 5;
  });

  return y + 2;
}

function addPhoto(doc: jsPDF, data: EventTicketPdfData, y: number): number {
  if (!data.photo?.dataUrl) return y;

  // La foto ya llega recortada al aspecto del espacio (lib/image), así que se
  // dibuja sin deformar.
  const { width, height } = TICKET_PHOTO_SLOT_MM;
  y = ensureSpace(doc, y, height + 4);

  try {
    doc.addImage(data.photo.dataUrl, "JPEG", MARGIN, y, width, height, undefined, "FAST");
    return y + height + 8;
  } catch {
    return addParagraph(
      doc,
      "No se pudo insertar la foto seleccionada en el ticket. El cálculo se generó igualmente.",
      y
    );
  }
}

/** Nota de cierre: pie discreto, sin título, separado por una línea. */
function addClosingNote(doc: jsPDF, y: number): number {
  const text =
    "Este ticket fue generado localmente con ¿Quién puso qué?. La app calcula el reparto según los datos cargados por el usuario. ¡Cuentas claras siempre!";
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  const lines = doc.splitTextToSize(text, CONTENT_WIDTH);
  y = ensureSpace(doc, y, lines.length * LINE_HEIGHT + 5);
  doc.setDrawColor(COLOR.line);
  doc.line(MARGIN, y, MARGIN + 40, y);
  doc.setTextColor(COLOR.stone500);
  doc.text(lines, MARGIN, y + 4);
  return y + 4 + lines.length * LINE_HEIGHT;
}

export function buildEventTicketPdfFileName(
  eventName: string,
  generatedAt: Date
): string {
  const eventSlug = slugify(eventName) || "evento";
  return `quien-puso-que-${eventSlug}-${fileDate(generatedAt)}.pdf`;
}

export function generateEventTicketPdf(data: EventTicketPdfData): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN;

  doc.setFillColor(COLOR.ink);
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 18, 3, 3, "F");
  doc.setFillColor(COLOR.ember);
  doc.rect(MARGIN + 5, y + 15, 24, 1.2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor("#ffffff");
  doc.text(data.appName, MARGIN + 5, y + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR.paper);
  doc.text("Ticket final de cálculo", MARGIN + CONTENT_WIDTH - 5, y + 8, { align: "right" });
  y += 24;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(COLOR.stone950);
  doc.text(data.eventName || "Evento sin nombre", MARGIN, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR.stone500);
  doc.text(`Generado el ${formatMediumDateTime(data.generatedAt)}`, MARGIN, y);
  y += 6;

  y = addPhoto(doc, data, y);
  y = addSectionTitle(doc, "Resumen general", y);
  y = addSummaryGrid(doc, data, y);
  y = addSectionTitle(doc, "Criterio usado", y);
  y = addParagraph(doc, getCriterionExplanation(data), y);
  y = addSectionTitle(doc, "Familias", y);
  y = addFamiliesTable(doc, data, y);
  y = addNonContributors(doc, data, y);
  y = addTransfers(doc, data, y);
  addClosingNote(doc, y);

  addFooter(doc);
  doc.save(buildEventTicketPdfFileName(data.eventName, data.generatedAt));
}
