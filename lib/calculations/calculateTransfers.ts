import type { FamilyBalance, Transfer } from "@/types/calculation";

const EPSILON = 0.01;

export function calculateTransfers(balances: FamilyBalance[]): Transfer[] {
  const debtors = balances
    .filter((b) => b.balance < -EPSILON)
    .map((b) => ({ ...b, remaining: Math.abs(b.balance) }))
    .sort((a, b) => b.remaining - a.remaining);

  const creditors = balances
    .filter((b) => b.balance > EPSILON)
    .map((b) => ({ ...b, remaining: b.balance }))
    .sort((a, b) => b.remaining - a.remaining);

  const transfers: Transfer[] = [];
  let di = 0;
  let ci = 0;

  while (di < debtors.length && ci < creditors.length) {
    const debtor = debtors[di];
    const creditor = creditors[ci];
    const amount = Math.min(debtor.remaining, creditor.remaining);

    if (amount > EPSILON) {
      transfers.push({
        fromFamilyId: debtor.familyId,
        fromFamilyName: debtor.name,
        toFamilyId: creditor.familyId,
        toFamilyName: creditor.name,
        amount: Math.round(amount * 100) / 100,
      });
    }

    debtor.remaining -= amount;
    creditor.remaining -= amount;

    if (debtor.remaining < EPSILON) di++;
    if (creditor.remaining < EPSILON) ci++;
  }

  return transfers;
}
