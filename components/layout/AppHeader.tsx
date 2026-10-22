import Link from "next/link";
import { BrandMark } from "./BrandMark";
import { ArrowRightIcon, HelpIcon } from "@/components/ui/icons";

interface AppHeaderProps {
  /** Acción de la derecha: ayuda (en la calculadora) o calcular (en la ayuda). */
  action?: "help" | "calculator";
}

export function AppHeader({ action = "help" }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b-2 border-ink bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-2xl items-center justify-between gap-3 px-4">
        <BrandMark size="sm" />
        <Link
          href={action === "help" ? "/ayuda" : "/calcular"}
          prefetch={action === "calculator" ? undefined : false}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border-2 border-ink bg-white px-3 text-sm font-bold shadow-hard-sm transition-transform hover:-translate-y-0.5"
        >
          {action === "help" ? (
            <>
              <HelpIcon className="text-base" />
              <span className="sm:hidden">Ayuda</span>
              <span className="hidden sm:inline">¿Cómo funciona?</span>
            </>
          ) : (
            <>
              <span>Ir a calcular</span>
              <ArrowRightIcon className="text-base" />
            </>
          )}
        </Link>
      </div>
    </header>
  );
}
