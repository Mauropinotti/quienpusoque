interface RecommendationReasonsProps {
  reasons: string[];
}

export function RecommendationReasons({ reasons }: RecommendationReasonsProps) {
  if (reasons.length === 0) return null;

  return (
    <div className="mt-4 rounded-lg border border-orange-100 bg-white px-4 py-3">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-orange-700">
        Por qué
      </p>
      <ul className="space-y-2">
        {reasons.map((reason, index) => (
          <li key={index} className="flex gap-2 text-sm leading-5 text-stone-700">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
            <span>{reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
