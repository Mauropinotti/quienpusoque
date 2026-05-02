"use client";

import { useState } from "react";
import type { Family } from "@/types/family";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/formatting/formatCurrency";
import { FamilyForm } from "./FamilyForm";

interface FamilyCardProps {
  family: Family;
  currency?: string;
  onRemove: (id: string) => void;
  onUpdate: (family: Family) => void;
}

export function FamilyCard({
  family,
  currency = "ARS",
  onRemove,
  onUpdate,
}: FamilyCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const isGuest = family.members === 1 && family.singleMemberType === "minor";
  const memberLabel =
    family.members === 1
      ? family.singleMemberType === "adult"
        ? "1 adulto"
        : "1 menor"
      : `${family.members} integrantes`;

  if (isEditing) {
    return (
      <FamilyForm
        initialFamily={family}
        title={`Editar ${family.name}`}
        submitLabel="Guardar cambios"
        onCancel={() => setIsEditing(false)}
        onSubmit={(data) => {
          onUpdate({ ...family, ...data });
          setIsEditing(false);
        }}
      />
    );
  }

  return (
    <Card padding="md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="truncate text-base font-bold text-stone-900">
              {family.name}
            </h4>
            {isGuest && <Badge variant="guest" />}
          </div>
          <p className="mt-1 text-sm text-stone-500">{memberLabel}</p>
          {family.notes && (
            <p className="mt-1 line-clamp-2 text-sm text-stone-600">
              {family.notes}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
            Puso
          </p>
          <p className="text-xl font-extrabold text-orange-700">
            {formatCurrency(family.paidAmount, currency)}
          </p>
        </div>
      </div>

      {isConfirmingDelete ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm font-medium text-red-800">
            ¿Eliminar a {family.name}?
          </p>
          <p className="mt-1 text-xs text-red-700">
            Se recalcula todo sin esta familia.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              onClick={() => setIsConfirmingDelete(false)}
            >
              No, volver
            </Button>
            <Button
              variant="danger"
              size="sm"
              fullWidth
              onClick={() => onRemove(family.id)}
            >
              Sí, eliminar
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="secondary" size="sm" fullWidth onClick={() => setIsEditing(true)}>
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            fullWidth
            className="text-red-700 hover:bg-red-50"
            onClick={() => setIsConfirmingDelete(true)}
          >
            Eliminar
          </Button>
        </div>
      )}
    </Card>
  );
}
