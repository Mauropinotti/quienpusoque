"use client";

import type { SplitMode } from "@/types/family";
import { Badge } from "@/components/ui/Badge";

interface SplitModeSelectorProps {
  value: SplitMode;
  onChange: (mode: SplitMode) => void;
  recommendedMode?: SplitMode;
}

const options: { value: SplitMode; label: string; description: string }[] = [
  {
    value: "by-family",
    label: "Por familia",
    description: "Cada familia habilitada paga una parte igual.",
  },
  {
    value: "by-person",
    label: "Por persona",
    description: "Se reparte por integrantes habilitados para aportar.",
  },
];

export function SplitModeSelector({
  value,
  onChange,
  recommendedMode,
}: SplitModeSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((option) => {
        const isSelected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={[
              "flex min-h-20 items-start gap-3 rounded-lg border p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-orange-400",
              isSelected
                ? "border-orange-500 bg-orange-50"
                : "border-stone-200 bg-white hover:border-orange-200",
            ].join(" ")}
          >
            <span
              className={[
                "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                isSelected ? "border-orange-600" : "border-stone-300",
              ].join(" ")}
            >
              {isSelected && (
                <span className="h-2.5 w-2.5 rounded-full bg-orange-600" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-stone-900">{option.label}</span>
                {recommendedMode === option.value && (
                  <Badge variant="neutral" label="Recomendado" />
                )}
              </span>
              <span className="mt-1 block text-sm leading-5 text-stone-600">
                {option.description}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
