import Link from "next/link";
import { BrandMark } from "@/components/layout/BrandMark";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ArrowRightIcon } from "@/components/ui/icons";

export function LandingNav() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
      <BrandMark />
      <nav aria-label="Principal" className="flex items-center gap-1 sm:gap-3">
        {/* Ancla en la misma página: <a> plano, Link prefetchearía "/" otra vez. */}
        <a
          href="#como-funciona"
          className="hidden rounded-lg px-3 py-2 font-bold underline-offset-4 hover:underline sm:inline-block"
        >
          Cómo funciona
        </a>
        <Link
          href="/ayuda"
          prefetch={false}
          className="hidden rounded-lg px-3 py-2 font-bold underline-offset-4 hover:underline md:inline-block"
        >
          Ayuda
        </Link>
        <ButtonLink href="/calcular" size="sm" variant="ink">
          Calcular
          <ArrowRightIcon />
        </ButtonLink>
      </nav>
    </header>
  );
}
