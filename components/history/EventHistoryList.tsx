"use client";

import { useEffect, useState } from "react";
import type { ClosedEvent } from "@/types/event";
import {
  clearClosedEvents,
  deleteClosedEvent,
  readClosedEvents,
} from "@/lib/storage/closedEventsStorage";
import { EventHistoryCard } from "./EventHistoryCard";
import { Button } from "@/components/ui/Button";

interface EventHistoryListProps {
  refreshKey?: number;
}

export function EventHistoryList({ refreshKey = 0 }: EventHistoryListProps) {
  const [events, setEvents] = useState<ClosedEvent[]>([]);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setEvents(readClosedEvents());
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [refreshKey]);

  const handleDelete = (eventId: string) => {
    setEvents(deleteClosedEvent(eventId));
  };

  const handleClearAll = () => {
    setEvents(clearClosedEvents());
    setIsConfirmingClear(false);
  };

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
        <h2 className="text-lg font-bold text-stone-900">
          Historial en este navegador
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          Eventos cerrados que guardaste localmente.
        </p>
        </div>
        {events.length > 0 && !isConfirmingClear && (
          <button
            type="button"
            onClick={() => setIsConfirmingClear(true)}
            className="min-h-10 shrink-0 rounded-lg px-2 text-sm font-semibold text-stone-500 transition hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            Borrar todo
          </button>
        )}
      </div>

      {events.length === 0 ? (
        <div className="rounded-lg border border-dashed border-stone-200 bg-white/70 p-4 text-center">
          <p className="text-sm font-medium text-stone-700">
            Todavía no hay eventos cerrados.
          </p>
          <p className="mt-1 text-sm text-stone-500">
            Cuando cierres una cuenta, podés guardarla acá.
          </p>
        </div>
      ) : isConfirmingClear ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm font-semibold text-red-800">
            ¿Borrar todo el historial?
          </p>
          <p className="mt-1 text-xs text-red-700">
            Esto no borra el evento que estés editando.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              onClick={() => setIsConfirmingClear(false)}
            >
              Cancelar
            </Button>
            <Button variant="danger" size="sm" fullWidth onClick={handleClearAll}>
              Borrar historial
            </Button>
          </div>
        </div>
      ) : (
        events.map((event) => (
          <EventHistoryCard
            key={event.id}
            event={event}
            onDelete={handleDelete}
          />
        ))
      )}
    </section>
  );
}
