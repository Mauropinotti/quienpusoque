import type { ReactNode } from "react";

interface HelpStepCardProps {
  title: string;
  children: ReactNode;
  number?: string;
  tone?: "white" | "sky" | "mustard";
}

const TONES = {
  white: "bg-white",
  sky: "bg-sky-soft",
  mustard: "bg-mustard-soft",
};

export function HelpStepCard({ title, children, number, tone = "white" }: HelpStepCardProps) {
  return (
    <section className={`paper-card p-5 sm:p-6 ${TONES[tone]}`}>
      <div className="flex items-baseline gap-3">
        {number && (
          <span className="font-mono text-sm font-black text-ember-text">{number}</span>
        )}
        <h2 className="font-display text-2xl sm:text-3xl">{title}</h2>
      </div>
      <div className="mt-3 space-y-2 text-base leading-relaxed text-ink-soft [&_strong]:text-ink">
        {children}
      </div>
    </section>
  );
}
