import { memo } from "react";
import type { SplitMode } from "@/types/family";
import type { ModeComparisonRow } from "@/lib/flow/eventInsights";
import { formatMoney } from "@/lib/formatting/formatCurrency";

interface ModeComparisonProps {
  rows: ModeComparisonRow[];
  selectedMode: SplitMode;
  currency: string;
}

/** Tabla "cuánto le toca a cada uno" con ambos criterios lado a lado. */
export const ModeComparison = memo(function ModeComparison({
  rows,
  selectedMode,
  currency,
}: ModeComparisonProps) {
  const highlight = (mode: SplitMode) =>
    mode === selectedMode ? "bg-ember-soft font-black text-ink" : "text-ink-soft";

  return (
    <section aria-labelledby="mode-comparison-title" className="paper-card overflow-hidden">
      <div className="px-5 pt-5">
        <h2 id="mode-comparison-title" className="font-display text-2xl">
          Así le toca a cada uno
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Lo que debería poner cada familia según el criterio.
        </p>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[20rem] border-collapse text-sm">
          <thead>
            <tr className="border-y-2 border-ink bg-paper text-left font-mono text-[11px] uppercase tracking-widest">
              <th scope="col" className="px-5 py-2">Familia</th>
              <th scope="col" className={`px-3 py-2 text-right ${highlight("by-family")}`}>
                Por familia
              </th>
              <th scope="col" className={`px-5 py-2 text-right ${highlight("by-person")}`}>
                Por persona
              </th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-dashed divide-ink/10">
            {rows.map((row) => (
              <tr key={row.familyId}>
                <th scope="row" className="px-5 py-2.5 text-left font-bold">
                  {row.name}
                </th>
                <td className={`tabular px-3 py-2.5 text-right font-mono ${highlight("by-family")}`}>
                  {formatMoney(row.byFamily, currency)}
                </td>
                <td className={`tabular px-5 py-2.5 text-right font-mono ${highlight("by-person")}`}>
                  {formatMoney(row.byPerson, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
});
