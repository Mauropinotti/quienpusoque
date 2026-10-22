"use client";

import { memo } from "react";
import type { SplitMode } from "@/types/family";

interface SplitModeSelectorProps {
  value: SplitMode;
  onChange: (mode: SplitMode) => void;
  recommendedMode?: SplitMode;
}

const options: { value: SplitMode; label: string; description: string }[] = [
  {
    value: "by-family",
    label: "Por familia",
    description: "Cada familia habilitada pone lo mismo.",
  },
  {
    value: "by-person",
    label: "Por persona",
    description: "Cada integrante habilitado cuenta como una parte.",
  },
];

/** Radios nativos: navegación con flechas y lectores de pantalla sin trabajo extra. */
export const SplitModeSelector = memo(function SplitModeSelector({
  value,
  onChange,
  recommendedMode,
}: SplitModeSelectorProps) {
  return (
    <fieldset>
      <legend className="sr-only">Criterio de reparto</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="relative flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-ink bg-white p-4 transition-all has-[:checked]:bg-ember has-[:checked]:shadow-hard has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-ink"
          >
            <input
              type="radio"
              name="split-mode"
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
  );
});
