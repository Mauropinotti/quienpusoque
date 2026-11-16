import type { SplitBreakdown } from "@/types/calculation";
import type { ContributionItem, Family } from "@/types/family";
import { getContributionItems } from "@/lib/calculations/contributions";
import {
  describeComposition,
  describeFamilyShare,
  describeGuardianNote,
} from "@/lib/text/describeSplit";

/** Lo que el ticket muestra de cada familia, además de su balance. */
export interface FamilyTicketDetail {
  /** "2 adultos y 1 menor". */
  composition: string;
  /** Cada cosa que puso, con su monto. */
  items: ContributionItem[];
  /** "2 adultos × $ 1.500 + 1 menor × $ 750 + …"; null si no entra en la cuenta. */
  shareFormula: string | null;
  /** Menores que vinieron solos y pagan su parte: quién paga en realidad. */
  guardianNote: string | null;
}

/** Detalle por id de familia, para cruzarlo con los balances del cálculo. */
export function buildFamilyTicketDetails(
  families: readonly Family[],
  breakdown: SplitBreakdown | null,
  money: (amount: number) => string
): Map<string, FamilyTicketDetail> {
  return new Map(
    families.map((family) => [
      family.id,
      {
        composition: describeComposition(family),
        items: getContributionItems(family),
        shareFormula: breakdown ? describeFamilyShare(family, breakdown, money) : null,
        guardianNote: describeGuardianNote(family),
      },
    ])
  );
}
