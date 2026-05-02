"use client";
import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-orange-600 hover:bg-orange-700 text-white shadow-sm active:scale-[0.98]",
  secondary:
    "bg-white hover:bg-orange-50 text-orange-700 border border-orange-200 active:scale-[0.98]",
  ghost: "bg-transparent hover:bg-orange-50 text-orange-700 active:scale-[0.98]",
  danger: "bg-red-600 hover:bg-red-700 text-white active:scale-[0.98]",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-3 text-base",
  lg: "px-5 py-4 text-base font-semibold",
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={[
        "min-h-11 rounded-lg font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </button>
  );
}
