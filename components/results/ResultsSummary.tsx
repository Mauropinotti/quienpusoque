import type { FamilyBalance, Transfer } from "@/types/calculation";
import type { SplitMode } from "@/types/family";
import { BalanceCard } from "./BalanceCard";
import { TransfersList } from "./TransfersList";
import { CopyResultButton } from "./CopyResultButton";
import { Button } from "@/components/ui/Button";
import { generateWhatsappText } from "@/lib/text/generateWhatsappText";
import { formatCurrency } from "@/lib/formatting/formatCurrency";

interface ResultsSummaryProps {
  eventName: string;
  currency: string;
  splitMode: SplitMode;
  balances: FamilyBalance[];
  transfers: Transfer[];
  onEditFamilies: () => void;
  onReset: () => void;
}

export function ResultsSummary({
  eventName,
  currency,
  splitMode,
  balances,
  transfers,
  onEditFamilies,
  onReset,
}: ResultsSummaryProps) {
  const total = balances.reduce((sum, balance) => sum + balance.paidAmount, 0);
  const modeLabel = splitMode === "by-family" ? "por familia" : "por persona";

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border border-orange-200 bg-orange-50 p-5 text-center">
        <p className="text-sm font-medium text-orange-800">Total del evento</p>
        <p className="mt-1 text-4xl font-black text-orange-800">
          {formatCurrency(total, currency)}
        </p>
        <p className="mt-2 text-sm text-orange-900">Reparto {modeLabel}</p>
      </section>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" fullWidth onClick={onEditFamilies}>
          Editar familias
        </Button>
        <Button variant="ghost" fullWidth onClick={onReset}>
          Nuevo evento
        </Button>
      </div>

      <section className="flex flex-col gap-2">
        <h3 className="text-lg font-bold text-stone-900">Balances</h3>
        {balances.map((balance) => (
          <BalanceCard
            key={balance.familyId}
            balance={balance}
            currency={currency}
          />
        ))}
      </section>

      <TransfersList transfers={transfers} currency={currency} />

      <CopyResultButton
        getText={() =>
          generateWhatsappText({
            eventName,
            currency,
            splitMode,
            balances,
            transfers,
          })
        }
      />
    </div>
  );
}
