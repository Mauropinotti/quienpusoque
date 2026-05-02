interface RecommendationReasonsProps {
  reasons: string[];
}

export function RecommendationReasons({ reasons }: RecommendationReasonsProps) {
  if (reasons.length === 0) return null;
  return (
    <div className="bg-orange-50 rounded-xl px-4 py-3">
      <p className="text-xs font-semibold text-orange-700 mb-2 uppercase tracking-wide">
        ¿Por qué esta recomendación?
      </p>
      <ul className="space-y-1">
        {reasons.map((r, i) => (
          <li key={i} className="text-sm text-stone-700 flex gap-2">
            <span className="text-orange-400 shrink-0">→</span>
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}
