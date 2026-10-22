const ITEMS = [
  "el carbón",
  "el hielo",
  "el chori",
  "el pan",
  "el vacío",
  "el fernet",
  "la ensalada",
  "el vino",
  "el postre",
  "las servilletas",
];

function Row({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {ITEMS.map((item) => (
        <li key={item} className="flex items-center">
          <span className="px-5 font-display text-3xl lowercase sm:text-4xl">
            ¿quién puso {item}?
          </span>
          <span aria-hidden="true" className="text-2xl text-ember">
            ✦
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Cinta animada con CSS: el contenido se duplica para que el loop sea continuo. */
export function Marquee() {
  return (
    <div className="relative -my-2 overflow-hidden">
      <div className="-mx-4 -rotate-[1.5deg] border-y-2 border-ink bg-ink py-4 text-paper">
        <div className="marquee-track flex w-max animate-marquee hover:[animation-play-state:paused]">
          <Row />
          <Row hidden />
        </div>
      </div>
    </div>
  );
}
