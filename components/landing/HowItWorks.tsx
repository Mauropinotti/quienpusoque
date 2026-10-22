import type { ReactNode } from "react";
import { LockIcon } from "@/components/ui/icons";

interface StepCardProps {
  number: string;
  title: string;
  children: ReactNode;
  visual: ReactNode;
  className?: string;
  tilt?: string;
}

function StepCard({ number, title, children, visual, className = "", tilt = "" }: StepCardProps) {
  return (
    <article className={`reveal paper-card flex flex-col overflow-hidden ${tilt} ${className}`}>
      <div className="flex items-start justify-between gap-4 p-6 pb-0">
        <h3 className="font-display text-3xl">{title}</h3>
        <span className="font-mono text-sm font-black text-muted">{number}</span>
      </div>
      <p className="px-6 pt-3 text-base leading-relaxed text-ink-soft">{children}</p>
      <div className="mt-auto p-6 pt-5" aria-hidden="true">
        {visual}
      </div>
    </article>
  );
}

function FamilyChipsVisual() {
  const rows = [
    { name: "Los García", dots: 4, amount: "$8.000", tone: "bg-white" },
    { name: "Los López", dots: 1, amount: "$0", tone: "bg-white" },
    { name: "Los Martínez", dots: 1, amount: "no aporta", tone: "bg-mustard-soft" },
  ];

  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li
          key={row.name}
          className={`flex items-center justify-between gap-3 rounded-xl border-2 border-ink px-3 py-2 text-sm ${row.tone}`}
        >
          <span className="font-bold">{row.name}</span>
          <span className="flex gap-1">
            {Array.from({ length: row.dots }, (_, i) => (
              <span key={i} className="h-2.5 w-2.5 rounded-full bg-ink" />
            ))}
          </span>
          <span className="font-mono font-bold">{row.amount}</span>
        </li>
      ))}
    </ul>
  );
}

function ModeToggleVisual() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 rounded-xl border-2 border-ink bg-white p-1 text-sm font-bold">
        <span className="rounded-lg px-3 py-2 text-center text-muted">Por familia</span>
        <span className="rounded-lg bg-ember px-3 py-2 text-center">Por persona ✓</span>
      </div>
      <div className="space-y-1.5 font-mono text-xs">
        {[
          ["García", "w-[88%]"],
          ["Fernández", "w-[66%]"],
          ["Rodríguez", "w-[44%]"],
          ["López", "w-[22%]"],
        ].map(([name, width]) => (
          <div key={name} className="flex items-center gap-2">
            <span className="w-20 shrink-0">{name}</span>
            <span className={`h-3 rounded-full border-[1.5px] border-ink bg-sky ${width}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatVisual() {
  return (
    <div className="space-y-2">
      <div className="ml-auto max-w-[92%] rounded-2xl rounded-br-sm border-2 border-ink bg-[#dcf8c6] px-3.5 py-2.5 font-mono text-[12px] leading-relaxed">
        <p className="font-bold">Asado del sábado</p>
        <p>Gasto total: $16.000</p>
        <p>- Los López → Los García $4.000</p>
        <p>- Los Rodríguez → Los Fernández $1.000</p>
      </div>
      <div className="flex justify-end gap-2 text-xs font-bold">
        <span className="rounded-full border-2 border-ink bg-white px-2.5 py-0.5">Ticket PDF</span>
        <span className="rounded-full border-2 border-ink bg-white px-2.5 py-0.5">Historial</span>
      </div>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section
      id="como-funciona"
      aria-labelledby="como-funciona-title"
      className="mx-auto w-full max-w-6xl scroll-mt-6 px-4 py-20 sm:px-6 lg:py-28"
    >
      <div className="max-w-2xl">
        <p className="font-mono text-sm font-bold uppercase tracking-[0.25em] text-ember-text">
          Cómo funciona
        </p>
        <h2 id="como-funciona-title" className="font-display mt-3 text-5xl sm:text-6xl">
          Tres pasos y a la sobremesa.
        </h2>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StepCard
          number="01"
          title="Anotá quién vino"
          visual={<FamilyChipsVisual />}
          tilt="lg:-rotate-1"
        >
          Familias, parejas o sueltos: cuántos son y cuánto puso cada uno. Un
          menor que viene solo no aporta, y la app ya lo sabe.
        </StepCard>
        <StepCard
          number="02"
          title="Te sugerimos cómo repartir"
          visual={<ModeToggleVisual />}
          className="bg-sky-soft"
          tilt="lg:translate-y-6"
        >
          ¿Por familia o por persona? Miramos tamaños y diferencias de plata,
          te recomendamos uno y te explicamos por qué. La última palabra es tuya.
        </StepCard>
        <StepCard
          number="03"
          title="Pasale el ticket al grupo"
          visual={<ChatVisual />}
          tilt="lg:rotate-1"
          className="md:col-span-2 lg:col-span-1"
        >
          Las transferencias justas y mínimas, el resumen listo para WhatsApp y
          un ticket PDF prolijo con foto del evento si querés.
        </StepCard>

        <article className="reveal flex flex-col gap-6 rounded-[1.25rem] border-2 border-ink bg-ink p-7 text-paper shadow-[4px_4px_0_0_var(--color-ember)] md:col-span-2 lg:col-span-3 lg:mt-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ember text-2xl text-ink">
              <LockIcon />
            </span>
            <div>
              <h3 className="font-display text-3xl">Tus números no salen de tu celu.</h3>
              <p className="mt-2 max-w-xl text-paper/80">
                Sin cuentas, sin servidores, sin base de datos. Todo se calcula en
                tu navegador y el borrador se guarda solo por si se corta.
              </p>
            </div>
          </div>
          <ul className="grid shrink-0 grid-cols-3 gap-3 text-center font-mono text-xs uppercase tracking-wider">
            {[
              ["0", "registros"],
              ["0", "servidores"],
              ["100%", "local"],
            ].map(([value, label]) => (
              <li key={label} className="rounded-xl border-2 border-paper/25 px-3 py-3">
                <span className="block font-display text-2xl normal-case tracking-tight text-mustard">
                  {value}
                </span>
                {label}
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
