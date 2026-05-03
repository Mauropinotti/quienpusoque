"use client";

import { useEffect, useState } from "react";
import type { ClosedEvent } from "@/types/event";
import {
  deleteClosedEvent,
  readClosedEvents,
} from "@/lib/storage/closedEventsStorage";
import { EventHistoryCard } from "./EventHistoryCard";

interface EventHistoryListProps {
  refreshKey?: number;
}

export function EventHistoryList({ refreshKey = 0 }: EventHistoryListProps) {
  const [events, setEvents] = useState<ClosedEvent[]>([]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setEvents(readClosedEvents());
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [refreshKey]);

  const handleDelete = (eventId: string) => {
    setEvents(deleteClosedEvent(eventId));
  };

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-bold text-stone-900">
          Historial en este navegador
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          Eventos cerrados que guardaste localmente.
        </p>
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
