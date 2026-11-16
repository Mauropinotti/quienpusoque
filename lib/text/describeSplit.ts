import type { SplitBreakdown, Transfer } from "@/types/calculation";
import type { Family, LegacySplitMode, SplitMode } from "@/types/family";
import {
  isGuestFamily,
  isPayingSoloMinorFamily,
  isSoloMinorFamily,
} from "@/lib/calculations/eligibility";

// Textos del reparto, compartidos por el ticket en pantalla, el WhatsApp y el
// PDF. Solo describen: los números salen de `calculateShareBreakdown`.

type Money = (amount: number) => string;

export const SPLIT_MODE_LABEL: Record<SplitMode, string> = {
  "by-person": "por persona, menores al 100%",
  "by-person-minors-half": "por persona, menores al 50%",
  "by-person-minors-zero": "por persona, menores al 0%",
};

/** Etiqueta para cualquier criterio, incluido "por familia" del historial viejo. */
export function splitModeLabel(mode: SplitMode | LegacySplitMode): string {
  return mode === "by-family" ? "por familia" : SPLIT_MODE_LABEL[mode];
}

/** Una línea que resume la regla, para notas al pie. */
export const SPLIT_MODE_RULE: Record<SplitMode, string> = {
  "by-person": "Todos, adultos y menores, pagan una parte igual del gasto total.",
  "by-person-minors-half":
    "Cada adulto cuenta una porción y cada menor media: un menor paga la mitad que un adulto. El total se divide por la cantidad de porciones.",
  "by-person-minors-zero": "El gasto total se divide solo entre los adultos; los menores no pagan.",
};

export function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export const adultsLabel = (count: number) => countLabel(count, "adulto", "adultos");
export const minorsLabel = (count: number) => countLabel(count, "menor", "menores");
const peopleLabel = (count: number) => countLabel(count, "persona", "personas");

/** Quien paga o cobra por un menor que vino solo. */
export const GUARDIAN_LABEL = "padre/madre o tutor encargado de";

export function guardianOf(name: string): string {
  return `${GUARDIAN_LABEL} ${name}`;
}

/** "2 adultos y 1 menor", "1 adulto", "1 menor (vino solo)". */
export function describeComposition(family: Pick<Family, "adults" | "minors">): string {
  if (isSoloMinorFamily(family)) {
    return `${minorsLabel(family.minors)} (${family.minors === 1 ? "vino solo" : "vinieron solos"})`;
  }
  const parts = [adultsLabel(family.adults)];
  if (family.minors > 0) parts.push(minorsLabel(family.minors));
  return parts.join(" y ");
}

/** Para los menores solos que pagan su parte: quién paga en realidad. */
export function describeGuardianNote(family: Family): string | null {
  if (!isPayingSoloMinorFamily(family)) return null;
  return "paga su parte a través de su padre, madre o tutor";
}

// ── Transferencias ────────────────────────────────────────────────────────────

/** Ids de familias de menores solos: en las transferencias aparece su tutor. */
export function getSoloMinorIds(families: readonly Family[]): Set<string> {
  return new Set(families.filter(isPayingSoloMinorFamily).map((family) => family.id));
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Quien transfiere: "Los García" o "Padre/madre o tutor encargado de Juli". */
export function describePayer(id: string, name: string, soloMinorIds: ReadonlySet<string>): string {
  return soloMinorIds.has(id) ? capitalize(guardianOf(name)) : name;
}

/** A quién: "a Los García" o "al padre/madre o tutor encargado de Juli". */
export function describeReceiver(id: string, name: string, soloMinorIds: ReadonlySet<string>): string {
  return soloMinorIds.has(id) ? `al ${guardianOf(name)}` : `a ${name}`;
}

/** "Padre/madre o tutor encargado de Juli le transfiere $ 750 a Los Pérez". */
export function describeTransfer(
  transfer: Transfer,
  soloMinorIds: ReadonlySet<string>,
  money: Money
): string {
  const from = describePayer(transfer.fromFamilyId, transfer.fromFamilyName, soloMinorIds);
  const to = describeReceiver(transfer.toFamilyId, transfer.toFamilyName, soloMinorIds);
  return `${from} le transfiere ${money(transfer.amount)} ${to}`;
}

// ── Pasos del cálculo ─────────────────────────────────────────────────────────

const portionsFormatter = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 });

/** 6,5 porciones. */
export function formatPortions(portions: number): string {
  return portionsFormatter.format(portions);
}

/** "1 de los menores vino solo y paga su parte…", si corresponde. */
function describeSoloMinors(b: SplitBreakdown): string[] {
  if (b.soloMinors === 0) return [];
  return [
    b.soloMinors === 1
      ? "1 de los menores vino solo y paga su parte (a través de su padre, madre o tutor)"
      : `${b.soloMinors} de los menores vinieron solos y pagan su parte (a través de su padre, madre o tutor)`,
  ];
}

/** "5 adultos + 3 menores = 8 personas", o "5 adultos, sin menores". */
function describePeople(b: SplitBreakdown): string[] {
  if (b.minors === 0) return [`${adultsLabel(b.adults)}, sin menores`];
  return [
    `${adultsLabel(b.adults)} + ${minorsLabel(b.minors)} = ${peopleLabel(b.adults + b.minors)}`,
    ...describeSoloMinors(b),
  ];
}

/**
 * El cálculo paso a paso, una operación por línea. Cada línea usa montos
 * que ya aparecieron antes, así cualquiera puede rehacer la cuenta.
 */
export function describeSplitSteps(b: SplitBreakdown, money: Money): string[] {
  if (b.contributingFamilies === 0 || b.adults === 0) return [];

  switch (b.splitMode) {
    case "by-person":
      return [
        ...describePeople(b),
        `${money(b.totalAmount)} ÷ ${peopleLabel(b.adults + b.minors)} = ${money(b.adultShare)} por persona`,
      ];

    case "by-person-minors-zero":
      return [
        `${money(b.totalAmount)} ÷ ${adultsLabel(b.adults)} = ${money(b.adultShare)} por adulto`,
        b.minors === 0
          ? "No hay menores"
          : b.minors === 1
            ? "El menor no paga"
            : `Los ${b.minors} menores no pagan`,
      ];

    case "by-person-minors-half":
      if (b.minors === 0) {
        return [
          ...describePeople(b),
          `${money(b.totalAmount)} ÷ ${peopleLabel(b.adults)} = ${money(b.adultShare)} por persona`,
          "No hay menores: todos pagan igual",
        ];
      }
      return [
        `${adultsLabel(b.adults)} × 1 + ${minorsLabel(b.minors)} × ½ = ${formatPortions(b.portions)} porciones`,
        ...describeSoloMinors(b),
        `${money(b.totalAmount)} ÷ ${formatPortions(b.portions)} porciones = ${money(b.adultShare)} por porción: lo que paga cada adulto`,
        `Cada menor paga media porción: ${money(b.adultShare)} ÷ 2 = ${money(b.minorShare)}`,
      ];
  }
}

/** "$ 1.846,15 c/ adulto · $ 923,08 c/ menor": la parte unitaria en una línea. */
export function describeUnitShares(b: SplitBreakdown, money: Money): string {
  switch (b.splitMode) {
    case "by-person":
      return `${money(b.adultShare)} c/ persona`;
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
 * Cuenta de lo que le toca a una familia: "1 adulto × $ 1.846,15 + 1 menor ×
 * $ 923,08". null si no entra en la cuenta.
 */
export function describeFamilyShare(
  family: Family,
  b: SplitBreakdown,
  money: Money
): string | null {
  if (isGuestFamily(family) || b.adults === 0) return null;

  // Sin menores en el grupo (o todos iguales), basta con "N personas × $".
  if (b.splitMode === "by-person" || b.minors === 0) {
    return `${peopleLabel(family.adults + family.minors)} × ${money(b.adultShare)}`;
  }

  const minorsPart = `${minorsLabel(family.minors)} × ${money(b.minorShare)}`;
  if (isSoloMinorFamily(family)) return minorsPart;

  const adultsPart = `${adultsLabel(family.adults)} × ${money(b.adultShare)}`;
  return family.minors > 0 ? `${adultsPart} + ${minorsPart}` : adultsPart;
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
