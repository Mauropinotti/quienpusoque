"use client";
import type { Family } from "@/types/family";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/formatting/formatCurrency";

interface FamilyCardProps {
  family: Family;
  currency?: string;
  onRemove?: (id: string) => void;
}

export function FamilyCard({ family, currency = "ARS", onRemove }: FamilyCardProps) {
  const isGuest = family.members === 1 && family.singleMemberType === "minor";
  const memberLabel =
    family.members === 1
      ? family.singleMemberType === "adult"
        ? "1 adulto"
        : "1 menor"
      : `${family.members} integrantes`;

  return (
    <Card padding="sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-stone-800 truncate">
              {family.name}
            </span>
            {isGuest && <Badge variant="guest" label="No aporta" />}
          </div>
          <p className="text-xs text-stone-500 mt-0.5">{memberLabel}</p>
          <p className="text-sm font-medium text-stone-700 mt-1">
            Puso: {formatCurrency(family.paidAmount, currency)}
          </p>
        </div>
        {onRemove && (
          <button
            onClick={() => onRemove(family.id)}
            className="text-stone-400 hover:text-red-500 transition-colors p-1 shrink-0"
            aria-label="Quitar familia"
          >
            ✕
          </button>
        )}
      </div>
    </Card>
  );
}
