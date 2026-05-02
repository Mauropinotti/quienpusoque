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
  const totalPaid = balances.reduce((sum, balance) => sum + balance.paidAmount, 0);
  const modeLabel = splitMode === "by-family" ? "por familia" : "por persona";

  const lines: string[] = [
    `*${eventName || "Evento"}* - Resumen de gastos`,
    `Total: ${formatCurrency(totalPaid, currency)}`,
    `Modo de reparto: ${modeLabel}`,
    "",
    "*¿Quién puso qué?*",
  ];

  for (const balance of balances) {
    if (balance.status === "guest") {
      lines.push(`- ${balance.name}: no aporta`);
      continue;
    }

    const statusLabel =
      balance.status === "receives"
        ? "cobra"
        : balance.status === "pays"
          ? "paga"
          : "equilibrado";

    const difference =
      balance.status === "balanced"
        ? "$0"
        : formatCurrency(Math.abs(balance.balance), currency);

    lines.push(
      `- ${balance.name}: puso ${formatCurrency(balance.paidAmount, currency)}, le tocaba ${formatCurrency(balance.expectedShare, currency)}. ${statusLabel}: ${difference}`
    );
  }

  if (transfers.length > 0) {
    lines.push("", "*Transferencias sugeridas:*");
    for (const transfer of transfers) {
      lines.push(
        `- ${transfer.fromFamilyName} a ${transfer.toFamilyName}: ${formatCurrency(transfer.amount, currency)}`
      );
    }
  } else {
    lines.push("", "Todo equilibrado. Nadie debe transferir nada.");
  }

  lines.push("", "_Generado con ¿Quién puso qué?_");

  return lines.join("\n");
}
