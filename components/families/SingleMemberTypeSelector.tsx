"use client";

import type { SingleMemberType } from "@/types/family";

interface SingleMemberTypeSelectorProps {
  value: SingleMemberType;
  onChange: (type: SingleMemberType) => void;
}

const options: {
  value: Exclude<SingleMemberType, null>;
  label: string;
  hint: string;
  selectedClass: string;
}[] = [
  {
    value: "adult",
    label: "Adulto",
    hint: "Cuenta para repartir.",
    selectedClass: "bg-sky-soft shadow-[3px_3px_0_0_var(--color-ink)]",
  },
  {
    value: "minor",
    label: "Menor",
    hint: "No aporta.",
    selectedClass: "bg-mustard shadow-[3px_3px_0_0_var(--color-ink)]",
  },
];

export function SingleMemberTypeSelector({
  value,
  onChange,
}: SingleMemberTypeSelectorProps) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-bold">
        Si viene solo, ¿es adulto o menor?
      </legend>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => {
          const isSelected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onChange(option.value)}
              className={[
                "min-h-16 rounded-xl border-2 border-ink p-3 text-left transition-all",
                isSelected ? option.selectedClass : "bg-white hover:bg-paper",
              ].join(" ")}
            >
              <span className="block text-base font-bold">{option.label}</span>
              <span className="mt-0.5 block text-sm text-ink-soft">{option.hint}</span>
            </button>
          );
        })}
      </div>
      {value === "minor" && (
        <p className="mt-2 rounded-xl bg-mustard-soft px-3 py-2 text-sm text-mustard-text">
          Lo marcamos como no aportante para que no entre en el reparto.
        </p>
      )}
    </fieldset>
  );
}
