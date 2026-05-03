"use client";
import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className = "", id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  const descriptionId = `${inputId}-description`;
  const hasDescription = Boolean(error || hint);
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-stone-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={hasDescription ? descriptionId : undefined}
        {...props}
        className={[
          "w-full min-h-12 rounded-lg border px-4 py-3 text-base text-stone-800 placeholder-stone-400 transition focus:outline-none focus:ring-2 focus:ring-orange-400",
          error
            ? "border-red-400 bg-red-50"
            : "border-stone-300 bg-white hover:border-orange-300",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      />
      {hint && !error && (
        <p id={descriptionId} className="text-xs text-stone-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={descriptionId} className="text-xs font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
