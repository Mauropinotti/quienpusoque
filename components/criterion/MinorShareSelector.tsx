"use client";

import { memo } from "react";
import type { SplitBreakdown } from "@/types/calculation";
import type { SplitMode } from "@/types/family";
import { formatMoney } from "@/lib/formatting/formatCurrency";
import { describeUnitShares } from "@/lib/text/describeSplit";

interface MinorShareSelectorProps {
  value: SplitMode;
  onChange: (mode: SplitMode) => void;
  /** Cuánto paga cada uno con cada respuesta, para decidir con números. */
  previews?: Record<SplitMode, SplitBreakdown>;
  currency?: string;
}

const options: { value: SplitMode; label: string; description: string }[] = [
  {
    value: "by-person",
    label: "Igual que un adulto (100%)",
    description: "Cada menor cuenta una porción entera: todos pagan lo mismo.",
  },
  {
    value: "by-person-minors-half",
    label: "La mitad (50%)",
    description: "Cada menor cuenta media porción: paga la mitad que un adulto.",
  },
  {
    value: "by-person-minors-zero",
    label: "No pagan (0%)",
    description: "Los menores no cuentan: el total se divide entre los adultos.",
  },
];

/** Radios nativos: navegación con flechas y lectores de pantalla sin trabajo extra. */
export const MinorShareSelector = memo(function MinorShareSelector({
  value,
  onChange,
  previews,
  currency = "ARS",
}: MinorShareSelectorProps) {
  const money = (amount: number) => formatMoney(amount, currency);

  return (
    <fieldset>
      <legend className="sr-only">Cuánto cuenta cada menor</legend>
      <div className="grid gap-3">
        {options.map((option) => {
          const preview = previews?.[option.value];
          return (
            <label
              key={option.value}
              className="relative flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-ink bg-white p-4 transition-all has-[:checked]:bg-ember has-[:checked]:shadow-hard has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-ink"
            >
              <input
                type="radio"
                name="minor-share"
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-ink bg-white after:h-3 after:w-3 after:scale-0 after:rounded-full after:bg-ink after:transition-transform peer-checked:after:scale-100"
              />
              <span className="min-w-0">
                <span className="block text-lg font-bold">{option.label}</span>
                <span className="mt-0.5 block text-sm leading-snug">{option.description}</span>
                {preview && (
                  <span className="mt-1.5 block font-mono text-xs font-bold">
                    {describeUnitShares(preview, money)}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
});
