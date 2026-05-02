"use client";

import type { SingleMemberType } from "@/types/family";

interface SingleMemberTypeSelectorProps {
  value: SingleMemberType;
  onChange: (type: SingleMemberType) => void;
}

const options: { value: Exclude<SingleMemberType, null>; label: string; hint: string }[] = [
  {
    value: "adult",
    label: "Adulto",
    hint: "Cuenta para repartir.",
  },
  {
    value: "minor",
    label: "Menor",
    hint: "No aporta.",
  },
];

export function SingleMemberTypeSelector({
  value,
  onChange,
}: SingleMemberTypeSelectorProps) {
  return (
    <div>
      <p className="text-sm font-medium text-stone-700 mb-2">
        Si viene solo, ¿es adulto o menor?
      </p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={[
              "min-h-16 rounded-lg border p-3 text-left transition-all focus:outline-none focus:ring-2 focus:ring-orange-400",
              value === option.value
                ? option.value === "adult"
                  ? "border-orange-500 bg-orange-50 text-orange-900"
                  : "border-amber-400 bg-amber-50 text-amber-900"
                : "border-stone-200 bg-white text-stone-700 hover:border-orange-200",
            ].join(" ")}
          >
            <span className="block text-base font-semibold">{option.label}</span>
            <span className="mt-1 block text-xs text-stone-500">
              {option.hint}
            </span>
          </button>
        ))}
      </div>
      {value === "minor" && (
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Lo marcamos como no aportante para que no entre en el reparto.
        </p>
      )}
    </div>
  );
}
