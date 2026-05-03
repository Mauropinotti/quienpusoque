"use client";

import { useState } from "react";
import type { ClosedEvent } from "@/types/event";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/formatting/formatCurrency";

interface EventHistoryCardProps {
  event: ClosedEvent;
  onDelete: (id: string) => void;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function EventHistoryCard({ event, onDelete }: EventHistoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const modeLabel =
    event.splitModeUsed === "by-family" ? "por familia" : "por persona";

  return (
    <Card padding="md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold text-stone-900">
            {event.eventName}
          </h3>
          <p className="mt-1 text-xs text-stone-500">
            Cerrado el {formatDate(event.closedAt)}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="neutral" label={`Reparto ${modeLabel}`} />
            <Badge
              variant="neutral"
              label={`${event.familiesSnapshot.length} familias`}
            />
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
            Total
          </p>
          <p className="text-xl font-black text-orange-700">
            {formatCurrency(event.totalAmount)}
          </p>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-3 border-t border-stone-100 pt-4">
          <div>
            <p className="text-sm font-bold text-stone-900">Transferencias</p>
            {event.transfersSnapshot.length > 0 ? (
              <ul className="mt-2 space-y-1">
                {event.transfersSnapshot.map((transfer, index) => (
                  <li
                    key={`${transfer.fromFamilyId}-${transfer.toFamilyId}-${index}`}
                    className="text-sm text-stone-600"
                  >
                    {transfer.fromFamilyName} le transfiere{" "}
                    <span className="font-semibold text-stone-900">
                      {formatCurrency(transfer.amount)}
                    </span>{" "}
                    a {transfer.toFamilyName}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-stone-600">
                No hubo transferencias.
              </p>
            )}
          </div>

          {event.optionalNote && (
            <p className="rounded-lg bg-stone-50 p-3 text-sm text-stone-600">
              {event.optionalNote}
            </p>
          )}
        </div>
      )}

      {isConfirmingDelete ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm font-medium text-red-800">
            ¿Borrar este evento del historial?
          </p>
          <p className="mt-1 text-xs text-red-700">
            No afecta el borrador actual.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              onClick={() => setIsConfirmingDelete(false)}
            >
              Volver
            </Button>
            <Button
              variant="danger"
              size="sm"
              fullWidth
              onClick={() => onDelete(event.id)}
            >
              Borrar
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            onClick={() => setIsExpanded((current) => !current)}
            aria-expanded={isExpanded}
          >
            {isExpanded ? "Ocultar" : "Ver detalle"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            fullWidth
            className="text-red-700 hover:bg-red-50"
            onClick={() => setIsConfirmingDelete(true)}
          >
            Borrar
          </Button>
        </div>
      )}
    </Card>
  );
}
