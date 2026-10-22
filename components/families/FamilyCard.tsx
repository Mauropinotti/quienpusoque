"use client";

import { memo, useCallback, useState } from "react";
import type { Family } from "@/types/family";
import { isSingleMinor } from "@/lib/calculations/eligibility";
import { formatMoney } from "@/lib/formatting/formatCurrency";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PencilIcon, TrashIcon } from "@/components/ui/icons";
import { FamilyForm } from "./FamilyForm";

interface FamilyCardProps {
  family: Family;
  currency?: string;
  onRemove: (id: string) => void;
  onUpdate: (family: Family) => void;
}

const AVATAR_TONES = ["bg-ember", "bg-sky", "bg-lime", "bg-mustard", "bg-lilac"];
const ARTICLES = new Set(["los", "las", "la", "el", "familia", "flia", "flia."]);

/** Color estable por familia (no depende de la posición en la lista). */
function avatarTone(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length];
}

/** Inicial visible del avatar: "Los García" → "G". */
function avatarInitial(name: string): string {
  const words = name.trim().split(/\s+/);
  const word = words.find((current) => !ARTICLES.has(current.toLowerCase())) ?? words[0];
  return (word?.[0] ?? "?").toUpperCase();
}

function memberLabel(family: Family): string {
  if (family.members > 1) return `${family.members} integrantes`;
  return family.singleMemberType === "adult" ? "1 adulto" : "1 menor";
}

// memo: al agregar o editar una familia, solo se re-renderiza la tarjeta que
// cambió (antes se re-renderizaban todas).
export const FamilyCard = memo(function FamilyCard({
  family,
  currency = "ARS",
  onRemove,
  onUpdate,
}: FamilyCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const isGuest = isSingleMinor(family);

  const handleSubmit = useCallback(
    (data: Omit<Family, "id">) => {
      onUpdate({ ...family, ...data });
      setIsEditing(false);
    },
    [family, onUpdate]
  );
  const handleCancel = useCallback(() => setIsEditing(false), []);

  if (isEditing) {
    return (
      <li>
        <FamilyForm
          initialFamily={family}
          title={`Editar ${family.name}`}
          submitLabel="Guardar cambios"
          onCancel={handleCancel}
          onSubmit={handleSubmit}
        />
      </li>
    );
  }

  return (
    <li className="paper-card animate-pop p-4" data-testid="family-card">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 border-ink font-display text-xl ${avatarTone(family.id)}`}
        >
          {avatarInitial(family.name)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="truncate text-lg font-bold">{family.name}</h3>
            {isGuest && <Badge variant="guest" />}
          </div>
          <p className="mt-0.5 flex items-center gap-2 text-sm text-ink-soft">
            <span aria-hidden="true" className="flex gap-0.5">
              {Array.from({ length: family.members }, (_, i) => (
                <span key={i} className="h-2 w-2 rounded-full bg-ink/70" />
              ))}
            </span>
            {memberLabel(family)}
          </p>
          {family.notes && (
            <p className="mt-1 line-clamp-2 text-sm italic text-ink-soft">“{family.notes}”</p>
          )}
        </div>

        <div className="shrink-0 text-right">
          <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted">
            Puso
          </p>
          <p className="tabular font-mono text-xl font-black">
            {formatMoney(family.paidAmount, currency)}
          </p>
        </div>
      </div>

      {isConfirmingDelete ? (
        <div role="alert" className="mt-4 rounded-xl border-2 border-morron bg-morron-soft p-3">
          <p className="font-bold text-morron">¿Sacamos a {family.name}?</p>
          <p className="text-sm text-morron">Se recalcula todo sin esta familia.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="secondary" size="sm" fullWidth onClick={() => setIsConfirmingDelete(false)}>
              No, volver
            </Button>
            <Button variant="danger" size="sm" fullWidth onClick={() => onRemove(family.id)}>
              Sí, sacar
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
            <PencilIcon />
            Editar
            <span className="sr-only"> {family.name}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-morron"
            onClick={() => setIsConfirmingDelete(true)}
          >
            <TrashIcon />
            Eliminar
            <span className="sr-only"> {family.name}</span>
          </Button>
        </div>
      )}
    </li>
  );
});
