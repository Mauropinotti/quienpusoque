import { AppFooter } from "@/components/layout/AppFooter";
import { AppHeader } from "@/components/layout/AppHeader";
import { ButtonLink } from "@/components/ui/ButtonLink";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-start justify-center gap-5 px-4 py-16">
        <p className="font-mono text-sm font-bold uppercase tracking-[0.25em] text-ember-text">
          Error 404
        </p>
        <h1 className="font-display text-6xl">Esta página no vino al asado.</h1>
        <p className="text-lg text-ink-soft">
          El link está mal o la página ya no existe. La cuenta, igual, te espera.
        </p>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/calcular" size="lg">
            Ir a calcular
          </ButtonLink>
          <ButtonLink href="/" variant="secondary" size="lg">
            Volver al inicio
          </ButtonLink>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
