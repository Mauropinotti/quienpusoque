import { jsPDF } from "jspdf";
import type { EventTicketPdfData } from "@/types/pdf";
import type { BalanceStatus } from "@/types/calculation";
import type { Family, SplitMode } from "@/types/family";
import { formatCurrency } from "@/lib/formatting/formatCurrency";

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 14;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const LINE_HEIGHT = 5.2;

const COLOR = {
  orange: "#ea580c",
  orangeLight: "#fff7ed",
  stone950: "#1c1917",
  stone700: "#44403c",
  stone500: "#78716c",
  stone200: "#e7e5e4",
  red: "#b91c1c",
  green: "#047857",
  blue: "#0369a1",
  amber: "#b45309",
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

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

function getFamilyById(families: Family[], id: string): Family | undefined {
  return families.find((family) => family.id === id);
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
    doc.text("La app puede ser divertida. La cuenta no.", MARGIN, PAGE_HEIGHT - 8);
    doc.text(`Página ${page} de ${pageCount}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 8, {
      align: "right",
    });
  }
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed <= PAGE_HEIGHT - 20) return y;
  doc.addPage();
  return MARGIN;
}

function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  y = ensureSpace(doc, y, 12);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(COLOR.stone950);
  doc.text(title, MARGIN, y);
  return y + 7;
}

function addParagraph(doc: jsPDF, text: string, y: number): number {
  const lines = doc.splitTextToSize(text, CONTENT_WIDTH);
  y = ensureSpace(doc, y, lines.length * LINE_HEIGHT + 3);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(COLOR.stone700);
  doc.text(lines, MARGIN, y);
  return y + lines.length * LINE_HEIGHT + 3;
}

function addSummaryGrid(doc: jsPDF, data: EventTicketPdfData, y: number): number {
  const totalAmount = getTotalAmount(data);
  const recommended = data.recommendation
    ? modeLabel(data.recommendation.recommendedMode)
    : "sin recomendación";
  const confidence = data.recommendation
    ? data.recommendation.confidence
    : "sin dato";
  const items = [
    ["Gasto total", formatCurrency(totalAmount, data.currency)],
    ["Familias cargadas", String(data.families.length)],
    ["Familias habilitadas", String(getEligibleFamilyCount(data))],
    ["Personas habilitadas", String(getEligiblePersonCount(data))],
    ["Criterio usado", modeLabel(data.splitMode)],
    ["Recomendado", recommended],
    ["Confianza", confidence],
  ];

  const columns = 2;
  const gap = 4;
  const boxWidth = (CONTENT_WIDTH - gap) / columns;
  const boxHeight = 18;

  for (let index = 0; index < items.length; index += 1) {
    y = ensureSpace(doc, y, boxHeight + 4);
    const row = Math.floor(index / columns);
    const col = index % columns;
    const x = MARGIN + col * (boxWidth + gap);
    const boxY = y + row * 0;

    doc.setFillColor(COLOR.orangeLight);
    doc.setDrawColor("#fed7aa");
    doc.roundedRect(x, boxY, boxWidth, boxHeight, 2, 2, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(COLOR.stone500);
    doc.text(items[index][0], x + 3, boxY + 6);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(COLOR.stone950);
    doc.text(items[index][1], x + 3, boxY + 13);

    if (col === columns - 1 || index === items.length - 1) {
      y += boxHeight + 4;
    }
  }

  return y + 2;
}

function addFamiliesTable(doc: jsPDF, data: EventTicketPdfData, y: number): number {
  const headers = ["Familia", "Int.", "Tipo", "Pagó", "Cuota", "Balance", "Estado"];
  const widths = [37, 12, 18, 28, 28, 28, 28];
  const rowHeight = 9;

  y = ensureSpace(doc, y, rowHeight * 2);
  doc.setFillColor(COLOR.stone950);
  doc.rect(MARGIN, y, CONTENT_WIDTH, rowHeight, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor("#ffffff");

  let x = MARGIN + 2;
  headers.forEach((header, index) => {
    doc.text(header, x, y + 6);
    x += widths[index];
  });
  y += rowHeight;

  data.balances.forEach((balance, index) => {
    const family = getFamilyById(data.families, balance.familyId);
    y = ensureSpace(doc, y, rowHeight * 2);

    if (index % 2 === 0) {
      doc.setFillColor("#fafaf9");
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
    doc.setFontSize(7.6);
    doc.setTextColor(COLOR.stone700);

    row.forEach((cell, cellIndex) => {
      const maxWidth = widths[cellIndex] - 2;
      const text = doc.splitTextToSize(cell, maxWidth)[0] ?? "";
      if (cellIndex === 6) doc.setTextColor(statusColor(balance.status));
      doc.text(text, x, y + 6);
      if (cellIndex === 6) doc.setTextColor(COLOR.stone700);
      x += widths[cellIndex];
    });

    y += rowHeight;
  });

  return y + 4;
}

function addNonContributors(doc: jsPDF, data: EventTicketPdfData, y: number): number {
  const guests = data.balances.filter((balance) => balance.status === "guest");
  if (guests.length === 0) return y;

  y = addSectionTitle(doc, "Familias no aportantes", y);
  guests.forEach((guest) => {
    y = ensureSpace(doc, y, 7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
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
    doc.setFontSize(10);
    doc.setTextColor(COLOR.stone700);
    doc.text(
      `${transfer.fromFamilyName} le transfiere ${formatCurrency(
        transfer.amount,
        data.currency
      )} a ${transfer.toFamilyName}`,
      MARGIN,
      y
    );
    y += 6;
  });

  return y + 2;
}

function addPhoto(doc: jsPDF, data: EventTicketPdfData, y: number): number {
  if (!data.photo?.dataUrl) return y;

  y = ensureSpace(doc, y, 66);

  try {
    doc.addImage(data.photo.dataUrl, "JPEG", MARGIN, y, CONTENT_WIDTH, 62, undefined, "FAST");
    return y + 68;
  } catch {
    return addParagraph(
      doc,
      "No se pudo insertar la foto seleccionada en el ticket. El cálculo se generó igualmente.",
      y
    );
  }
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

  doc.setFillColor(COLOR.orange);
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 22, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor("#ffffff");
  doc.text(data.appName, MARGIN + 5, y + 9);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Ticket final de cálculo", MARGIN + 5, y + 16);
  y += 30;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(COLOR.stone950);
  doc.text(data.eventName || "Evento sin nombre", MARGIN, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(COLOR.stone500);
  doc.text(`Generado el ${formatDate(data.generatedAt)}`, MARGIN, y);
  y += 8;

  y = addPhoto(doc, data, y);
  y = addSectionTitle(doc, "Resumen general", y);
  y = addSummaryGrid(doc, data, y);
  y = addSectionTitle(doc, "Criterio usado", y);
  y = addParagraph(doc, getCriterionExplanation(data), y);
  y = addSectionTitle(doc, "Familias", y);
  y = addFamiliesTable(doc, data, y);
  y = addNonContributors(doc, data, y);
  y = addTransfers(doc, data, y);
  y = addSectionTitle(doc, "Nota de cierre", y);
  y = addParagraph(
    doc,
    "Este ticket fue generado localmente con ¿Quién puso qué?. La app calcula el reparto según los datos cargados por el usuario.",
    y
  );

  addFooter(doc);
  doc.save(buildEventTicketPdfFileName(data.eventName, data.generatedAt));
}
