import type { ReactNode } from "react";
import { ArrowLeftIcon } from "@/components/ui/icons";

interface StepHeaderProps {
  kicker: string;
  title: string;
  onBack?: () => void;
  backLabel?: string;
  children?: ReactNode;
}

export function StepHeader({
  kicker,
  title,
  onBack,
  backLabel = "Volver",
  children,
}: StepHeaderProps) {
  return (
    <div className="flex items-start gap-3">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label={backLabel}
          className="press mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-xl border-2 border-ink bg-white text-xl shadow-hard-sm"
        >
          <ArrowLeftIcon />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-ember-text">
          {kicker}
        </p>
        <h1 className="font-display mt-1 text-4xl break-words sm:text-5xl">{title}</h1>
        {children}
      </div>
    </div>
  );
}
