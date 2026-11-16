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
    "Cada menor paga el 50% de la parte por persona. La otra mitad la cubren los adultos de su propia familia; la de los menores que vinieron solos se reparte en partes iguales entre todos los adultos.",
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
  return `Paga su parte a través de su ${GUARDIAN_LABEL.replace(" encargado de", "")}`;
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

/** "7 adultos + 3 menores = 10 personas" y, si hay, cuántos vinieron solos. */
function describePeople(b: SplitBreakdown): string[] {
  if (b.minors === 0) return [`${adultsLabel(b.adults)}, sin menores`];
  const lines = [
    `${adultsLabel(b.adults)} + ${minorsLabel(b.minors)} = ${peopleLabel(b.adults + b.minors)}`,
  ];
  if (b.soloMinors > 0) {
    lines.push(
      b.soloMinors === 1
        ? "1 de los menores vino solo y paga su parte (a través de su padre, madre o tutor)"
        : `${b.soloMinors} de los menores vinieron solos y pagan su parte (a través de su padre, madre o tutor)`
    );
  }
  return lines;
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
        `${money(b.totalAmount)} ÷ ${peopleLabel(b.adults + b.minors)} = ${money(b.personShare)} por persona`,
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

    case "by-person-minors-half": {
      if (b.minors === 0) {
        return [
          ...describePeople(b),
          `${money(b.totalAmount)} ÷ ${peopleLabel(b.adults)} = ${money(b.personShare)} por persona`,
          "No hay menores: todos pagan igual",
        ];
      }
      const familyMinors = b.minors - b.soloMinors;
      const lines = [
        ...describePeople(b),
        `Parte igual: ${money(b.totalAmount)} ÷ ${b.adults + b.minors} = ${money(b.personShare)} por persona`,
        `Cada menor paga el 50%: ${money(b.minorShare)}`,
      ];
      if (familyMinors > 0) {
        lines.push(
          `La otra mitad de cada menor (${money(b.minorCover)}) la cubren los adultos de su propia familia`
        );
      }
      if (b.soloMinors === 0) {
        lines.push(`Cada adulto paga: ${money(b.adultShare)}`);
        return lines;
      }
      const all = b.adults === 1 ? "el adulto" : `los ${b.adults} adultos`;
      lines.push(
        `Lo que no pagan los menores solos: ${b.soloMinors} × ${money(b.minorCover)} = ${money(b.soloMinorsUnpaid)}`,
        `Se reparte entre ${all}: ${money(b.soloMinorsUnpaid)} ÷ ${b.adults} = ${money(b.adultSurcharge)} más cada uno`,
        `Cada adulto paga: ${money(b.personShare)} + ${money(b.adultSurcharge)} = ${money(b.adultShare)}`
      );
      return lines;
    }
  }
}

/** "$ 1.750 c/ adulto · $ 750 c/ menor": la parte unitaria en una línea. */
export function describeUnitShares(b: SplitBreakdown, money: Money): string {
  switch (b.splitMode) {
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
 * Cuenta de lo que le toca a una familia: "2 adultos × $ 1.500 + 1 menor ×
 * $ 750 + $ 750 que la familia cubre por su menor". null si no entra en la cuenta.
 */
export function describeFamilyShare(
  family: Family,
  b: SplitBreakdown,
  money: Money
): string | null {
  if (isGuestFamily(family) || b.adults === 0) return null;

  const solo = isSoloMinorFamily(family);
  const adultsPart = `${adultsLabel(family.adults)} × ${money(b.adultShare)}`;

  switch (b.splitMode) {
    case "by-person":
      return `${peopleLabel(family.adults + family.minors)} × ${money(b.personShare)}`;

    case "by-person-minors-zero": {
      const minorsPart = `${minorsLabel(family.minors)} × ${money(0)}`;
      if (solo) return minorsPart;
      return family.minors > 0 ? `${adultsPart} + ${minorsPart}` : adultsPart;
    }

    case "by-person-minors-half": {
      // Sin menores en el grupo, todos pagan lo mismo.
      if (b.minors === 0) {
        return `${peopleLabel(family.adults + family.minors)} × ${money(b.adultShare)}`;
      }
      const minorsPart = `${minorsLabel(family.minors)} × ${money(b.minorShare)}`;
      if (solo) return `${minorsPart} (la otra mitad la cubren todos los adultos)`;
      if (family.minors === 0) return adultsPart;

      const cover = Math.round(family.minors * b.minorCover * 100) / 100;
      const coverNote =
        family.minors === 1
          ? `${money(cover)} que la familia cubre por su menor`
          : `${money(cover)} que la familia cubre por sus ${family.minors} menores`;
      return `${adultsPart} + ${minorsPart} + ${coverNote}`;
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
