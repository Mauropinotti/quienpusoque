import type { FamilyBalance } from "@/types/calculation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/formatting/formatCurrency";

interface BalanceCardProps {
  balance: FamilyBalance;
  currency?: string;
}

export function BalanceCard({ balance, currency = "ARS" }: BalanceCardProps) {
  const variant =
    !balance.isEligibleToPay
      ? "guest"
      : balance.balance > 0.01
      ? "receives"
      : balance.balance < -0.01
      ? "pays"
      : "balanced";

  const memberLabel =
    balance.eligiblePersons === 1
      ? "1 persona"
      : `${balance.eligiblePersons} personas`;

  return (
    <Card padding="sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-stone-800">{balance.name}</span>
            <Badge variant={variant} />
          </div>
          {balance.isEligibleToPay && (
            <p className="text-xs text-stone-500 mt-0.5">{memberLabel}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          {balance.isEligibleToPay ? (
            <>
              <p className="text-xs text-stone-500">Puso / Le tocaba</p>
              <p className="text-sm text-stone-700">
                {formatCurrency(balance.paidAmount, currency)} /{" "}
                {formatCurrency(balance.expectedShare, currency)}
              </p>
              <p
                className={`text-base font-bold mt-0.5 ${
                  variant === "receives"
                    ? "text-green-600"
                    : variant === "pays"
                    ? "text-red-600"
                    : "text-blue-600"
                }`}
              >
                {variant === "receives" && "+"}
                {variant === "pays" && "−"}
                {Math.abs(balance.balance) > 0.01
                  ? formatCurrency(Math.abs(balance.balance), currency)
                  : "0"}
              </p>
            </>
          ) : (
            <p className="text-sm text-amber-600 font-medium">No aporta</p>
          )}
        </div>
      </div>
    </Card>
  );
}
