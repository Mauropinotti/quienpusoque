interface EventHeaderProps {
  eventName: string;
}

export function EventHeader({ eventName }: EventHeaderProps) {
  return (
    <header className="px-4 pb-5 pt-7 text-center">
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
        <p className="mt-2 text-sm text-stone-500">
          Para repartir claro después de juntarse.
        </p>
      )}
    </header>
  );
}
