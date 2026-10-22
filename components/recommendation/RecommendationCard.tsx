import { memo } from "react";
import type { SplitRecommendation } from "@/types/recommendation";
import { RecommendationReasons } from "./RecommendationReasons";

const CONFIDENCE = {
  high: { label: "Sugerencia fuerte", level: 3 },
  medium: { label: "Sugerencia media", level: 2 },
  low: { label: "Cualquiera sirve", level: 1 },
} as const;

const MODE_LABEL = {
  "by-family": "por familia",
  "by-person": "por persona",
} as const;

export const RecommendationCard = memo(function RecommendationCard({
  recommendation,
}: {
  recommendation: SplitRecommendation;
}) {
  const { confidence, reasons, recommendedMode } = recommendation;
  const meter = CONFIDENCE[confidence];

  return (
    <section
      aria-labelledby="recommendation-title"
      className="rounded-[1.25rem] border-2 border-ink bg-ink p-6 text-paper shadow-[5px_5px_0_0_var(--color-ember)] sm:p-7"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-paper/70">
          Nuestra sugerencia
        </p>
        <div className="flex items-center gap-2" aria-label={`Confianza: ${meter.label}`}>
          <span className="flex gap-1" aria-hidden="true">
            {[1, 2, 3].map((step) => (
              <span
                key={step}
                className={`h-2.5 w-6 rounded-full border border-paper/40 ${step <= meter.level ? "bg-mustard" : "bg-transparent"}`}
              />
            ))}
          </span>
          <span className="text-sm font-bold text-mustard">{meter.label}</span>
        </div>
      </div>

      <h2 id="recommendation-title" className="mt-4">
        <span className="block text-lg font-bold text-paper/80">Conviene repartir</span>
        <span className="font-display block text-6xl text-ember sm:text-7xl">
          {MODE_LABEL[recommendedMode]}
        </span>
      </h2>

      <RecommendationReasons reasons={reasons} />
    </section>
  );
});
