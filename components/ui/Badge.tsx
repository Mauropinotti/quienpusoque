type BadgeVariant = "pays" | "receives" | "balanced" | "guest" | "neutral";

interface BadgeProps {
  variant: BadgeVariant;
  label?: string;
}

const config: Record<BadgeVariant, { color: string; defaultLabel: string }> = {
  pays: { color: "bg-red-100 text-red-700 border border-red-200", defaultLabel: "Paga" },
  receives: { color: "bg-green-100 text-green-700 border border-green-200", defaultLabel: "Cobra" },
  balanced: { color: "bg-blue-100 text-blue-700 border border-blue-200", defaultLabel: "Equilibrado" },
  guest: { color: "bg-amber-100 text-amber-700 border border-amber-200", defaultLabel: "Invitado" },
  neutral: { color: "bg-stone-100 text-stone-600 border border-stone-200", defaultLabel: "" },
};

export function Badge({ variant, label }: BadgeProps) {
  const { color, defaultLabel } = config[variant];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}>
      {label ?? defaultLabel}
    </span>
  );
}
