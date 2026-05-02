"use client";
import type { SplitMode } from "@/types/family";
import { Card } from "@/components/ui/Card";

interface SplitModeSelectorProps {
  value: SplitMode;
  onChange: (mode: SplitMode) => void;
  recommendedMode?: SplitMode;
}

const options: { value: SplitMode; label: string; description: string }[] = [
  {
    value: "by-family",
    label: "Por familia",
    description: "Cada familia paga la misma parte, sin importar cuántos son.",
  },
  {
    value: "by-person",
    label: "Por persona",
    description: "Se divide según la cantidad de integrantes habilitados.",
  },
];

export function SplitModeSelector({
  value,
  onChange,
  recommendedMode,
}: SplitModeSelectorProps) {
  return (
    <div className="flex flex-col gap-3">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={[
            "flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all",
            value === opt.value
              ? "border-orange-500 bg-orange-50"
              : "border-stone-200 bg-white hover:border-orange-200",
          ].join(" ")}
        >
          <span
            className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center ${
              value === opt.value
                ? "border-orange-500"
                : "border-stone-300"
            }`}
          >
            {value === opt.value && (
              <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
            )}
          </span>
          <div>
            <p className="font-semibold text-stone-800">
              {opt.label}
              {recommendedMode === opt.value && (
                <span className="ml-2 text-xs font-bold text-orange-500 bg-orange-100 px-2 py-0.5 rounded-full">
                  Recomendado
                </span>
              )}
            </p>
            <p className="text-sm text-stone-500 mt-0.5">{opt.description}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
