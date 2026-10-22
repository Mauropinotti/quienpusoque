interface RecommendationReasonsProps {
  reasons: string[];
}

export function RecommendationReasons({ reasons }: RecommendationReasonsProps) {
  if (reasons.length === 0) return null;

  return (
    <div className="mt-5 border-t-2 border-dashed border-paper/25 pt-4">
      <p className="mb-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-paper/70">
        Por qué
      </p>
      <ul className="space-y-2">
        {reasons.map((reason) => (
          <li key={reason} className="flex gap-2.5 leading-snug">
            <span aria-hidden="true" className="mt-1 text-mustard">
              ✦
            </span>
            <span>{reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
