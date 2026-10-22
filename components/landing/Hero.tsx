import { ButtonLink } from "@/components/ui/ButtonLink";
import { ArrowRightIcon, FlameIcon, LockIcon, SparkIcon } from "@/components/ui/icons";
import { SettlementTicket } from "@/components/results/SettlementTicket";
import { DEMO_EVENT_NAME, DEMO_FAMILIES } from "@/lib/flow/demoEvent";
import { deriveSettlement } from "@/lib/flow/eventInsights";

// Las palabras que rotan en el título. La última es la que queda fija si el
// usuario pidió menos movimiento.
const ROTATING_WORDS = ["el carbón?", "el hielo?", "el vino?", "la birra?", "qué?"];

export function Hero() {
  // Se calcula en build con el mismo motor que usa la app: la muestra es real.
  const sample = deriveSettlement(DEMO_FAMILIES, "ARS", "by-family");

  return (
    <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pb-16 pt-6 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10 lg:pb-24 lg:pt-12">
      <div>
        <p className="inline-flex -rotate-2 items-center gap-2 rounded-full border-2 border-ink bg-lime px-3.5 py-1 text-sm font-bold shadow-hard-sm">
          <LockIcon className="text-base" />
          Sin registro · todo queda en tu celu
        </p>

        <h1 className="font-display mt-6 text-[clamp(3.4rem,13vw,7.6rem)] leading-[0.86]">
          <span className="sr-only">¿Quién puso qué?</span>
          <span aria-hidden="true">
            ¿Quién
            <br />
            puso{" "}
            <span className="word-rotator text-ember-text">
              {ROTATING_WORDS.map((word, index) => (
                <span
                  key={word}
                  style={{ "--i": index } as React.CSSProperties}
                  className="whitespace-nowrap underline decoration-ember decoration-wavy decoration-[0.07em] underline-offset-[0.14em]"
                >
                  {word}
                </span>
              ))}
            </span>
          </span>
        </h1>

        <p className="mt-9 max-w-xl text-lg leading-relaxed text-ink-soft sm:text-xl">
          Terminó la juntada y nadie sabe cuánto debe. Cargá quién vino y cuánto
          puso: la app reparte, te sugiere el criterio más justo y arma las
          transferencias para mandar al grupo.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <ButtonLink href="/calcular" size="xl" className="group">
            Empezar el cálculo
            <ArrowRightIcon className="transition-transform group-hover:translate-x-1" />
          </ButtonLink>
          <ButtonLink href="/calcular?demo=1" variant="ghost" size="lg" prefetch={false}>
            Ver un asado de ejemplo
          </ButtonLink>
        </div>

        <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold text-ink-soft">
          <li className="flex items-center gap-2">
            <FlameIcon className="text-lg text-ember-text" /> Listo en 2 minutos
          </li>
          <li className="flex items-center gap-2">
            <SparkIcon className="text-lg text-ember-text" /> Te dice cómo repartir
          </li>
          <li className="flex items-center gap-2">
            <LockIcon className="text-lg text-ember-text" /> Sin servidores ni cuentas
          </li>
        </ul>
      </div>

      {sample && (
        <div className="relative mx-auto mt-10 w-full max-w-sm lg:mt-0 lg:max-w-md">
          <div
            className="animate-print"
            style={{ "--tilt": "2deg" } as React.CSSProperties}
          >
            <SettlementTicket
              eventName={DEMO_EVENT_NAME}
              currency="ARS"
              settlement={sample}
              variant="preview"
              dateLabel="sáb · 21:47 · 5 familias"
              headingLevel="h2"
            />
          </div>

          <p
            aria-hidden="true"
            className="animate-wiggle absolute -left-3 -top-16 grid h-22 w-22 place-items-center rounded-full border-2 border-ink bg-mustard p-2 text-center text-[13px] font-extrabold leading-tight shadow-hard-sm lg:-left-24 lg:top-1/3"
            style={{ "--tilt": "-10deg" } as React.CSSProperties}
          >
            Los menores no pagan
          </p>
          <p
            aria-hidden="true"
            className="absolute -bottom-5 -right-2 rotate-3 rounded-2xl border-2 border-ink bg-lilac px-4 py-2 text-sm font-extrabold shadow-hard-sm sm:-right-8"
          >
            2 transferencias y listo ✓
          </p>
        </div>
      )}
    </section>
  );
}
