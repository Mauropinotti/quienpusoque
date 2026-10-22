const criteria = [
  { who: "1 adulto", rule: "paga su parte", tone: "bg-chimi-soft" },
  { who: "1 menor", rule: "no paga: es invitado", tone: "bg-mustard" },
  { who: "2 o más", rule: "pagan según el criterio", tone: "bg-chimi-soft" },
];

export function EligibilityCriteriaCard() {
  return (
    <section className="rounded-[1.25rem] border-2 border-ink bg-ink p-5 text-paper shadow-[4px_4px_0_0_var(--color-ember)] sm:p-6">
      <h2 className="font-display text-2xl sm:text-3xl">¿Quién aporta?</h2>
      <ul className="mt-4 grid gap-2 sm:grid-cols-3">
        {criteria.map((criterion) => (
          <li
            key={criterion.who}
            className={`rounded-xl border-2 border-paper/20 p-3 text-ink ${criterion.tone}`}
          >
            <span className="block font-mono text-lg font-black">{criterion.who}</span>
            <span className="text-sm font-bold">{criterion.rule}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-paper/80">
        Las familias que no aportan aparecen en el resumen, pero no se incluyen en la cuota.
      </p>
    </section>
  );
}
