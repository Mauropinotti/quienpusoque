interface EventHeaderProps {
  eventName: string;
}

export function EventHeader({ eventName }: EventHeaderProps) {
  return (
    <header className="px-4 pb-5 pt-7 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-600 text-xl font-black text-white shadow-sm">
        Q
      </div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-700">
        Gastos compartidos
      </p>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-stone-950">
        ¿Quién puso qué?
      </h1>
      {eventName ? (
        <p className="mt-2 text-base font-semibold text-stone-700">
          {eventName}
        </p>
      ) : (
        <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-stone-600">
          Repartí gastos sin planillas, sin vueltas y con números claros.
        </p>
      )}
    </header>
  );
}
