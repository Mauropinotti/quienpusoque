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
  high: "Alta confianza",
  medium: "Confianza media",
  low: "Baja confianza",
};

const confidenceColor = {
  high: "text-green-700 bg-green-100",
  medium: "text-orange-700 bg-orange-100",
  low: "text-stone-600 bg-stone-100",
};

export function RecommendationCard({
  recommendation,
  selectedMode,
  onModeChange,
  onConfirm,
}: RecommendationCardProps) {
  const { confidence, reasons } = recommendation;

  return (
    <Card padding="lg">
      <div className="flex items-center gap-2 mb-1">
        <h2 className="text-xl font-bold text-stone-800">¿Cómo repartimos?</h2>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${confidenceColor[confidence]}`}
        >
          {confidenceLabel[confidence]}
        </span>
      </div>
      <p className="text-sm text-stone-500 mb-4">
        Calculamos ambos modos y te damos una recomendación. Podés aceptarla o
        elegir la que prefieran.
      </p>
      <RecommendationReasons reasons={reasons} />
      <div className="mt-4">
        <SplitModeSelector
          value={selectedMode}
          onChange={onModeChange}
          recommendedMode={recommendation.recommendedMode}
        />
      </div>
      <Button fullWidth size="lg" className="mt-4" onClick={onConfirm}>
        Calcular con este criterio →
      </Button>
    </Card>
  );
}
