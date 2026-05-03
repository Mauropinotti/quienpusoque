import type { ReactNode } from "react";

interface HelpStepCardProps {
  title: string;
  children: ReactNode;
}

export function HelpStepCard({ title, children }: HelpStepCardProps) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-black text-stone-950">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-6 text-stone-700">
        {children}
      </div>
    </section>
  );
}
