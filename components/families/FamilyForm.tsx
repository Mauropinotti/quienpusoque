"use client";

import { useState } from "react";
import type { Family, SingleMemberType } from "@/types/family";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SingleMemberTypeSelector } from "./SingleMemberTypeSelector";

interface FamilyFormProps {
  initialFamily?: Family;
  submitLabel?: string;
  title?: string;
  onSubmit: (family: Omit<Family, "id">) => void;
  onCancel?: () => void;
}

const memberOptions = [1, 2, 3, 4, 5];

export function FamilyForm({
  initialFamily,
  submitLabel = "Agregar familia",
  title = "Agregar familia",
  onSubmit,
  onCancel,
}: FamilyFormProps) {
  const [name, setName] = useState(initialFamily?.name ?? "");
  const [members, setMembers] = useState(initialFamily?.members ?? 2);
  const [singleMemberType, setSingleMemberType] = useState<SingleMemberType>(
    initialFamily?.singleMemberType ?? null
  );
  const [paidAmount, setPaidAmount] = useState(
    initialFamily ? String(initialFamily.paidAmount) : ""
  );
  const [notes, setNotes] = useState(initialFamily?.notes ?? "");
  const [submitted, setSubmitted] = useState(false);

  const parsedAmount = Number(paidAmount);
  const nameError =
    submitted && name.trim().length === 0 ? "Poné un nombre para identificarla." : "";
  const typeError =
    submitted && members === 1 && singleMemberType === null
      ? "Indicá si es adulto o menor."
      : "";
  const amountError =
    submitted &&
    (paidAmount.trim() === "" || Number.isNaN(parsedAmount) || parsedAmount < 0)
      ? "Ingresá un monto válido. Puede ser 0."
      : "";
  const isValid =
    name.trim().length > 0 &&
    members >= 1 &&
    members <= 5 &&
    (members !== 1 || singleMemberType !== null) &&
    paidAmount.trim() !== "" &&
    !Number.isNaN(parsedAmount) &&
    parsedAmount >= 0;

  const resetForm = () => {
    setName("");
    setMembers(2);
    setSingleMemberType(null);
    setPaidAmount("");
    setNotes("");
  };

  const handleSubmit = () => {
    setSubmitted(true);
    if (!isValid) return;

    onSubmit({
      name: name.trim(),
      members,
      singleMemberType: members === 1 ? singleMemberType : null,
      paidAmount: parsedAmount,
      notes: notes.trim() || undefined,
    });

    if (!initialFamily) resetForm();
  };

  return (
    <Card padding="md">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-stone-900">{title}</h3>
        {!initialFamily && (
          <p className="mt-1 text-sm text-stone-500">
            Cargá quién vino y cuánto pagó hasta ahora.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <Input
          label="Nombre"
          placeholder="Ej: Los García"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={nameError}
        />

        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700">
            Integrantes
          </label>
          <div className="grid grid-cols-5 gap-2">
            {memberOptions.map((number) => (
              <button
                key={number}
                type="button"
                onClick={() => {
                  setMembers(number);
                  if (number !== 1) setSingleMemberType(null);
                }}
                aria-pressed={members === number}
                className={[
                  "min-h-12 rounded-lg border text-base font-bold transition-all focus:outline-none focus:ring-2 focus:ring-orange-400",
                  members === number
                    ? "border-orange-500 bg-orange-50 text-orange-800"
                    : "border-stone-200 bg-white text-stone-600 hover:border-orange-200",
                ].join(" ")}
              >
                {number}
              </button>
            ))}
          </div>
        </div>

        {members === 1 && (
          <div>
            <SingleMemberTypeSelector
              value={singleMemberType}
              onChange={setSingleMemberType}
            />
            {typeError && (
              <p className="mt-2 text-xs font-medium text-red-700">
                {typeError}
              </p>
            )}
          </div>
        )}

        <Input
          label="Monto pagado"
          type="number"
          min={0}
          step={0.01}
          inputMode="decimal"
          placeholder="0"
          value={paidAmount}
          onChange={(e) => setPaidAmount(e.target.value)}
          hint="Ingresá 0 si no puso nada."
          error={amountError}
        />

        <Input
          label="Nota o detalle"
          placeholder="Ej: bebida, pan, hielo"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="grid gap-2 sm:grid-cols-2">
          {onCancel && (
            <Button variant="secondary" fullWidth onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button
            fullWidth
            onClick={handleSubmit}
            disabled={!isValid}
            className={onCancel ? "" : "sm:col-span-2"}
          >
            {submitLabel}
          </Button>
        </div>
      </div>
    </Card>
  );
}
