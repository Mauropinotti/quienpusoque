"use client";

import { memo, useCallback, useState, useSyncExternalStore } from "react";
import {
  clearClosedEvents,
  deleteClosedEvent,
  getClosedEventsSnapshot,
  getServerClosedEventsSnapshot,
  subscribeToClosedEvents,
} from "@/lib/storage/closedEventsStorage";
import { Button } from "@/components/ui/Button";
import { EventHistoryCard } from "./EventHistoryCard";

// Se suscribe al store en memoria del historial: guardar o borrar actualiza la
// lista sin releer ni revalidar localStorage, y se sincroniza entre pestañas.
// memo: no tiene props, así que tipear en el paso 1 no la re-renderiza.
export const EventHistoryList = memo(function EventHistoryList() {
  const events = useSyncExternalStore(
    subscribeToClosedEvents,
    getClosedEventsSnapshot,
    getServerClosedEventsSnapshot
  );
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  const handleDelete = useCallback((eventId: string) => {
    deleteClosedEvent(eventId);
  }, []);

  const handleClearAll = () => {
    clearClosedEvents();
    setIsConfirmingClear(false);
  };

  return (
    <section aria-labelledby="history-title" className="mt-6 flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 id="history-title" className="font-display text-3xl">
            Cuentas cerradas
          </h2>
          <p className="text-sm text-ink-soft">Guardadas solo en este navegador.</p>
        </div>
        {events.length > 0 && !isConfirmingClear && (
          <button
            type="button"
            onClick={() => setIsConfirmingClear(true)}
            className="min-h-11 shrink-0 rounded-lg px-2 text-sm font-bold text-morron underline-offset-4 hover:underline"
          >
            Borrar todo
          </button>
        )}
      </div>

      {events.length === 0 ? (
        <div className="rounded-[1.25rem] border-2 border-dashed border-ink/30 bg-white/50 p-5 text-center">
          <p className="font-bold">Todavía no cerraste ninguna cuenta.</p>
          <p className="mt-1 text-sm text-ink-soft">
            Cuando termines un cálculo, guardalo y aparece acá.
          </p>
        </div>
      ) : isConfirmingClear ? (
        <div role="alert" className="rounded-xl border-2 border-morron bg-morron-soft p-4">
          <p className="font-bold text-morron">¿Borrar todo el historial?</p>
          <p className="text-sm text-morron">No toca la cuenta que estás editando.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsConfirmingClear(false)}>
              Cancelar
            </Button>
            <Button variant="danger" size="sm" onClick={handleClearAll}>
              Borrar historial
            </Button>
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {events.map((event) => (
            <EventHistoryCard key={event.id} event={event} onDelete={handleDelete} />
          ))}
        </ul>
      )}
    </section>
  );
});
