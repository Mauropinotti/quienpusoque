interface EventHeaderProps {
  eventName: string;
}

export function EventHeader({ eventName }: EventHeaderProps) {
  return (
    <div className="text-center py-6 px-4">
      <h1 className="text-3xl font-bold text-orange-600 tracking-tight">
        ¿Quién puso qué?
      </h1>
      {eventName && (
        <p className="mt-1 text-lg text-stone-600 font-medium">{eventName}</p>
      )}
      <p className="mt-2 text-sm text-stone-500">
        La matemática no perdona, pero reparte justo.
      </p>
    </div>
  );
}
