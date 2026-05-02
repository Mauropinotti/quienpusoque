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
      <h2 className="text-xl font-bold text-stone-800 mb-1">Nuevo evento</h2>
      <p className="text-sm text-stone-500 mb-4">
        ¿Cómo se llama la reunión? Asado, cumple, viaje… lo que sea.
      </p>
      <div className="flex flex-col gap-4">
        <Input
          label="Nombre del evento"
          placeholder="Ej: Asado del sábado"
          value={eventName}
          onChange={(e) => onEventNameChange(e.target.value)}
        />
        <Button fullWidth size="lg" onClick={onNext} disabled={!eventName.trim()}>
          Cargar familias →
        </Button>
      </div>
    </Card>
  );
}
