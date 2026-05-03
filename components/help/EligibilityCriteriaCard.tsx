const criteria = [
  "Una familia de 1 adulto paga.",
  "Una familia de 1 menor no paga.",
  "Una familia de 2 o más integrantes paga.",
  "Las familias que no pagan pueden aparecer en el resumen, pero no se incluyen en la cuota.",
];

export function EligibilityCriteriaCard() {
  return (
    <section className="rounded-lg border border-orange-200 bg-orange-50 p-4">
      <h2 className="text-lg font-black text-stone-950">
        Criterios de elegibilidad
      </h2>
      <ul className="mt-3 space-y-2">
        {criteria.map((criterion) => (
          <li key={criterion} className="flex gap-2 text-sm leading-6 text-stone-700">
            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-orange-600" />
            <span>{criterion}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
