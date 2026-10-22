import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "ink";
export type ButtonSize = "sm" | "md" | "lg" | "xl";

interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl font-bold tracking-tight select-none disabled:cursor-not-allowed disabled:opacity-45";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "press border-2 border-ink bg-ember text-ink shadow-hard",
  ink: "press border-2 border-ink bg-ink text-paper shadow-[4px_4px_0_0_var(--color-ember)] hover:shadow-[6px_6px_0_0_var(--color-ember)]",
  secondary: "press border-2 border-ink bg-white text-ink shadow-hard-sm",
  ghost:
    "border-2 border-transparent text-ink underline decoration-2 underline-offset-4 decoration-ink/25 transition-colors hover:decoration-ember hover:bg-ink/5",
  danger: "press border-2 border-ink bg-morron text-white shadow-hard-sm",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-base",
  lg: "px-5 py-3.5 text-lg",
  xl: "min-h-16 px-7 py-4 text-xl",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
}: ButtonStyleOptions = {}): string {
  return [
    base,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    Omit<ButtonStyleOptions, "className"> {}

export function Button({
  variant,
  size,
  fullWidth,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      {...props}
      className={buttonClasses({ variant, size, fullWidth, className })}
    />
  );
}
