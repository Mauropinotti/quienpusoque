import type { FamilyBalance, SplitBreakdown, Transfer } from "@/types/calculation";
import type { Family, SplitMode } from "@/types/family";
import {
  buildContributionsById,
  getContributionLabel,
} from "@/lib/calculations/contributions";
import { formatMoney } from "@/lib/formatting/formatCurrency";
import {
  SPLIT_MODE_LABEL,
  SPLIT_MODE_RULE,
  describeComposition,
  describeFamilyShare,
  describeSplitSteps,
  describeTransfer,
  getSoloMinorIds,
  guardianOf,
} from "./describeSplit";

interface GenerateOptions {
  eventName: string;
  currency: string;
  splitMode: SplitMode;
  /** Composición y desglose de lo que puso cada familia. */
  families: Family[];
  /** Los pasos del cálculo (ver `calculateShareBreakdown`). */
  breakdown: SplitBreakdown;
  balances: FamilyBalance[];
  transfers: Transfer[];
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
  const soloMinorIds = getSoloMinorIds(families);
  const lines: string[] = [];

  for (const balance of balances) {
    if (balance.status === "guest") continue;

    const items = contributions.get(balance.familyId) ?? [];
    const name = soloMinorIds.has(balance.familyId) ? `${balance.name} (menor solo)` : balance.name;
    const total = `- ${name}: ${formatMoney(balance.paidAmount, currency)}`;

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

/** "- Los Pérez: 2 adultos × $ 1.750 + 1 menor × $ 750 = $ 4.250". */
function getShareLines(
  balances: FamilyBalance[],
  families: Family[],
  breakdown: SplitBreakdown,
  money: (amount: number) => string
): string[] {
  const familiesById = new Map(families.map((family) => [family.id, family]));
  const soloMinorIds = getSoloMinorIds(families);
  const lines: string[] = [];

  for (const balance of balances) {
    const family = familiesById.get(balance.familyId);
    const formula = family ? describeFamilyShare(family, breakdown, money) : null;
    if (formula) {
      const label = soloMinorIds.has(balance.familyId) ? `${balance.name} (menor solo)` : balance.name;
      lines.push(`- ${label}: ${formula} = ${money(balance.expectedShare)}`);
    }
  }

  return lines;
}

export function generateWhatsappText({
  eventName,
  currency,
  splitMode,
  families,
  breakdown,
  balances,
  transfers,
}: GenerateOptions): string {
  const money = (amount: number) => formatMoney(amount, currency);
  const title = eventName.trim() || "Evento";
  const familiesById = new Map(families.map((family) => [family.id, family]));
  const soloMinorIds = getSoloMinorIds(families);
  // Un menor que vino solo no transfiere ni cobra: lo hace su tutor.
  const who = (balance: FamilyBalance) =>
    soloMinorIds.has(balance.familyId)
      ? `${balance.name} (menor; ${guardianOf(balance.name)})`
      : balance.name;
  const nonContributors = balances.filter((balance) => balance.status === "guest");
  const receivers = balances.filter((balance) => balance.status === "receives");
  const payers = balances.filter((balance) => balance.status === "pays");

  const lines: string[] = [
    title,
    "",
    `Gasto total: ${money(breakdown.totalAmount)}`,
    `Criterio usado: ${SPLIT_MODE_LABEL[splitMode]}`,
  ];

  const steps = describeSplitSteps(breakdown, money);
  if (steps.length > 0) {
    lines.push("", "Cómo se calculó:", ...steps.map((step) => `- ${step}`));
  }

  const contributionLines = getContributionLines(balances, families, currency);
  if (contributionLines.length > 0) {
    lines.push("", "Lo que puso cada uno:", ...contributionLines);
  }

  const shareLines = getShareLines(balances, families, breakdown, money);
  if (shareLines.length > 0) {
    lines.push("", "Le toca a cada familia:", ...shareLines);
  }

  lines.push("", "Transferencias sugeridas:");
  if (transfers.length > 0) {
    for (const transfer of transfers) {
      lines.push(`- ${describeTransfer(transfer, soloMinorIds, money)}`);
    }
  } else {
    lines.push("- No hace falta transferir. El reparto quedó equilibrado.");
  }

  if (receivers.length > 0) {
    lines.push("", "Cobran:");
    for (const balance of receivers) {
      lines.push(`- ${who(balance)}: ${money(Math.abs(balance.balance))}`);
    }
  }

  if (payers.length > 0) {
    lines.push("", "Pagan:");
    for (const balance of payers) {
      lines.push(`- ${who(balance)}: ${money(Math.abs(balance.balance))}`);
    }
  }

  if (nonContributors.length > 0) {
    lines.push("", "No aportan (menores solos invitados):");
    for (const balance of nonContributors) {
      const family = familiesById.get(balance.familyId);
      lines.push(`- ${balance.name}${family ? `: ${describeComposition(family)}` : ""}, sin cargo`);
    }
  }

  lines.push("", `Nota: ${SPLIT_MODE_RULE[splitMode]}`);
  lines.push("", "Calculado con ¿Quién puso qué?");

  return lines.join("\n");
}
