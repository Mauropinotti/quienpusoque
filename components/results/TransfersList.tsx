import type { Transfer } from "@/types/calculation";
import { formatCurrency } from "@/lib/formatting/formatCurrency";

interface TransfersListProps {
  transfers: Transfer[];
  currency?: string;
}

export function TransfersList({ transfers, currency = "ARS" }: TransfersListProps) {
  if (transfers.length === 0) {
    return (
      <div className="rounded-2xl bg-green-50 border border-green-200 p-4 text-center">
        <p className="text-lg font-bold text-green-700">¡Todo equilibrado!</p>
        <p className="text-sm text-green-600 mt-1">
          Nadie debe nada. Pueden seguir comiendo tranquilos. 🥩
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-semibold text-stone-700">Transferencias sugeridas</h3>
      {transfers.map((t, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-2xl bg-white border border-stone-100 shadow-sm p-3"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-stone-800 truncate">
              {t.fromFamilyName}
            </p>
            <p className="text-xs text-stone-400">paga a</p>
            <p className="text-sm font-medium text-stone-800 truncate">
              {t.toFamilyName}
            </p>
          </div>
          <p className="text-xl font-bold text-orange-600 shrink-0">
            {formatCurrency(t.amount, currency)}
          </p>
        </div>
      ))}
    </div>
  );
}
