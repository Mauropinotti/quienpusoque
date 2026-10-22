import Link from "next/link";

export function AppFooter() {
  return (
    <footer className="mt-auto border-t-2 border-ink bg-paper-deep px-4 py-6 text-sm">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
        <p className="font-medium text-ink-soft">
          desarrollado por MauroHP - Lista 127 8B 2026.-
        </p>
        <nav aria-label="Enlaces del pie" className="flex gap-4 font-bold">
          <Link href="/calcular" prefetch={false} className="underline-offset-4 hover:underline">
            Calculadora
          </Link>
          <Link href="/ayuda" prefetch={false} className="underline-offset-4 hover:underline">
            Ayuda
          </Link>
        </nav>
      </div>
    </footer>
  );
}
