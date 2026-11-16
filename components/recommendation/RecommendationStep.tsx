"use client";

import { useMemo } from "react";
import type { Family, SplitMode } from "@/types/family";
import type { SplitRecommendation } from "@/types/recommendation";
import { deriveModeComparison, derivePersonModePreviews } from "@/lib/flow/eventInsights";
import { isPersonSplitMode } from "@/lib/calculations/splitModes";
import { Button } from "@/components/ui/Button";
import { ArrowRightIcon } from "@/components/ui/icons";
import { SplitModeSelector } from "@/components/event/SplitModeSelector";
import { StepHeader } from "@/components/calculator/StepHeader";
import { ModeComparison } from "./ModeComparison";
import { ModeImpactPreview } from "./ModeImpactPreview";
import { RecommendationCard } from "./RecommendationCard";

interface RecommendationStepProps {
  eventName: string;
  families: Family[];
  currency: string;
  recommendation: SplitRecommendation;
  /** Adultos y menores de las familias que aportan. */
  adultCount: number;
  minorCount: number;
  selectedMode: SplitMode;
  onModeChange: (mode: SplitMode) => void;
  onConfirm: () => void;
  onBack: () => void;
}

// Se carga con next/dynamic: no forma parte del bundle inicial de /calcular.
export function RecommendationStep({
  eventName,
  families,
  currency,
  recommendation,
  adultCount,
  minorCount,
  selectedMode,
  onModeChange,
  onConfirm,
  onBack,
}: RecommendationStepProps) {
  // La columna "por persona" sigue la respuesta sobre menores elegida.
  const personMode = isPersonSplitMode(selectedMode) ? selectedMode : "by-person";
  const comparison = useMemo(
    () => deriveModeComparison(families, personMode),
    [families, personMode]
  );
  const previews = useMemo(() => derivePersonModePreviews(families), [families]);

  return (
    <>
      <StepHeader
        kicker={`Paso 3 · ${eventName || "Tu evento"}`}
        title="¿Cómo repartimos?"
        onBack={onBack}
        backLabel="Volver a familias"
      />

      <RecommendationCard recommendation={recommendation} />

      <section aria-label="Elegí el criterio" className="flex flex-col gap-3">
        <p className="text-base text-ink-soft">
          Podés usar la sugerencia o elegir lo que prefieran en la mesa.
        </p>
        <SplitModeSelector
          value={selectedMode}
          onChange={onModeChange}
          recommendedMode={recommendation.recommendedMode}
          minorCount={minorCount}
          previews={previews}
          currency={currency}
        />
      </section>

      <ModeComparison
        rows={comparison}
        selectedMode={selectedMode}
        personMode={personMode}
        currency={currency}
      />
      <ModeImpactPreview
        metrics={recommendation.metrics}
        adultCount={adultCount}
        minorCount={minorCount}
      />

      <div className="sticky bottom-0 z-20 -mx-4 bg-linear-to-t from-paper from-70% to-transparent px-4 pb-3 pt-6">
        <Button fullWidth size="xl" onClick={onConfirm}>
          Ver resultado
          <ArrowRightIcon />
        </Button>
      </div>
    </>
  );
}
