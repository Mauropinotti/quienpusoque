import { ButtonLink } from "@/components/ui/ButtonLink";
import { ArrowRightIcon } from "@/components/ui/icons";

export function FinalCta() {
  return (
    <section className="px-4 pb-20 sm:px-6 lg:pb-28">
      <div className="reveal mx-auto flex max-w-6xl flex-col items-start gap-8 rounded-[2rem] border-2 border-ink bg-ember p-8 shadow-hard-lg sm:p-12 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-sm font-bold uppercase tracking-[0.25em]">
            La próxima juntada
          </p>
          <h2 className="font-display mt-3 max-w-2xl text-5xl sm:text-6xl">
            Cuentas claras desde el primer chori.
          </h2>
        </div>
        <ButtonLink href="/calcular" variant="ink" size="xl" className="group shrink-0">
          Empezar el cálculo
          <ArrowRightIcon className="transition-transform group-hover:translate-x-1" />
        </ButtonLink>
      </div>
    </section>
  );
}
