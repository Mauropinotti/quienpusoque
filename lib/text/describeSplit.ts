import type { SplitBreakdown } from "@/types/calculation";
import type { Family, SplitMode } from "@/types/family";
import { isGuestFamily } from "@/lib/calculations/eligibility";

// Textos del reparto, compartidos por el ticket en pantalla, el WhatsApp y el
// PDF. Solo describen: los números salen de `calculateShareBreakdown`.

type Money = (amount: number) => string;

export const SPLIT_MODE_LABEL: Record<SplitMode, string> = {
  "by-family": "por familia",
  "by-person": "por persona, todos iguales",
  "by-person-minors-half": "por persona, menores al 50%",
  "by-person-minors-zero": "por persona, menores no pagan",
};

/** Una línea que resume la regla, para notas al pie. */
export const SPLIT_MODE_RULE: Record<SplitMode, string> = {
  "by-family": "Cada familia que aporta pone una parte igual del gasto total.",
  "by-person": "Cada persona (adulto o menor) pone una parte igual del gasto total.",
  "by-person-minors-half":
    "Cada menor paga el 50% de la parte por persona; lo que no pagan los menores se reparte en partes iguales entre los adultos.",
  "by-person-minors-zero": "El gasto total se divide solo entre los adultos; los menores no pagan.",
};

export function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export const adultsLabel = (count: number) => countLabel(count, "adulto", "adultos");
export const minorsLabel = (count: number) => countLabel(count, "menor", "menores");
const peopleLabel = (count: number) => countLabel(count, "persona", "personas");

/** "2 adultos y 1 menor", "1 adulto", "2 menores". */
export function describeComposition(family: Pick<Family, "adults" | "minors">): string {
  const parts: string[] = [];
  if (family.adults > 0) parts.push(adultsLabel(family.adults));
  if (family.minors > 0) parts.push(minorsLabel(family.minors));
  return parts.join(" y ");
}

/** "7 adultos + 3 menores = 10 personas", o "6 personas" si no hay menores. */
function describePeople(b: SplitBreakdown): string {
  if (b.minors === 0) return `${peopleLabel(b.adults)}, sin menores`;
  return `${adultsLabel(b.adults)} + ${minorsLabel(b.minors)} = ${peopleLabel(b.adults + b.minors)}`;
}

/**
 * El cálculo paso a paso, una operación por línea. Cada línea usa montos
 * que ya aparecieron antes, así cualquiera puede rehacer la cuenta.
 */
export function describeSplitSteps(b: SplitBreakdown, money: Money): string[] {
  if (b.contributingFamilies === 0 || b.adults === 0) return [];

  switch (b.splitMode) {
    case "by-family":
      return [
        `${money(b.totalAmount)} ÷ ${countLabel(b.contributingFamilies, "familia", "familias")} = ${money(b.familyShare)} por familia`,
      ];

    case "by-person":
      return [
        describePeople(b),
        `${money(b.totalAmount)} ÷ ${peopleLabel(b.adults + b.minors)} = ${money(b.personShare)} por persona`,
      ];

    case "by-person-minors-zero":
      return [
        `${money(b.totalAmount)} ÷ ${adultsLabel(b.adults)} = ${money(b.adultShare)} por adulto`,
        b.minors > 0 ? `${b.minors === 1 ? "El menor no paga" : `Los ${b.minors} menores no pagan`}` : "No hay menores",
      ];

    case "by-person-minors-half": {
      if (b.minors === 0) {
        return [
          describePeople(b),
          `${money(b.totalAmount)} ÷ ${peopleLabel(b.adults)} = ${money(b.personShare)} por persona`,
          "No hay menores: todos pagan igual",
        ];
      }
      const unpaidPerMinor = Math.round((b.personShare - b.minorShare) * 100) / 100;
      return [
        describePeople(b),
        `Parte igual: ${money(b.totalAmount)} ÷ ${b.adults + b.minors} = ${money(b.personShare)} por persona`,
        `Cada menor paga el 50%: ${money(b.minorShare)}`,
        `Lo que no pagan los menores: ${b.minors} × ${money(unpaidPerMinor)} = ${money(b.minorsUnpaid)}`,
        `Se reparte entre ${b.adults === 1 ? "el adulto" : `los ${b.adults} adultos`}: ${money(b.minorsUnpaid)} ÷ ${b.adults} = ${money(b.adultSurcharge)} más cada uno`,
        `Cada adulto paga: ${money(b.personShare)} + ${money(b.adultSurcharge)} = ${money(b.adultShare)}`,
      ];
    }
  }
}

/** "$ 1.750 c/ adulto · $ 750 c/ menor": la parte unitaria en una línea. */
export function describeUnitShares(b: SplitBreakdown, money: Money): string {
  switch (b.splitMode) {
    case "by-family":
      return `${money(b.familyShare)} c/ familia`;
    case "by-person":
      return `${money(b.personShare)} c/ persona`;
    case "by-person-minors-zero":
      return b.minors > 0
        ? `${money(b.adultShare)} c/ adulto · menores sin cargo`
        : `${money(b.adultShare)} c/ adulto`;
    case "by-person-minors-half":
      return b.minors > 0
        ? `${money(b.adultShare)} c/ adulto · ${money(b.minorShare)} c/ menor`
        : `${money(b.adultShare)} c/ persona`;
  }
}

/**
 * Cuenta de lo que le toca a una familia: "2 adultos × $ 1.750 + 1 menor ×
 * $ 750". null cuando no aporta o el criterio es por familia (es la misma
 * parte para todas y ya está en los pasos).
 */
export function describeFamilyShare(
  family: Pick<Family, "adults" | "minors">,
  b: SplitBreakdown,
  money: Money
): string | null {
  if (isGuestFamily(family)) return null;

  switch (b.splitMode) {
    case "by-family":
      return null;

    case "by-person":
      return `${peopleLabel(family.adults + family.minors)} × ${money(b.personShare)}`;

    case "by-person-minors-zero": {
      const adults = `${adultsLabel(family.adults)} × ${money(b.adultShare)}`;
      return family.minors > 0 ? `${adults} + ${minorsLabel(family.minors)} × ${money(0)}` : adults;
    }

    case "by-person-minors-half": {
      // Sin menores en el grupo, todos pagan lo mismo.
      if (b.minors === 0) {
        return `${peopleLabel(family.adults + family.minors)} × ${money(b.adultShare)}`;
      }
      const parts = [`${adultsLabel(family.adults)} × ${money(b.adultShare)}`];
      if (family.minors > 0) parts.push(`${minorsLabel(family.minors)} × ${money(b.minorShare)}`);
      return parts.join(" + ");
    }
  }
}

/** Cuenta de cada familia por id, para cruzar con los balances. */
export function describeFamilyShares(
  families: readonly Family[],
  b: SplitBreakdown,
  money: Money
): Map<string, string> {
  const byId = new Map<string, string>();
  for (const family of families) {
    const text = describeFamilyShare(family, b, money);
    if (text) byId.set(family.id, text);
  }
  return byId;
}
