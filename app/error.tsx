"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";

// Límite de error de la app: si algo falla al renderizar, el usuario puede
// reintentar sin perder el borrador (vive en localStorage).
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col items-start justify-center gap-5 px-4 py-16">
      <p className="font-mono text-sm font-bold uppercase tracking-[0.25em] text-morron">
        Se quemó el asado
      </p>
      <h1 className="font-display text-5xl sm:text-6xl">Algo salió mal.</h1>
      <p className="text-lg text-ink-soft">
        Tu cuenta sigue guardada en este navegador. Probá de nuevo y debería aparecer.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button size="lg" onClick={reset}>
          Reintentar
        </Button>
        <ButtonLink href="/" variant="secondary" size="lg">
          Volver al inicio
        </ButtonLink>
      </div>
    </main>
  );
}
