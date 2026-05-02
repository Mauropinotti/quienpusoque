import type { RecommendationMetrics } from "@/types/recommendation";
import { formatPercentage } from "@/lib/formatting/formatPercentage";

interface ModeImpactPreviewProps {
  metrics: RecommendationMetrics;
}

export function ModeImpactPreview({ metrics }: ModeImpactPreviewProps) {
  return (
    <section className="grid grid-cols-2 gap-2">
      <MetricBox label="Familias" value={String(metrics.eligibleFamilies)} />
      <MetricBox label="Personas" value={String(metrics.eligiblePersons)} />
      <MetricBox
        label="Promedio"
        value={metrics.averageFamilySize.toFixed(1)}
      />
      <MetricBox
        label="Impacto"
        value={formatPercentage(metrics.averageImpactBetweenModes)}
      />
    </section>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-3">
      <p className="text-xs font-medium text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-stone-900">{value}</p>
    </div>
  );
}
