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
  const isReady = eventName.trim().length > 0;

  return (
    <Card padding="lg" className="border-orange-100">
      <p className="text-sm font-semibold text-orange-700">
        Cuentas claras siempre!
      </p>
      <h2 className="mt-2 text-2xl font-black text-stone-950">
        Creá el evento
      </h2>
      <p className="mt-2 text-sm leading-6 text-stone-600">
        Poné un nombre simple. Después cargás quién vino, cuánto puso y cerrás
        el reparto con transferencias claras.
      </p>
      <div className="mt-5 flex flex-col gap-4">
        <Input
          label="Nombre del evento"
          placeholder="Ej: Asado del sábado"
          value={eventName}
          onChange={(e) => onEventNameChange(e.target.value)}
          hint={!isReady ? "Necesitamos un nombre para guardar el borrador." : undefined}
        />
        <Button fullWidth size="lg" onClick={onNext} disabled={!isReady}>
          Cargar familias
        </Button>
      </div>
    </Card>
  );
}
