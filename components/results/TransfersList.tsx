import type { Transfer } from "@/types/calculation";
import { formatCurrency } from "@/lib/formatting/formatCurrency";

interface TransfersListProps {
  transfers: Transfer[];
  currency?: string;
}

export function TransfersList({ transfers, currency = "ARS" }: TransfersListProps) {
  if (transfers.length === 0) {
    return (
      <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center">
        <p className="text-lg font-black text-emerald-800">Todo equilibrado</p>
        <p className="mt-1 text-sm text-emerald-700">
          Nadie tiene que transferir nada.
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-lg font-bold text-stone-900">
        Transferencias sugeridas
      </h3>
      {transfers.map((transfer, index) => (
        <div
          key={`${transfer.fromFamilyId}-${transfer.toFamilyId}-${index}`}
          className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-bold text-stone-900">
                {transfer.fromFamilyName}
              </p>
              <p className="text-sm text-stone-500">le transfiere a</p>
              <p className="truncate text-base font-bold text-stone-900">
                {transfer.toFamilyName}
              </p>
            </div>
            <p className="shrink-0 text-xl font-black text-orange-700">
              {formatCurrency(transfer.amount, currency)}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}
