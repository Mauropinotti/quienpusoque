"use client";

import { useId } from "react";
import { MinusIcon, PlusIcon } from "@/components/ui/icons";

interface PeopleCounterProps {
  label: string;
  hint: string;
  value: number;
  /** "adulto" / "menor": arma "Sumar un adulto", "Restar un menor". */
  unit: string;
  canDecrease: boolean;
  canIncrease: boolean;
  onChange: (delta: number) => void;
  tone: "adult" | "minor";
}

/** Contador − / + con el número bien grande: se usa con el pulgar, en la mesa. */
export function PeopleCounter({
  label,
  hint,
  value,
  unit,
  canDecrease,
  canIncrease,
  onChange,
  tone,
}: PeopleCounterProps) {
  const labelId = useId();
  const buttonClass =
    "press grid h-12 w-12 shrink-0 place-items-center rounded-xl border-2 border-ink bg-white text-xl shadow-hard-sm disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none";

  return (
    <div
      role="group"
      aria-labelledby={labelId}
      className={`flex items-center gap-3 rounded-xl border-2 border-ink p-3 ${tone === "adult" ? "bg-sky-soft" : "bg-mustard-soft"}`}
    >
      <div className="min-w-0 flex-1">
        <p id={labelId} className="font-bold">
          {label}
        </p>
        <p className="text-sm leading-snug text-ink-soft">{hint}</p>
      </div>
      <button
        type="button"
        className={buttonClass}
        onClick={() => onChange(-1)}
        disabled={!canDecrease}
        aria-label={`Restar un ${unit}`}
      >
        <MinusIcon />
      </button>
      <output
        aria-live="polite"
        aria-label={`${label}: ${value}`}
        className="tabular w-8 text-center font-mono text-2xl font-black"
      >
        {value}
      </output>
      <button
        type="button"
        className={buttonClass}
        onClick={() => onChange(1)}
        disabled={!canIncrease}
        aria-label={`Sumar un ${unit}`}
      >
        <PlusIcon />
      </button>
    </div>
  );
}
