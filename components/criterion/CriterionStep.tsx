"use client";

import { useMemo } from "react";
import type { Family, SplitMode } from "@/types/family";
import type { EventInsights } from "@/lib/flow/eventInsights";
import { deriveModeComparison, deriveModePreviews } from "@/lib/flow/eventInsights";
import { isSoloMinorFamily } from "@/lib/calculations/eligibility";
import { describeComposition } from "@/lib/text/describeSplit";
import { Button } from "@/components/ui/Button";
import { ArrowRightIcon } from "@/components/ui/icons";
import { StepHeader } from "@/components/calculator/StepHeader";
import { MinorShareSelector } from "./MinorShareSelector";
import { ShareComparison } from "./ShareComparison";

interface CriterionStepProps {
  eventName: string;
  families: Family[];
  currency: string;
  insights: EventInsights;
  selectedMode: SplitMode;
  onModeChange: (mode: SplitMode) => void;
  onConfirm: () => void;
  onBack: () => void;
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col-reverse rounded-xl border-2 border-ink bg-white p-3">
      <dt className="mt-1 text-xs font-bold leading-tight text-ink-soft">{label}</dt>
      <dd className="tabular font-mono text-2xl font-black">{value}</dd>
    </div>
  );
}

// Se carga con next/dynamic: no forma parte del bundle inicial de /calcular.
export function CriterionStep({
  eventName,
  families,
  currency,
  insights,
  selectedMode,
  onModeChange,
  onConfirm,
  onBack,
}: CriterionStepProps) {
  const previews = useMemo(() => deriveModePreviews(families), [families]);
  const comparison = useMemo(() => deriveModeComparison(families), [families]);
  const soloMinorFamilies = useMemo(() => families.filter(isSoloMinorFamily), [families]);
  const minorsInAccount = insights.familyMinorCount + insights.soloMinorCount;

  return (
    <>
      <StepHeader
        kicker={`Paso 3 · ${eventName || "Tu evento"}`}
        title="¿Cómo pagan los menores?"
        onBack={onBack}
        backLabel="Volver a familias"
      >
        <p className="mt-3 text-base leading-relaxed text-ink-soft">
          Se reparte por porciones: cada adulto cuenta una porción entera y cada
          menor, la parte que elijan. El total se divide por la cantidad de
          porciones.
        </p>
      </StepHeader>

      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Count label="Familias en la cuenta" value={insights.eligibleFamilyCount} />
        <Count label="Adultos" value={insights.adultCount} />
        <Count label="Menores con su familia" value={insights.familyMinorCount} />
        <Count label="Menores solos que pagan" value={insights.soloMinorCount} />
      </dl>

      {minorsInAccount === 0 ? (
        <p className="rounded-xl border-2 border-ink bg-white px-4 py-3 text-base">
          No hay menores en la cuenta: todos pagan una parte igual.
        </p>
      ) : (
        <section aria-label="Cuánto cuenta cada menor" className="flex flex-col gap-3">
          <MinorShareSelector
            value={selectedMode}
            onChange={onModeChange}
            previews={previews}
            currency={currency}
          />
        </section>
      )}

      {soloMinorFamilies.length > 0 && (
        <section
          aria-labelledby="solo-minors-title"
          className="rounded-2xl border-2 border-dashed border-ink/50 bg-mustard-soft p-4"
        >
          <h2 id="solo-minors-title" className="font-display text-xl">
            Menores que vinieron solos
          </h2>
          <ul className="mt-2 space-y-1.5 text-sm">
            {soloMinorFamilies.map((family) => (
              <li key={family.id} data-testid="solo-minor">
                <span className="font-bold">{family.name}</span>{" "}
                <span className="text-ink-soft">({describeComposition(family)})</span>:{" "}
                {family.paysOwnShare
                  ? "paga su parte a través de su padre, madre o tutor."
                  : "invitado, no paga ni entra en la cuenta."}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-mustard-text">
            Se cambia editando la familia (“Va a pagar su parte”).
          </p>
        </section>
      )}

      <ShareComparison rows={comparison} selectedMode={selectedMode} currency={currency} />

      <div className="sticky bottom-0 z-20 -mx-4 bg-linear-to-t from-paper from-70% to-transparent px-4 pb-3 pt-6">
        <Button fullWidth size="xl" onClick={onConfirm}>
          Ver resultado
          <ArrowRightIcon />
        </Button>
      </div>
    </>
  );
}
