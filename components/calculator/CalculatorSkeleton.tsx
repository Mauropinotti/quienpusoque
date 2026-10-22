/** Placeholder con la misma geometría que el primer paso: evita layout shift. */
export function CalculatorSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-2xl px-4 pb-16 pt-6"
      aria-busy="true"
      aria-label="Cargando la calculadora"
    >
      <div className="h-12 rounded-2xl border-2 border-ink/15 bg-white/60" />
      <div className="mt-6 space-y-4 rounded-[1.25rem] border-2 border-ink/15 bg-white/60 p-7">
        <div className="h-4 w-24 animate-pulse rounded bg-ink/10" />
        <div className="h-10 w-3/4 animate-pulse rounded bg-ink/10" />
        <div className="h-13 animate-pulse rounded-xl bg-ink/10" />
        <div className="h-13 animate-pulse rounded-xl bg-ink/10" />
      </div>
    </div>
  );
}

/** Mientras baja el chunk de un paso (normalmente ya está precargado). */
export function StepSkeleton() {
  return (
    <div aria-busy="true" className="space-y-4 pt-2">
      <div className="h-9 w-2/3 animate-pulse rounded bg-ink/10" />
      <div className="h-64 animate-pulse rounded-[1.25rem] border-2 border-ink/15 bg-white/60" />
    </div>
  );
}
