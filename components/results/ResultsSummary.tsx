import type { FamilyBalance, Transfer } from "@/types/calculation";
import type { SplitMode } from "@/types/family";
import { BalanceCard } from "./BalanceCard";
import { TransfersList } from "./TransfersList";
import { CopyResultButton } from "./CopyResultButton";
import { generateWhatsappText } from "@/lib/text/generateWhatsappText";
import { formatCurrency } from "@/lib/formatting/formatCurrency";

interface ResultsSummaryProps {
  eventName: string;
  currency: string;
  splitMode: SplitMode;
  balances: FamilyBalance[];
  transfers: Transfer[];
  onReset: () => void;
}

export function ResultsSummary({
  eventName,
  currency,
  splitMode,
  balances,
  transfers,
  onReset,
}: ResultsSummaryProps) {
  const total = balances.reduce((s, b) => s + b.paidAmount, 0);
  const modeLabel = splitMode === "by-family" ? "por familia" : "por persona";

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <p className="text-sm text-stone-500">Total del evento</p>
        <p className="text-4xl font-extrabold text-orange-600">
          {formatCurrency(total, currency)}
        </p>
        <p className="text-xs text-stone-400 mt-1">Reparto {modeLabel}</p>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="font-semibold text-stone-700">Balances</h3>
        {balances.map((b) => (
          <BalanceCard key={b.familyId} balance={b} currency={currency} />
        ))}
      </div>

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

      <button
        onClick={onReset}
        className="text-sm text-stone-400 hover:text-stone-600 text-center transition-colors"
      >
        ← Empezar de nuevo
      </button>

      <p className="text-center text-xs text-stone-300 pb-4">
        Listo, ya pueden seguir comiendo tranquilos. 🥩
      </p>
    </div>
  );
}
