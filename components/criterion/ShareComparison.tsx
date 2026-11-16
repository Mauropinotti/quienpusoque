import { memo } from "react";
import type { SplitMode } from "@/types/family";
import type { ModeComparisonRow } from "@/lib/flow/eventInsights";
import { SPLIT_MODES } from "@/lib/calculations/splitModes";
import { formatMoney } from "@/lib/formatting/formatCurrency";

interface ShareComparisonProps {
  rows: ModeComparisonRow[];
  selectedMode: SplitMode;
  currency: string;
}

const COLUMN_LABEL: Record<SplitMode, string> = {
  "by-person": "100%",
  "by-person-minors-half": "50%",
  "by-person-minors-zero": "0%",
};

/** "Así le toca a cada uno": lo que pondría cada familia con cada respuesta. */
export const ShareComparison = memo(function ShareComparison({
  rows,
  selectedMode,
  currency,
}: ShareComparisonProps) {
  const highlight = (mode: SplitMode) =>
    mode === selectedMode ? "bg-ember-soft font-black text-ink" : "text-ink-soft";

  return (
    <section aria-labelledby="share-comparison-title" className="paper-card overflow-hidden">
      <div className="px-5 pt-5">
        <h2 id="share-comparison-title" className="font-display text-2xl">
          Así le toca a cada uno
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Lo que debería poner cada familia según cuánto paguen los menores.
        </p>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="border-y-2 border-ink bg-paper text-left font-mono text-[11px] uppercase tracking-widest">
              <th scope="col" className="px-3 py-2 sm:px-4">Familia</th>
              {SPLIT_MODES.map((mode) => (
                <th key={mode} scope="col" className={`px-1.5 py-2 text-right last:pr-3 sm:px-2 sm:last:pr-4 ${highlight(mode)}`}>
                  <span className="sr-only">Menores al </span>
                  {COLUMN_LABEL[mode]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-dashed divide-ink/10">
            {rows.map((row) => (
              <tr key={row.familyId}>
                <th scope="row" className="px-3 py-2.5 text-left font-bold sm:px-4">
                  {row.name}
                  {row.isSoloMinor && (
                    <span className="block text-[11px] font-medium text-muted">menor solo</span>
                  )}
                </th>
                {SPLIT_MODES.map((mode) => (
                  <td
                    key={mode}
                    className={`tabular whitespace-nowrap px-1.5 py-2.5 text-right font-mono last:pr-3 sm:px-2 sm:last:pr-4 ${highlight(mode)}`}
                  >
                    {formatMoney(row.shares[mode], currency)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
});
