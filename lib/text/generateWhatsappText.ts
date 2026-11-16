import type { FamilyBalance, Transfer } from "@/types/calculation";
import type { Family, SplitMode } from "@/types/family";
import {
  buildContributionsById,
  getContributionLabel,
} from "@/lib/calculations/contributions";
import { formatMoney } from "@/lib/formatting/formatCurrency";

interface GenerateOptions {
  eventName: string;
  currency: string;
  splitMode: SplitMode;
  /** Para el desglose de lo que puso cada familia. */
  families: Family[];
  balances: FamilyBalance[];
  transfers: Transfer[];
}

function getPerPersonShare(totalPaid: number, balances: FamilyBalance[]): number {
  const eligiblePersonCount = balances.reduce(
    (sum, balance) =>
      balance.isEligibleToPay ? sum + balance.eligiblePersons : sum,
    0
  );

  if (eligiblePersonCount === 0) return 0;
  return totalPaid / eligiblePersonCount;
}

function getPerFamilyShare(balances: FamilyBalance[]): number {
  const firstEligibleBalance = balances.find(
    (balance) => balance.isEligibleToPay
  );

  return firstEligibleBalance?.expectedShare ?? 0;
}

/**
 * "- Los García: $ 8.000" y debajo cada cosa con lo que salió. Con una sola
 * cosa va en la misma línea: "- Los Rodríguez: $ 3.000 (Bebidas)".
 */
function getContributionLines(
  balances: FamilyBalance[],
  families: Family[],
  currency: string
): string[] {
  const contributions = buildContributionsById(families);
  const lines: string[] = [];

  for (const balance of balances) {
    if (balance.status === "guest") continue;

    const items = contributions.get(balance.familyId) ?? [];
    const total = `- ${balance.name}: ${formatMoney(balance.paidAmount, currency)}`;

    if (items.length === 1) {
      lines.push(`${total} (${getContributionLabel(items[0])})`);
      continue;
    }

    lines.push(total);
    for (const item of items) {
      lines.push(`   · ${getContributionLabel(item)}: ${formatMoney(item.amount, currency)}`);
    }
  }

  return lines;
}

export function generateWhatsappText({
  eventName,
  currency,
  splitMode,
  families,
  balances,
  transfers,
}: GenerateOptions): string {
  const title = eventName.trim() || "Evento";
  const totalPaid = balances.reduce(
    (sum, balance) => sum + balance.paidAmount,
    0
  );
  const nonContributors = balances.filter(
    (balance) => balance.status === "guest"
  );
  const receivers = balances.filter((balance) => balance.status === "receives");
  const payers = balances.filter((balance) => balance.status === "pays");
  const modeLabel =
    splitMode === "by-family" ? "reparto por familia" : "reparto por persona";
  const shareLabel =
    splitMode === "by-family" ? "Cuota por familia" : "Cuota por persona";
  const shareAmount =
    splitMode === "by-family"
      ? getPerFamilyShare(balances)
      : getPerPersonShare(totalPaid, balances);
  const criterionNote =
    splitMode === "by-family"
      ? "Cada familia habilitada aporta una parte igual del gasto total."
      : "Cada integrante habilitado cuenta como una parte del gasto total.";

  const lines: string[] = [
    title,
    "",
    `Gasto total: ${formatMoney(totalPaid, currency)}`,
    `Criterio usado: ${modeLabel}`,
    `${shareLabel}: ${formatMoney(shareAmount, currency)}`,
    "",
  ];

  const contributionLines = getContributionLines(balances, families, currency);
  if (contributionLines.length > 0) {
    lines.push("Lo que puso cada uno:", ...contributionLines, "");
  }

  if (transfers.length > 0) {
    lines.push("Transferencias sugeridas:");
    for (const transfer of transfers) {
      lines.push(
        `- ${transfer.fromFamilyName} le transfiere ${formatMoney(
          transfer.amount,
          currency
        )} a ${transfer.toFamilyName}`
      );
    }
  } else {
    lines.push("Transferencias sugeridas:");
    lines.push("- No hace falta transferir. El reparto quedó equilibrado.");
  }

  if (receivers.length > 0) {
    lines.push("", "Cobran:");
    for (const balance of receivers) {
      lines.push(
        `- ${balance.name}: ${formatMoney(
          Math.abs(balance.balance),
          currency
        )}`
      );
    }
  }

  if (payers.length > 0) {
    lines.push("", "Pagan:");
    for (const balance of payers) {
      lines.push(
        `- ${balance.name}: ${formatMoney(
          Math.abs(balance.balance),
          currency
        )}`
      );
    }
  }

  if (nonContributors.length > 0) {
    lines.push("", "Invitados no aportantes:");
    for (const balance of nonContributors) {
      lines.push(`- ${balance.name}: menor sin cargo`);
    }
  }

  lines.push("", `Nota: ${criterionNote}`);
  lines.push("", "Calculado con ¿Quién puso qué?");

  return lines.join("\n");
}
