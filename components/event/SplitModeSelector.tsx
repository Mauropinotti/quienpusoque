"use client";

import { memo, useState } from "react";
import type { SplitBreakdown } from "@/types/calculation";
import type { SplitBasis, SplitMode } from "@/types/family";
import {
  getSplitBasis,
  isPersonSplitMode,
  type PersonSplitMode,
} from "@/lib/calculations/splitModes";
import { formatMoney } from "@/lib/formatting/formatCurrency";
import { describeUnitShares } from "@/lib/text/describeSplit";

interface SplitModeSelectorProps {
  value: SplitMode;
  onChange: (mode: SplitMode) => void;
  recommendedMode?: SplitBasis;
  /** Menores en familias que aportan: sin menores no hace falta preguntar. */
  minorCount: number;
  /** Cuánto paga cada uno con cada respuesta, para decidir con números. */
  previews?: Record<PersonSplitMode, SplitBreakdown>;
  currency?: string;
}

const basisOptions: { value: SplitBasis; label: string; description: string }[] = [
  {
    value: "by-family",
    label: "Por familia",
    description: "Cada familia que aporta pone lo mismo.",
  },
  {
    value: "by-person",
    label: "Por persona",
    description: "Cada persona cuenta como una parte.",
  },
];

const minorOptions: { value: PersonSplitMode; label: string; description: string }[] = [
  {
    value: "by-person",
    label: "Igual que los adultos (100%)",
    description: "Todos pagan una parte igual, sin distinguir adultos de menores.",
  },
  {
    value: "by-person-minors-half",
    label: "La mitad (50%)",
    description: "Cada menor paga la mitad de su parte. Lo que no pagan se reparte en partes iguales entre los adultos.",
  },
  {
    value: "by-person-minors-zero",
    label: "No pagan (0%)",
    description: "El total se divide solo entre los adultos.",
  },
];

const radioCard =
  "relative flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-ink bg-white transition-all has-[:checked]:shadow-hard has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-ink";
const radioDot =
  "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-ink bg-white after:h-3 after:w-3 after:scale-0 after:rounded-full after:bg-ink after:transition-transform peer-checked:after:scale-100";

/** Radios nativos: navegación con flechas y lectores de pantalla sin trabajo extra. */
export const SplitModeSelector = memo(function SplitModeSelector({
  value,
  onChange,
  recommendedMode,
  minorCount,
  previews,
  currency = "ARS",
}: SplitModeSelectorProps) {
  // Recuerda la respuesta sobre menores aunque pasen un rato por "por familia".
  const [lastPersonMode, setLastPersonMode] = useState<PersonSplitMode>(
    isPersonSplitMode(value) ? value : "by-person"
  );
  const basis = getSplitBasis(value);
  const money = (amount: number) => formatMoney(amount, currency);

  const selectPersonMode = (mode: PersonSplitMode) => {
    setLastPersonMode(mode);
    onChange(mode);
  };

  return (
    <div className="flex flex-col gap-3">
      <fieldset>
        <legend className="sr-only">Criterio de reparto</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {basisOptions.map((option) => (
            <label key={option.value} className={`${radioCard} p-4 has-[:checked]:bg-ember`}>
              <input
                type="radio"
                name="split-basis"
                value={option.value}
                checked={basis === option.value}
                onChange={() =>
                  option.value === "by-family" ? onChange("by-family") : onChange(lastPersonMode)
                }
                className="peer sr-only"
              />
              <span aria-hidden="true" className={radioDot} />
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-bold">{option.label}</span>
                  {recommendedMode === option.value && (
                    <span className="rounded-full border-[1.5px] border-ink bg-lime px-2 py-0.5 text-xs font-bold">
                      Recomendado
                    </span>
                  )}
                </span>
                <span className="mt-1 block text-sm leading-snug">{option.description}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {basis === "by-person" && minorCount > 0 && (
        <fieldset className="rounded-2xl border-2 border-dashed border-ink/50 bg-mustard-soft p-3 sm:p-4">
          <legend className="sr-only">¿Cómo pagan los menores?</legend>
          <p aria-hidden="true" className="font-display text-xl">
            ¿Cómo pagan los menores?
          </p>
          <p className="mt-0.5 text-sm text-ink-soft">
            Hay {minorCount === 1 ? "1 menor" : `${minorCount} menores`} en las familias que aportan.
          </p>
          <div className="mt-3 grid gap-2">
            {minorOptions.map((option) => {
              const preview = previews?.[option.value];
              return (
                <label key={option.value} className={`${radioCard} p-3 has-[:checked]:bg-white`}>
                  <input
                    type="radio"
                    name="minor-share"
                    value={option.value}
                    checked={value === option.value}
                    onChange={() => selectPersonMode(option.value)}
                    className="peer sr-only"
                  />
                  <span aria-hidden="true" className={radioDot} />
                  <span className="min-w-0">
                    <span className="block font-bold">{option.label}</span>
                    <span className="mt-0.5 block text-sm leading-snug text-ink-soft">
                      {option.description}
                    </span>
                    {preview && (
                      <span className="mt-1 block font-mono text-xs font-bold text-ink">
                        {describeUnitShares(preview, money)}
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {basis === "by-person" && minorCount === 0 && (
        <p className="rounded-xl bg-white/70 px-3 py-2 text-sm text-ink-soft">
          No hay menores en las familias que aportan: todos pagan una parte igual.
        </p>
      )}
    </div>
  );
});
