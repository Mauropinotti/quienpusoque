type BadgeVariant = "pays" | "receives" | "balanced" | "guest" | "neutral";

interface BadgeProps {
  variant: BadgeVariant;
  label?: string;
  className?: string;
}

const config: Record<BadgeVariant, { color: string; defaultLabel: string }> = {
  pays: { color: "bg-morron-soft text-morron", defaultLabel: "Paga" },
  receives: { color: "bg-chimi-soft text-chimi", defaultLabel: "Cobra" },
  balanced: { color: "bg-sky-soft text-sky-text", defaultLabel: "Equilibrado" },
  guest: { color: "bg-mustard-soft text-mustard-text", defaultLabel: "No aporta" },
  neutral: { color: "bg-paper text-ink-soft", defaultLabel: "" },
};

export function Badge({ variant, label, className = "" }: BadgeProps) {
  const { color, defaultLabel } = config[variant];
  return (
    <span
      className={`inline-flex items-center rounded-full border-[1.5px] border-ink px-2.5 py-0.5 text-xs font-bold whitespace-nowrap ${color} ${className}`}
    >
      {label ?? defaultLabel}
    </span>
  );
}
