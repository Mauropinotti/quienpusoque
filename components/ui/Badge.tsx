type BadgeVariant = "pays" | "receives" | "balanced" | "guest" | "neutral";

interface BadgeProps {
  variant: BadgeVariant;
  label?: string;
}

const config: Record<BadgeVariant, { color: string; defaultLabel: string }> = {
  pays: { color: "bg-red-50 text-red-700 border border-red-200", defaultLabel: "Paga" },
  receives: { color: "bg-emerald-50 text-emerald-700 border border-emerald-200", defaultLabel: "Cobra" },
  balanced: { color: "bg-sky-50 text-sky-700 border border-sky-200", defaultLabel: "Equilibrado" },
  guest: { color: "bg-amber-50 text-amber-700 border border-amber-200", defaultLabel: "No aporta" },
  neutral: { color: "bg-stone-100 text-stone-600 border border-stone-200", defaultLabel: "" },
};

export function Badge({ variant, label }: BadgeProps) {
  const { color, defaultLabel } = config[variant];
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${color}`}>
      {label ?? defaultLabel}
    </span>
  );
}
