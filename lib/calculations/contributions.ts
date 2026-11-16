import type { ContributionItem, Family } from "@/types/family";

/** Tope de cosas por familia: alcanza para un asado y mantiene el ticket legible. */
export const MAX_CONTRIBUTION_ITEMS = 12;

/** Lo que se muestra cuando una cosa se cargó sin descripción. */
export const UNNAMED_CONTRIBUTION_LABEL = "Sin detalle";

/** Redondeo a centavos: evita arrastrar errores de punto flotante al sumar. */
function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Total que puso una familia a partir de su desglose. */
export function sumContributionItems(items: readonly ContributionItem[]): number {
  return roundToCents(items.reduce((sum, item) => sum + item.amount, 0));
}

/**
 * Total y desglose listos para guardar en una familia. Un único monto sin
 * descripción es solo un total: se guarda sin `items` para no duplicarlo.
 * `items: undefined` explícito para que editar pise un desglose anterior.
 */
export function toContributionFields(
  items: readonly ContributionItem[]
): Pick<Family, "paidAmount" | "items"> {
  const paidAmount = sumContributionItems(items);
  const isPlainTotal =
    items.length === 0 || (items.length === 1 && items[0].description.trim() === "");

  return {
    paidAmount,
    items: isPlainTotal
      ? undefined
      : items.map((item) => ({ description: item.description.trim(), amount: item.amount })),
  };
}

/**
 * Desglose para mostrar en ticket, PDF y WhatsApp. Vacío si la familia solo
 * cargó un total, así las salidas no repiten el mismo monto dos veces.
 */
export function getContributionItems(family: Pick<Family, "items">): ContributionItem[] {
  return family.items ?? [];
}

export function getContributionLabel(item: ContributionItem): string {
  return item.description.trim() || UNNAMED_CONTRIBUTION_LABEL;
}

/** Desglose por id de familia, para cruzarlo con los balances del cálculo. */
export function buildContributionsById(
  families: readonly Family[]
): Map<string, ContributionItem[]> {
  const byId = new Map<string, ContributionItem[]>();
  for (const family of families) {
    const items = getContributionItems(family);
    if (items.length > 0) byId.set(family.id, items);
  }
  return byId;
}
