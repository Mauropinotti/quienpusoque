import { memo } from "react";
import type { RecommendationMetrics } from "@/types/recommendation";
import { formatPercentage } from "@/lib/formatting/formatPercentage";

interface ModeImpactPreviewProps {
  metrics: RecommendationMetrics;
}

export const ModeImpactPreview = memo(function ModeImpactPreview({
  metrics,
}: ModeImpactPreviewProps) {
  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <MetricBox label="Familias que aportan" value={String(metrics.eligibleFamilies)} />
      <MetricBox label="Personas que aportan" value={String(metrics.eligiblePersons)} />
      <MetricBox label="Promedio por familia" value={metrics.averageFamilySize.toFixed(1)} />
      <MetricBox
        label="Diferencia entre criterios"
        value={formatPercentage(metrics.averageImpactBetweenModes)}
      />
    </dl>
  );
});

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col-reverse rounded-xl border-2 border-ink bg-white p-3">
      <dt className="mt-1 text-xs font-bold leading-tight text-ink-soft">{label}</dt>
      <dd className="tabular font-mono text-2xl font-black">{value}</dd>
    </div>
  );
}
