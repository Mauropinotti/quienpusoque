"use client";

import { memo, useCallback, useState } from "react";
import type { Family } from "@/types/family";
import { isGuestFamily, isPayingSoloMinorFamily } from "@/lib/calculations/eligibility";
import { describeComposition } from "@/lib/text/describeSplit";
import { getContributionItems, getContributionLabel } from "@/lib/calculations/contributions";
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
  const isGuest = isGuestFamily(family);
  const items = getContributionItems(family);

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
          currency={currency}
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
            {isPayingSoloMinorFamily(family) && (
              <Badge variant="neutral" label="Paga su tutor" />
            )}
          </div>
          <p className="mt-0.5 flex items-center gap-2 text-sm text-ink-soft">
            {/* Adultos: puntos llenos. Menores: puntos chicos color mostaza. */}
            <span aria-hidden="true" className="flex max-w-24 flex-wrap items-center gap-0.5">
              {Array.from({ length: Math.min(family.adults, 10) }, (_, i) => (
                <span key={`a${i}`} className="h-2 w-2 rounded-full bg-ink/70" />
              ))}
              {Array.from({ length: Math.min(family.minors, 10) }, (_, i) => (
                <span key={`m${i}`} className="h-1.5 w-1.5 rounded-full border border-ink/60 bg-mustard" />
              ))}
            </span>
            {describeComposition(family)}
          </p>
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

      {items.length > 0 && (
        <ul
          aria-label={`Lo que puso ${family.name}`}
          className="mt-3 space-y-1 border-t-2 border-dashed border-ink/15 pt-2 font-mono text-sm text-ink-soft sm:pl-15"
          data-testid="family-items"
        >
          {items.map((item, index) => (
            <li key={index} className="flex items-baseline gap-2">
              <span className="min-w-0 break-words">{getContributionLabel(item)}</span>
              <span
                aria-hidden="true"
                className="min-w-4 flex-1 translate-y-[-3px] border-b-2 border-dotted border-ink/20"
              />
              <span className="tabular shrink-0 font-bold text-ink">
                {formatMoney(item.amount, currency)}
              </span>
            </li>
          ))}
        </ul>
      )}

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
