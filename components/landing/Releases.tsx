import type { ReactNode } from "react";
import {
  CURRENT_RELEASE,
  RELEASES,
  formatReleaseMonth,
  releaseName,
} from "@/lib/releases";
import { DownloadIcon, UploadIcon } from "@/components/ui/icons";

// Sección "Progreso": qué trae la versión actual y el historial de versiones.
// Server Component: texto y CSS, sin JavaScript.

function Highlight({
  title,
  children,
  visual,
}: {
  title: string;
  children: ReactNode;
  visual: ReactNode;
}) {
  return (
    <article className="flex flex-col rounded-xl border-2 border-paper/30 bg-paper p-4 text-ink sm:p-5">
      <h4 className="font-display text-2xl">{title}</h4>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{children}</p>
      <div className="mt-auto pt-4" aria-hidden="true">
        {visual}
      </div>
    </article>
  );
}

function ReceiptVisual() {
  const lines = [
    ["Carne", "$6.500"],
    ["Carbón", "$1.500"],
  ];
  return (
    <div className="rounded-lg border-2 border-ink bg-white px-3 py-2 font-mono text-xs">
      {lines.map(([what, amount]) => (
        <p key={what} className="flex items-baseline gap-2">
          <span>{what}</span>
          <span className="flex-1 translate-y-[-3px] border-b border-dotted border-ink/30" />
          <span className="font-bold">{amount}</span>
        </p>
      ))}
      <p className="mt-1 flex justify-between border-t-2 border-dashed border-ink/20 pt-1 font-black">
        <span>Total</span>
        <span>$8.000</span>
      </p>
    </div>
  );
}

function MinorsVisual() {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 rounded-lg border-2 border-ink bg-white p-0.5 text-center text-xs font-bold">
        <span className="rounded-md px-2 py-1 text-muted">100%</span>
        <span className="rounded-md bg-ember px-2 py-1">50% ✓</span>
        <span className="rounded-md px-2 py-1 text-muted">0%</span>
      </div>
      <div className="rounded-lg border-2 border-ink bg-white px-3 py-2 font-mono text-[11px] leading-relaxed">
        <p>$12.000 ÷ 8 = $1.500 c/u</p>
        <p>menor paga 50%: $750</p>
        <p className="font-bold">adulto: $1.500 + $250 = $1.750</p>
      </div>
    </div>
  );
}

function ExportVisual() {
  return (
    <div className="flex items-center gap-2 font-mono text-xs">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-ink bg-white text-base">
        <DownloadIcon />
      </span>
      <span className="min-w-0 flex-1 truncate rounded-lg border-2 border-dashed border-ink bg-white px-2 py-2 font-bold">
        asado-del-sabado.json
      </span>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-ink bg-sky-soft text-base">
        <UploadIcon />
      </span>
    </div>
  );
}

export function Releases() {
  const current = CURRENT_RELEASE;

  return (
    <section
      id="versiones"
      aria-labelledby="versiones-title"
      className="mx-auto w-full max-w-6xl scroll-mt-6 px-4 pb-20 sm:px-6 lg:pb-28"
    >
      <div className="max-w-2xl">
        <p className="font-mono text-sm font-bold uppercase tracking-[0.25em] text-ember-text">
          Progreso
        </p>
        <h2 id="versiones-title" className="font-display mt-3 text-5xl sm:text-6xl">
          Lo nuevo en la V{current.version}.
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">
          Cada versión deja la cuenta más clara. Esta muestra qué puso cada uno,
          cuánto pagan los menores y cómo se llegó a cada número.
        </p>
      </div>

      <div className="reveal mt-10 rounded-[1.25rem] border-2 border-ink bg-ink p-5 text-paper shadow-[5px_5px_0_0_var(--color-ember)] sm:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-display text-4xl text-ember sm:text-5xl" data-testid="current-release">
            {releaseName(current)}
          </p>
          <span className="rounded-full border-2 border-ink bg-lime px-3 py-1 text-sm font-bold text-ink">
            Versión actual · {formatReleaseMonth(current)}
          </span>
        </div>
        <p className="mt-2 text-lg font-bold text-paper/85">{current.title}</p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Highlight title="Cada cosa con su monto" visual={<ReceiptVisual />}>
            Cargás qué puso cada uno y cuánto salió. La app suma el total y lo
            muestra en el ticket, el PDF y el WhatsApp.
          </Highlight>
          <Highlight title="Menores al 100, 50 o 0%" visual={<MinorsVisual />}>
            Contás adultos y menores. Por persona, ustedes eligen cuánto pagan
            los menores, y la cuenta queda paso a paso a la vista.
          </Highlight>
          <Highlight title="Exportá y seguí después" visual={<ExportVisual />}>
            Bajás un archivo con todo lo cargado y lo importás en el paso 1, en
            este celular o en otro.
          </Highlight>
        </div>
      </div>

      <h3 className="font-display mt-14 text-3xl sm:text-4xl">Versiones</h3>
      <ol className="mt-5 grid gap-4 md:grid-cols-3" aria-label="Historial de versiones">
        {RELEASES.map((release) => {
          const isCurrent = release.version === current.version;
          return (
            <li
              key={release.version}
              className={`reveal paper-card flex flex-col p-5 ${isCurrent ? "bg-ember-soft" : ""}`}
              data-testid="release"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-mono text-lg font-black">{releaseName(release)}</p>
                {isCurrent && (
                  <span className="rounded-full border-2 border-ink bg-lime px-2 py-0.5 text-xs font-bold">
                    Actual
                  </span>
                )}
              </div>
              <p className="font-mono text-xs uppercase tracking-widest text-muted">
                {formatReleaseMonth(release)}
              </p>
              <p className="mt-3 font-bold">{release.title}</p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-snug text-ink-soft">
                {release.changes.map((change) => (
                  <li key={change}>{change}</li>
                ))}
              </ul>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
