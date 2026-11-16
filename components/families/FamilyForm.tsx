"use client";

import { memo, useId, useState, type FormEvent } from "react";
import type { Family } from "@/types/family";
import { MAX_CONTRIBUTION_ITEMS } from "@/lib/calculations/contributions";
import { formatMoney } from "@/lib/formatting/formatCurrency";
import {
  CONTRIBUTION_DESCRIPTION_MAX_LENGTH,
  addContributionRow,
  canAddContributionRow,
  canChangePeople,
  changePeople,
  asksIfMinorsPay,
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
import { PeopleCounter } from "./PeopleCounter";

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
          <legend className="mb-2 text-sm font-bold">¿Quiénes vienen?</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            <PeopleCounter
              label="Adultos"
              hint="Siempre entran en el reparto."
              unit="adulto"
              tone="adult"
              value={values.adults}
              canDecrease={canChangePeople(values, "adults", -1)}
              canIncrease={canChangePeople(values, "adults", 1)}
              onChange={(delta) => setValues((current) => changePeople(current, "adults", delta))}
            />
            <PeopleCounter
              label="Menores"
              hint="Cuánto pagan se elige al repartir."
              unit="menor"
              tone="minor"
              value={values.minors}
              canDecrease={canChangePeople(values, "minors", -1)}
              canIncrease={canChangePeople(values, "minors", 1)}
              onChange={(delta) => setValues((current) => changePeople(current, "minors", delta))}
            />
          </div>
          {errors.people && <p className="mt-2 text-sm font-bold text-morron">{errors.people}</p>}
          {asksIfMinorsPay(values) && (
            // Menores que vinieron solos: ¿pagan su parte (a través de su tutor)?
            <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-xl border-2 border-ink bg-white p-3 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink">
              <input
                type="checkbox"
                checked={values.paysOwnShare}
                onChange={(event) => update("paysOwnShare", event.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-ink"
              />
              <span>
                <span className="block font-bold">
                  {values.minors === 1 ? "Va a pagar su parte" : "Van a pagar su parte"}
                </span>
                <span className="block text-sm leading-snug text-ink-soft">
                  Sin adultos en la familia, la paga su padre, madre o tutor. Si no
                  la marcás, {values.minors === 1 ? "queda invitado" : "quedan invitados"} y no
                  {values.minors === 1 ? " entra" : " entran"} en la cuenta.
                </span>
              </span>
            </label>
          )}
        </fieldset>

        {amountLocked ? (
          <Input
            label="Monto pagado"
            type="text"
            prefix="$"
            value="0"
            disabled
            hint="Menores solos invitados: no aportan, así que el monto queda en $0."
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
