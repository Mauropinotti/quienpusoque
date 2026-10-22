import { memo } from "react";
import { FLOW_STEPS, type FlowStep } from "@/lib/flow/eventFlow";

const LABELS: Record<FlowStep, string> = {
  setup: "Evento",
  families: "Familias",
  recommendation: "Criterio",
  results: "Ticket",
};

export const StepIndicator = memo(function StepIndicator({
  current,
}: {
  current: FlowStep;
}) {
  const currentIndex = FLOW_STEPS.indexOf(current);

  return (
    <nav aria-label="Progreso del cálculo">
      <ol className="grid grid-cols-4 gap-1 rounded-2xl border-2 border-ink bg-white p-1 shadow-hard-sm">
        {FLOW_STEPS.map((step, index) => {
          const isCurrent = step === current;
          const isDone = index < currentIndex;

          return (
            <li
              key={step}
              aria-current={isCurrent ? "step" : undefined}
              className={[
                "flex items-center justify-center gap-1.5 rounded-xl px-1 py-2 text-xs font-bold transition-colors duration-300 sm:text-sm",
                isCurrent
                  ? "bg-ember text-ink"
                  : isDone
                    ? "bg-ink text-paper"
                    : "text-muted",
              ].join(" ")}
            >
              <span className="font-mono">{isDone ? "✓" : index + 1}</span>
              <span>{LABELS[step]}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
});
