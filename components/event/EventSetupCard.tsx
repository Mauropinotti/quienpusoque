"use client";

import { memo, type FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ArrowRightIcon, FlameIcon } from "@/components/ui/icons";

interface EventSetupCardProps {
  eventName: string;
  hasDraft: boolean;
  onEventNameChange: (name: string) => void;
  onNext: () => void;
  onLoadDemo: () => void;
  onReset: () => void;
}

const SUGGESTIONS = ["Asado del sábado", "Cumple", "Escapada", "Cena de fin de año"];

export const EventSetupCard = memo(function EventSetupCard({
  eventName,
  hasDraft,
  onEventNameChange,
  onNext,
  onLoadDemo,
  onReset,
}: EventSetupCardProps) {
  const isReady = eventName.trim().length > 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isReady) onNext();
  };

  return (
    <>
      <Card padding="lg" as="section">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-ember-text">
          Paso 1 · El evento
        </p>
        <h1 className="font-display mt-2 text-4xl sm:text-5xl">
          ¿Cómo se llama la juntada?
        </h1>
        <p className="mt-3 text-base leading-relaxed text-ink-soft">
          Un nombre simple alcanza. Aparece en el ticket, en el resumen de
          WhatsApp y en el historial.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <Input
            label="Nombre del evento"
            placeholder="Ej: Asado del sábado"
            value={eventName}
            maxLength={60}
            autoComplete="off"
            enterKeyHint="next"
            onChange={(event) => onEventNameChange(event.target.value)}
          />

          <div className="flex flex-wrap gap-2" aria-label="Sugerencias de nombre">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onEventNameChange(suggestion)}
                className="rounded-full border-2 border-ink bg-paper px-3 py-1.5 text-sm font-bold transition-colors hover:bg-mustard"
              >
                {suggestion}
              </button>
            ))}
          </div>

          <Button type="submit" size="lg" fullWidth disabled={!isReady} className="mt-2">
            Cargar familias
            <ArrowRightIcon />
          </Button>
        </form>
      </Card>

      <button
        type="button"
        onClick={onLoadDemo}
        className="group flex items-center gap-4 rounded-[1.25rem] border-2 border-dashed border-ink bg-mustard-soft p-4 text-left transition-colors hover:bg-mustard"
      >
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 border-ink bg-mustard text-2xl transition-transform group-hover:rotate-12">
          <FlameIcon />
        </span>
        <span>
          <span className="block font-bold">Probar con datos de ejemplo</span>
          <span className="block text-sm text-ink-soft">
            Un asado de 5 familias ya cargado, para ver cómo funciona.
          </span>
        </span>
      </button>

      {hasDraft && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-ink/20 bg-white/70 px-4 py-3">
          <p className="text-sm text-ink-soft">Tu cuenta se guarda sola en este navegador.</p>
          <button
            type="button"
            onClick={onReset}
            className="min-h-11 text-sm font-bold text-morron underline-offset-4 hover:underline"
          >
            Empezar de nuevo
          </button>
        </div>
      )}
    </>
  );
});
