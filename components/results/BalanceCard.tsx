import type { FamilyBalance } from "@/types/calculation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/formatting/formatCurrency";

interface BalanceCardProps {
  balance: FamilyBalance;
  currency?: string;
}

export function BalanceCard({ balance, currency = "ARS" }: BalanceCardProps) {
  const { status } = balance;
  const memberLabel =
    balance.eligiblePersons === 1
      ? "1 persona"
      : `${balance.eligiblePersons} personas`;

  return (
    <Card padding="md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="truncate text-base font-bold text-stone-900">
              {balance.name}
            </h4>
            <Badge variant={status} />
          </div>
          {balance.isEligibleToPay ? (
            <p className="mt-1 text-sm text-stone-500">{memberLabel}</p>
          ) : (
            <p className="mt-1 text-sm text-amber-700">
              No entra en el reparto.
            </p>
          )}
        </div>

        <div className="shrink-0 text-right">
          {balance.isEligibleToPay ? (
            <>
              <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
                Diferencia
              </p>
              <p
                className={[
                  "text-xl font-black",
                  status === "receives"
                    ? "text-emerald-700"
                    : status === "pays"
                      ? "text-red-700"
                      : "text-sky-700",
                ].join(" ")}
              >
                {status === "receives" && "+"}
                {status === "pays" && "-"}
                {Math.abs(balance.balance) > 0
                  ? formatCurrency(Math.abs(balance.balance), currency)
                  : "$0"}
              </p>
            </>
          ) : (
            <p className="text-base font-bold text-amber-700">No aporta</p>
          )}
        </div>
      </div>

      {balance.isEligibleToPay && (
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-stone-50 p-3">
          <div>
            <p className="text-xs text-stone-500">Puso</p>
            <p className="font-bold text-stone-900">
              {formatCurrency(balance.paidAmount, currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-stone-500">Le tocaba</p>
            <p className="font-bold text-stone-900">
              {formatCurrency(balance.expectedShare, currency)}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
