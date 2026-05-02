import type { RecommendationMetrics } from "@/types/recommendation";
import { formatPercentage } from "@/lib/formatting/formatPercentage";

interface ModeImpactPreviewProps {
  metrics: RecommendationMetrics;
}

export function ModeImpactPreview({ metrics }: ModeImpactPreviewProps) {
  return (
    <div className="grid grid-cols-2 gap-2 text-sm">
      <MetricBox
        label="Familias habilitadas"
        value={String(metrics.eligibleFamilies)}
      />
      <MetricBox
        label="Personas habilitadas"
        value={String(metrics.eligiblePersons)}
      />
      <MetricBox
        label="Promedio integrantes"
        value={metrics.averageFamilySize.toFixed(1)}
      />
      <MetricBox
        label="Impacto promedio"
        value={formatPercentage(metrics.averageImpactBetweenModes)}
      />
      <MetricBox
        label="Impacto máximo"
        value={formatPercentage(metrics.maxImpactBetweenModes)}
      />
      <MetricBox
        label="Familias numerosas"
        value={formatPercentage(metrics.largeFamilyRatio)}
      />
    </div>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="text-lg font-bold text-stone-800">{value}</p>
    </div>
  );
}
