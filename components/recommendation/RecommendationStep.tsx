"use client";

import { useMemo } from "react";
import type { Family, SplitMode } from "@/types/family";
import type { SplitRecommendation } from "@/types/recommendation";
import { deriveModeComparison } from "@/lib/flow/eventInsights";
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
  selectedMode,
  onModeChange,
  onConfirm,
  onBack,
}: RecommendationStepProps) {
  const comparison = useMemo(() => deriveModeComparison(families), [families]);

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
        />
      </section>

      <ModeComparison rows={comparison} selectedMode={selectedMode} currency={currency} />
      <ModeImpactPreview metrics={recommendation.metrics} />

      <div className="sticky bottom-0 z-20 -mx-4 bg-linear-to-t from-paper from-70% to-transparent px-4 pb-3 pt-6">
        <Button fullWidth size="xl" onClick={onConfirm}>
          Ver resultado
          <ArrowRightIcon />
        </Button>
      </div>
    </>
  );
}
