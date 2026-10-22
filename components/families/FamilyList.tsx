"use client";

import type { Family } from "@/types/family";
import type { EventInsights } from "@/lib/flow/eventInsights";
import { formatMoney } from "@/lib/formatting/formatCurrency";
import { Button } from "@/components/ui/Button";
import { ArrowRightIcon } from "@/components/ui/icons";
import { FamilyCard } from "./FamilyCard";

interface FamilyListProps {
  families: Family[];
  insights: EventInsights;
  currency?: string;
  onRemove: (id: string) => void;
  onUpdate: (family: Family) => void;
  onCalculate: () => void;
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border-2 border-ink bg-mustard-soft px-4 py-3">
      <p className="font-bold text-mustard-text">{title}</p>
      <p className="mt-0.5 text-sm text-mustard-text">{children}</p>
    </div>
  );
}

export function FamilyList({
  families,
  insights,
  currency = "ARS",
  onRemove,
  onUpdate,
  onCalculate,
}: FamilyListProps) {
  const { familyCount, eligibleFamilyCount, totalPaid, canCalculate } = insights;

  return (
    <section aria-labelledby="family-list-title" className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3 pt-2">
        <div>
          <h2 id="family-list-title" className="font-display text-3xl">
            En la mesa
          </h2>
          <p className="text-sm text-ink-soft" aria-live="polite">
            {familyCount === 1 ? "1 familia" : `${familyCount} familias`}
          </p>
        </div>
      </div>

      {familyCount === 0 && (
        <div className="rounded-[1.25rem] border-2 border-dashed border-ink/40 bg-white/60 px-4 py-8 text-center">
          <p className="font-display text-2xl">La mesa está vacía.</p>
          <p className="mt-1 text-sm text-ink-soft">
            Sumá la primera familia para empezar a armar la cuenta.
          </p>
        </div>
      )}

      {familyCount > 0 && totalPaid === 0 && (
        <Notice title="Todavía no hay gasto cargado.">
          Podés calcular igual, pero el resultado va a quedar en cero.
        </Notice>
      )}

      {familyCount >= 2 && eligibleFamilyCount < 2 && (
        <Notice title="Falta otra familia que aporte.">
          Los menores solos no entran en el reparto. Sumá otra familia o cambiá el tipo.
        </Notice>
      )}

      {familyCount > 0 && (
        <ul className="flex flex-col gap-3">
          {families.map((family) => (
            <FamilyCard
              key={family.id}
              family={family}
              currency={currency}
              onRemove={onRemove}
              onUpdate={onUpdate}
            />
          ))}
        </ul>
      )}

      <div className="sticky bottom-0 z-20 -mx-4 mt-2 bg-linear-to-t from-paper from-70% to-transparent px-4 pb-3 pt-6">
        <div className="flex items-center gap-3 rounded-2xl border-2 border-ink bg-white p-2 pl-4 shadow-hard">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted">
              Total puesto
            </p>
            <p className="tabular truncate font-mono text-lg font-black sm:text-xl" data-testid="families-total">
              {formatMoney(totalPaid, currency)}
            </p>
          </div>
          <Button onClick={onCalculate} disabled={!canCalculate} className="shrink-0 sm:px-5 sm:py-3.5 sm:text-lg">
            Ver recomendación
            <ArrowRightIcon />
          </Button>
        </div>
        {!canCalculate && familyCount < 2 && (
          <p className="mt-2 text-center text-sm text-ink-soft">
            Sumá al menos {familyCount === 0 ? "dos familias" : "una familia más"} para calcular.
          </p>
        )}
      </div>
    </section>
  );
}
