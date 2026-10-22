"use client";

import { memo, useState, type FormEvent } from "react";
import type { Family } from "@/types/family";
import {
  MEMBER_OPTIONS,
  emptyFamilyFormValues,
  familyToFormValues,
  isFamilyAmountLocked,
  parseFamilyForm,
  type FamilyFormValues,
} from "@/lib/forms/familyForm";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PlusIcon } from "@/components/ui/icons";
import { SingleMemberTypeSelector } from "./SingleMemberTypeSelector";

interface FamilyFormProps {
  initialFamily?: Family;
  submitLabel?: string;
  title?: string;
  onSubmit: (family: Omit<Family, "id">) => void;
  onCancel?: () => void;
}

export const FamilyForm = memo(function FamilyForm({
  initialFamily,
  submitLabel = "Agregar familia",
  title = "Sumá una familia",
  onSubmit,
  onCancel,
}: FamilyFormProps) {
  const [values, setValues] = useState<FamilyFormValues>(() =>
    initialFamily ? familyToFormValues(initialFamily) : emptyFamilyFormValues()
  );
  const [submitted, setSubmitted] = useState(false);

  const result = parseFamilyForm(values);
  const errors = submitted && !result.ok ? result.errors : {};
  const amountLocked = isFamilyAmountLocked(values);

  const update = <K extends keyof FamilyFormValues>(key: K, value: FamilyFormValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    if (!result.ok) return;

    onSubmit(result.family);
    if (!initialFamily) {
      setValues(emptyFamilyFormValues());
      setSubmitted(false);
    }
  };

  return (
    <Card as="section" className={initialFamily ? "bg-mustard-soft" : ""}>
      <h2 className="font-display text-2xl">{title}</h2>
      {!initialFamily && (
        <p className="mt-1 text-sm text-ink-soft">
          Quién vino y cuánto puso hasta ahora.
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-5 flex flex-col gap-5">
        <Input
          label="Nombre"
          placeholder="Ej: Los García"
          value={values.name}
          maxLength={40}
          autoComplete="off"
          onChange={(event) => update("name", event.target.value)}
          error={errors.name}
        />

        <fieldset>
          <legend className="mb-2 text-sm font-bold">Integrantes</legend>
          <div className="grid grid-cols-5 gap-2">
            {MEMBER_OPTIONS.map((number) => {
              const isSelected = values.members === number;
              return (
                <button
                  key={number}
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={number === 1 ? "1 integrante" : `${number} integrantes`}
                  onClick={() =>
                    setValues((current) => ({
                      ...current,
                      members: number,
                      singleMemberType: number === 1 ? current.singleMemberType : null,
                    }))
                  }
                  className={[
                    "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl border-2 border-ink font-mono text-lg font-black transition-all",
                    isSelected
                      ? "bg-ink text-paper shadow-[3px_3px_0_0_var(--color-ember)]"
                      : "bg-white hover:bg-paper",
                  ].join(" ")}
                >
                  {number}
                  <span aria-hidden="true" className="flex gap-0.5">
                    {Array.from({ length: number }, (_, i) => (
                      <span
                        key={i}
                        className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-ember" : "bg-ink/40"}`}
                      />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {values.members === 1 && (
          <div>
            <SingleMemberTypeSelector
              value={values.singleMemberType}
              onChange={(type) => update("singleMemberType", type)}
            />
            {errors.singleMemberType && (
              <p className="mt-2 text-sm font-bold text-morron">{errors.singleMemberType}</p>
            )}
          </div>
        )}

        <Input
          label="Monto pagado"
          type="text"
          inputMode="decimal"
          prefix="$"
          placeholder="0"
          autoComplete="off"
          value={amountLocked ? "0" : values.paidAmount}
          onChange={(event) =>
            update("paidAmount", event.target.value.replace(/[^\d.,]/g, ""))
          }
          disabled={amountLocked}
          hint={
            amountLocked
              ? "Un menor solo no aporta, así que el monto queda en $0."
              : "Poné 0 si no puso nada."
          }
          error={errors.paidAmount}
        />

        <Input
          label="Nota o detalle (opcional)"
          placeholder="Ej: carne, hielo, pan"
          value={values.notes}
          maxLength={80}
          autoComplete="off"
          onChange={(event) => update("notes", event.target.value)}
        />

        <div className={`grid gap-2 ${onCancel ? "grid-cols-2" : ""}`}>
          {onCancel && (
            <Button variant="secondary" fullWidth onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit" fullWidth size={onCancel ? "md" : "lg"}>
            {!initialFamily && <PlusIcon />}
            {submitLabel}
          </Button>
        </div>
      </form>
    </Card>
  );
});
