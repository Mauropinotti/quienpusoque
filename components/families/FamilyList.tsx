"use client";

import type { Family } from "@/types/family";
import { FamilyCard } from "./FamilyCard";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/formatting/formatCurrency";

interface FamilyListProps {
  families: Family[];
  eligibleFamilyCount: number;
  currency?: string;
  onRemove: (id: string) => void;
  onUpdate: (family: Family) => void;
  onCalculate: () => void;
}

export function FamilyList({
  families,
  eligibleFamilyCount,
  currency = "ARS",
  onRemove,
  onUpdate,
  onCalculate,
}: FamilyListProps) {
  const canCalculate = families.length >= 2 && eligibleFamilyCount >= 2;
  const totalPaid = families.reduce((sum, family) => sum + family.paidAmount, 0);
  const hasFamilies = families.length > 0;
  const hasNoTotal = hasFamilies && totalPaid === 0;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-stone-900">
            Familias cargadas
          </h3>
          <p className="text-sm text-stone-500">
            {families.length === 1
              ? "1 familia"
              : `${families.length} familias`}
          </p>
        </div>
        {families.length > 0 && (
          <div className="text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
              Total
            </p>
            <p className="text-lg font-extrabold text-stone-900">
              {formatCurrency(totalPaid, currency)}
            </p>
          </div>
        )}
      </div>

      {!hasFamilies && (
        <div className="rounded-lg border border-dashed border-orange-200 bg-orange-50/60 px-4 py-5 text-center">
          <p className="text-sm font-medium text-stone-700">
            Todavía no hay familias cargadas.
          </p>
          <p className="mt-1 text-sm text-stone-500">
            Agregá la primera para empezar a armar la cuenta.
          </p>
        </div>
      )}

      {hasNoTotal && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-amber-900">
            Todavía no hay gasto cargado.
          </p>
          <p className="mt-1 text-sm text-amber-800">
            Podés calcular igual, pero el resultado va a quedar en cero.
          </p>
        </div>
      )}

      {families.length >= 2 && eligibleFamilyCount < 2 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-amber-900">
            Falta otra familia habilitada para aportar.
          </p>
          <p className="mt-1 text-sm text-amber-800">
            Los menores solos no entran en el reparto. Sumá otra familia o cambiá el tipo.
          </p>
        </div>
      )}

      {families.map((family) => (
        <FamilyCard
          key={family.id}
          family={family}
          currency={currency}
          onRemove={onRemove}
          onUpdate={onUpdate}
        />
      ))}

      <div className="sticky bottom-3 z-10 mt-1 rounded-lg bg-background/90 pt-2 backdrop-blur">
        <Button fullWidth size="lg" onClick={onCalculate} disabled={!canCalculate}>
          Ver recomendación
        </Button>
        {!canCalculate && families.length === 1 && (
          <p className="mt-2 text-center text-xs text-stone-500">
            Agregá al menos una familia más para calcular.
          </p>
        )}
      </div>
    </section>
  );
}
