"use client";

import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface EventSetupCardProps {
  eventName: string;
  onEventNameChange: (name: string) => void;
  onNext: () => void;
}

export function EventSetupCard({
  eventName,
  onEventNameChange,
  onNext,
}: EventSetupCardProps) {
  return (
    <Card padding="lg">
      <h2 className="text-2xl font-black text-stone-950">Crear evento</h2>
      <p className="mt-2 text-sm leading-6 text-stone-600">
        Poné un nombre simple. Después cargás quién vino, cuánto puso y listo.
      </p>
      <div className="mt-5 flex flex-col gap-4">
        <Input
          label="Nombre del evento"
          placeholder="Ej: Asado del sábado"
          value={eventName}
          onChange={(e) => onEventNameChange(e.target.value)}
        />
        <Button fullWidth size="lg" onClick={onNext} disabled={!eventName.trim()}>
          Cargar familias
        </Button>
      </div>
    </Card>
  );
}
