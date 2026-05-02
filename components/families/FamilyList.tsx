"use client";
import type { Family } from "@/types/family";
import { FamilyCard } from "./FamilyCard";
import { Button } from "@/components/ui/Button";

interface FamilyListProps {
  families: Family[];
  currency?: string;
  onRemove: (id: string) => void;
  onCalculate: () => void;
}

export function FamilyList({
  families,
  currency = "ARS",
  onRemove,
  onCalculate,
}: FamilyListProps) {
  const canCalculate = families.length >= 2;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-semibold text-stone-700">
        Familias ({families.length})
      </h3>
      {families.length === 0 && (
        <p className="text-sm text-stone-400 text-center py-4">
          Todavía no hay familias. ¡Agregá la primera!
        </p>
      )}
      {families.map((f) => (
        <FamilyCard
          key={f.id}
          family={f}
          currency={currency}
          onRemove={onRemove}
        />
      ))}
      {families.length >= 2 && (
        <Button fullWidth size="lg" onClick={onCalculate} disabled={!canCalculate}>
          Ver quién puso qué →
        </Button>
      )}
      {families.length === 1 && (
        <p className="text-xs text-stone-400 text-center">
          Agregá al menos una familia más para calcular.
        </p>
      )}
    </div>
  );
}
