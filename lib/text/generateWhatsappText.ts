import type { FamilyBalance, Transfer } from "@/types/calculation";
import type { SplitMode } from "@/types/family";
import { formatCurrency } from "@/lib/formatting/formatCurrency";

interface GenerateOptions {
  eventName: string;
  currency: string;
  splitMode: SplitMode;
  balances: FamilyBalance[];
  transfers: Transfer[];
}

export function generateWhatsappText(opts: GenerateOptions): string {
  const { eventName, currency, splitMode, balances, transfers } = opts;
  const totalPaid = balances.reduce((s, b) => s + b.paidAmount, 0);
  const modeLabel =
    splitMode === "by-family" ? "por familia" : "por persona";

  const lines: string[] = [
    `🍖 *${eventName || "Evento"}* — Resumen de gastos`,
    `💰 Total: ${formatCurrency(totalPaid, currency)}`,
    `📐 Modo de reparto: ${modeLabel}`,
    "",
    "*¿Quién puso qué?*",
  ];

  for (const b of balances) {
    if (b.status === "guest") {
      lines.push(`• ${b.name}: invitado/a no aportante 🎉`);
      continue;
    }
    const label =
      b.status === "receives" ? "cobra" :
      b.status === "pays"     ? "paga"  : "equilibrado";
    const emoji =
      b.status === "receives" ? "✅" :
      b.status === "pays"     ? "❌" : "⚖️";
    lines.push(
      `• ${b.name}: puso ${formatCurrency(b.paidAmount, currency)}, le tocaba ${formatCurrency(b.expectedShare, currency)} → ${emoji} ${b.status === "balanced" ? "equilibrado" : formatCurrency(Math.abs(b.balance), currency)} ${label !== "equilibrado" ? label : ""}`
    );
  }

  if (transfers.length > 0) {
    lines.push("", "*Transferencias sugeridas:*");
    for (const t of transfers) {
      lines.push(
        `🔁 ${t.fromFamilyName} → ${t.toFamilyName}: ${formatCurrency(t.amount, currency)}`
      );
    }
  } else {
    lines.push("", "✨ ¡Todo equilibrado, nadie debe nada!");
  }

  lines.push("", "_Generado con ¿Quién puso qué?_");

  return lines.join("\n");
}
