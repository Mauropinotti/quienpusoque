"use client";

import { memo, useId, useState, type FormEvent } from "react";
import type { Family } from "@/types/family";
import { MAX_CONTRIBUTION_ITEMS } from "@/lib/calculations/contributions";
import { formatMoney } from "@/lib/formatting/formatCurrency";
import {
  CONTRIBUTION_DESCRIPTION_MAX_LENGTH,
  MEMBER_OPTIONS,
  addContributionRow,
  canAddContributionRow,
  emptyFamilyFormValues,
  familyToFormValues,
  getFormTotal,
  isFamilyAmountLocked,
  parseFamilyForm,
  removeContributionRow,
  updateContributionRow,
  type FamilyFormValues,
} from "@/lib/forms/familyForm";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PlusIcon, TrashIcon } from "@/components/ui/icons";
import { SingleMemberTypeSelector } from "./SingleMemberTypeSelector";

interface FamilyFormProps {
  initialFamily?: Family;
  submitLabel?: string;
  title?: string;
  currency?: string;
  onSubmit: (family: Omit<Family, "id">) => void;
  onCancel?: () => void;
}

/** El foco se mueve después del commit, cuando la fila nueva ya existe. */
function focusById(id: string) {
  window.requestAnimationFrame(() => document.getElementById(id)?.focus());
}

export const FamilyForm = memo(function FamilyForm({
  initialFamily,
  submitLabel = "Agregar familia",
  title = "Sumá una familia",
  currency = "ARS",
  onSubmit,
  onCancel,
}: FamilyFormProps) {
  const formId = useId();
  const [values, setValues] = useState<FamilyFormValues>(() =>
    initialFamily ? familyToFormValues(initialFamily) : emptyFamilyFormValues()
  );
  const [submitted, setSubmitted] = useState(false);

  const result = parseFamilyForm(values);
  const errors = submitted && !result.ok ? result.errors : {};
  const amountLocked = isFamilyAmountLocked(values);
  const total = getFormTotal(values);
  const canAddRow = canAddContributionRow(values);
  const rowFieldId = (key: string, field: "description" | "amount") =>
    `${formId}-item-${key}-${field}`;

  const update = <K extends keyof FamilyFormValues>(key: K, value: FamilyFormValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  const updateRow = (key: string, patch: { description?: string; amount?: string }) =>
    setValues((current) => updateContributionRow(current, key, patch));

  const handleAddRow = () => {
    const next = addContributionRow(values);
    if (next === values) return;
    setValues(next);
    focusById(rowFieldId(next.items[next.items.length - 1].key, "description"));
  };

  const handleRemoveRow = (key: string) => {
    const index = values.items.findIndex((row) => row.key === key);
    const next = removeContributionRow(values, key);
    setValues(next);
    const target = next.items[Math.max(0, index - 1)];
    if (target) focusById(rowFieldId(target.key, "description"));
  };

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

        {amountLocked ? (
          <Input
            label="Monto pagado"
            type="text"
            prefix="$"
            value="0"
            disabled
            hint="Un menor solo no aporta, así que el monto queda en $0."
          />
        ) : (
          <fieldset>
            <legend className="text-sm font-bold">¿Qué puso?</legend>
            <p className="mt-1 text-sm text-muted">
              Cada cosa con lo que salió. La app suma el total. Si no puso nada, dejalo vacío.
            </p>

            <ol className="mt-3 flex flex-col gap-3">
              {values.items.map((row, index) => {
                const number = index + 1;
                const error = errors.items?.[row.key];
                const errorId = `${rowFieldId(row.key, "amount")}-error`;
                const canRemove = values.items.length > 1;

                return (
                  <li
                    key={row.key}
                    className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:grid-cols-[minmax(0,1fr)_9.5rem_2.75rem]"
                    data-testid="contribution-row"
                  >
                    <div className="col-span-2 sm:col-span-1">
                      <Input
                        id={rowFieldId(row.key, "description")}
                        aria-label={`Qué puso (ítem ${number})`}
                        placeholder={index === 0 ? "Ej: carne" : "Ej: hielo"}
                        value={row.description}
                        maxLength={CONTRIBUTION_DESCRIPTION_MAX_LENGTH}
                        autoComplete="off"
                        enterKeyHint="next"
                        onChange={(event) => updateRow(row.key, { description: event.target.value })}
                      />
                    </div>
                    <div className={canRemove ? "" : "col-span-2 sm:col-span-1"}>
                      <Input
                        id={rowFieldId(row.key, "amount")}
                        aria-label={`Cuánto salió (ítem ${number})`}
                        aria-invalid={error ? true : undefined}
                        aria-describedby={error ? errorId : undefined}
                        type="text"
                        inputMode="decimal"
                        prefix="$"
                        placeholder="0"
                        autoComplete="off"
                        value={row.amount}
                        onChange={(event) => updateRow(row.key, { amount: event.target.value })}
                        className={error ? "border-morron bg-morron-soft" : ""}
                      />
                    </div>
                    {canRemove && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(row.key)}
                        aria-label={`Quitar ítem ${number}`}
                        className="press grid min-h-13 w-11 place-items-center rounded-xl border-2 border-ink bg-white text-lg text-morron shadow-hard-sm sm:w-auto"
                      >
                        <TrashIcon />
                      </button>
                    )}
                    {error && (
                      <p id={errorId} className="col-span-full text-sm font-bold text-morron">
                        {error}
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <Button variant="secondary" size="sm" onClick={handleAddRow} disabled={!canAddRow}>
                <PlusIcon />
                Sumar otra cosa
              </Button>
              <p className="font-mono text-sm text-ink-soft">
                Total que puso{" "}
                <span className="tabular text-base font-black text-ink" data-testid="family-form-total">
                  {formatMoney(total, currency)}
                </span>
              </p>
            </div>
            {!canAddRow && (
              <p className="mt-2 text-sm text-muted">
                Hasta {MAX_CONTRIBUTION_ITEMS} cosas por familia. Si hay más, agrupalas.
              </p>
            )}
          </fieldset>
        )}

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
