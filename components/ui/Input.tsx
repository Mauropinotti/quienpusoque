import { useId, type InputHTMLAttributes, type ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: ReactNode;
  /** Texto fijo a la izquierda, por ejemplo "$". */
  prefix?: string;
}

export function Input({
  label,
  error,
  hint,
  prefix,
  className = "",
  id,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = `${inputId}-description`;
  const hasDescription = Boolean(error || hint);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-bold text-ink">
          {label}
        </label>
      )}
      <div className="relative">
        {prefix && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-4 flex items-center font-mono text-lg font-bold text-muted"
          >
            {prefix}
          </span>
        )}
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={hasDescription ? descriptionId : undefined}
          {...props}
          className={[
            "min-h-13 w-full rounded-xl border-2 border-ink bg-white px-4 py-3 text-lg text-ink placeholder:text-muted/70 transition-shadow focus:shadow-hard-sm focus:outline-none disabled:cursor-not-allowed disabled:bg-paper-deep disabled:text-muted",
            prefix ? "pl-9 font-mono font-bold" : "",
            error ? "border-morron bg-morron-soft" : "",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
        />
      </div>
      {hint && !error && (
        <p id={descriptionId} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={descriptionId} className="text-sm font-bold text-morron">
          {error}
        </p>
      )}
    </div>
  );
}
