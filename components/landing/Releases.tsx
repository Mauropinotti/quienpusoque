import type { ReactNode } from "react";
import {
  CURRENT_RELEASE,
  RELEASES,
  formatReleaseMonth,
  releaseName,
} from "@/lib/releases";
import { ArrowRightIcon } from "@/components/ui/icons";

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

function PortionsVisual() {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 rounded-lg border-2 border-ink bg-white p-0.5 text-center text-xs font-bold">
        <span className="rounded-md px-2 py-1 text-muted">100%</span>
        <span className="rounded-md bg-ember px-2 py-1">50% ✓</span>
        <span className="rounded-md px-2 py-1 text-muted">0%</span>
      </div>
      <div className="rounded-lg border-2 border-ink bg-white px-3 py-2 font-mono text-[11px] leading-relaxed">
        <p>5 adultos × 1 + 3 menores × ½</p>
        <p>= 6,5 porciones</p>
        <p className="font-bold">$12.000 ÷ 6,5 = $1.846,15</p>
      </div>
    </div>
  );
}

function OneParentVisual() {
  const lines = [
    ["1 adulta × 1", "$1.846,15"],
    ["1 menor × ½", "$923,08"],
  ];
  return (
    <div className="rounded-lg border-2 border-ink bg-white px-3 py-2 font-mono text-xs">
      <p className="mb-1 font-bold">Ana</p>
      {lines.map(([what, amount]) => (
        <p key={what} className="flex items-baseline gap-2">
          <span>{what}</span>
          <span className="flex-1 translate-y-[-3px] border-b border-dotted border-ink/30" />
          <span className="font-bold">{amount}</span>
        </p>
      ))}
      <p className="mt-1 flex justify-between border-t-2 border-dashed border-ink/20 pt-1 font-black">
        <span>1,5 porciones</span>
        <span>$2.769,23</span>
      </p>
    </div>
  );
}

function GuardianVisual() {
  return (
    <div className="flex items-center gap-2 rounded-xl border-2 border-ink bg-paper px-3 py-2 text-xs">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink font-mono text-[11px] font-bold text-paper">
        1
      </span>
      <p className="min-w-0 flex-1 leading-tight">
        <span className="font-bold">Padre/madre o tutor encargado de Juli</span>
        <ArrowRightIcon className="mx-1 inline-block align-[-2px] text-ember-text" />
        <span className="font-bold">Los Pérez</span>
      </p>
      <span className="font-mono font-black">$923</span>
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
          Cada versión deja la cuenta más clara. Esta reparte todo por porciones:
          un solo criterio, sin sugerencias, que cubre familias con chicos,
          adultos solos y menores que vinieron por su cuenta.
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
          <Highlight title="Por porciones" visual={<PortionsVisual />}>
            Cada adulto es una porción y cada menor cuenta entera, media o nada.
            El total se divide por las porciones: nadie paga lo que no paga otro.
          </Highlight>
          <Highlight title="El caso 1 + 1, resuelto" visual={<OneParentVisual />}>
            Una mamá o un papá con su hijo paga 1,5 porciones: el menor paga
            exactamente la mitad que un adulto.
          </Highlight>
          <Highlight title="Menores solos, con su tutor" visual={<GuardianVisual />}>
            Si un menor vino solo y paga su parte, la cuenta lo marca y transfiere
            su padre, madre o tutor.
          </Highlight>
        </div>
      </div>

      <h3 className="font-display mt-14 text-3xl sm:text-4xl">Versiones</h3>
      <ol className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4" aria-label="Historial de versiones">
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
