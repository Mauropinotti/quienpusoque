"use client";

import type { SplitRecommendation } from "@/types/recommendation";
import type { SplitMode } from "@/types/family";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SplitModeSelector } from "@/components/event/SplitModeSelector";
import { RecommendationReasons } from "./RecommendationReasons";

interface RecommendationCardProps {
  recommendation: SplitRecommendation;
  selectedMode: SplitMode;
  onModeChange: (mode: SplitMode) => void;
  onConfirm: () => void;
}

const confidenceLabel = {
  high: "Sugerencia fuerte",
  medium: "Sugerencia media",
  low: "A revisar",
};

const confidenceColor = {
  high: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-orange-50 text-orange-700 border-orange-200",
  low: "bg-stone-100 text-stone-700 border-stone-200",
};

const modeLabel: Record<SplitMode, string> = {
  "by-family": "Por familia",
  "by-person": "Por persona",
};

export function RecommendationCard({
  recommendation,
  selectedMode,
  onModeChange,
  onConfirm,
}: RecommendationCardProps) {
  const { confidence, reasons, recommendedMode } = recommendation;

  return (
    <Card padding="lg">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-2xl font-black text-stone-950">
          Recomendación
        </h2>
        <span
          className={`rounded-md border px-2 py-1 text-xs font-bold ${confidenceColor[confidence]}`}
        >
          {confidenceLabel[confidence]}
        </span>
      </div>

      <div className="mt-4 rounded-lg bg-orange-50 p-4">
        <p className="text-sm font-medium text-orange-800">Conviene repartir</p>
        <p className="mt-1 text-3xl font-black text-orange-800">
          {modeLabel[recommendedMode].toLowerCase()}
        </p>
      </div>

      <p className="mt-4 text-sm leading-6 text-stone-600">
        Podés usar esta sugerencia o elegir el criterio que prefieran en la mesa.
      </p>

      <RecommendationReasons reasons={reasons} />

      <div className="mt-4">
        <SplitModeSelector
          value={selectedMode}
          onChange={onModeChange}
          recommendedMode={recommendedMode}
        />
      </div>

      <Button fullWidth size="lg" className="mt-4" onClick={onConfirm}>
        Ver resultado
      </Button>
    </Card>
  );
}
