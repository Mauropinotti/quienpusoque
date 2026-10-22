"use client";

import { memo, useState } from "react";
import type { ClosedEvent } from "@/types/event";
import { formatMoney } from "@/lib/formatting/formatCurrency";
import { formatShortDateTime } from "@/lib/formatting/formatDate";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArrowRightIcon } from "@/components/ui/icons";

interface EventHistoryCardProps {
  event: ClosedEvent;
  onDelete: (id: string) => void;
}

export const EventHistoryCard = memo(function EventHistoryCard({
  event,
  onDelete,
}: EventHistoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const modeLabel = event.splitModeUsed === "by-family" ? "por familia" : "por persona";
  const detailsId = `history-${event.id}`;

  return (
    <li className="paper-card p-4" data-testid="history-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold">{event.eventName}</h3>
          <p className="font-mono text-xs text-muted">
            Cerrado el {formatShortDateTime(event.closedAt)}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="neutral" label={`Reparto ${modeLabel}`} />
            <Badge variant="neutral" label={`${event.familiesSnapshot.length} familias`} />
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted">
            Total
          </p>
          <p className="tabular font-mono text-xl font-black">{formatMoney(event.totalAmount)}</p>
        </div>
      </div>

      {isExpanded && (
        <div id={detailsId} className="mt-4 border-t-2 border-dashed border-ink/15 pt-3">
          <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted">
            Transferencias
          </p>
          {event.transfersSnapshot.length > 0 ? (
            <ul className="mt-2 space-y-1.5 text-sm">
              {event.transfersSnapshot.map((transfer, index) => (
                <li key={`${transfer.fromFamilyId}-${transfer.toFamilyId}-${index}`}>
                  <span className="font-bold">{transfer.fromFamilyName}</span>
                  <ArrowRightIcon className="mx-1 inline-block align-[-2px] text-ember-text" />
                  <span className="sr-only"> le transfiere a </span>
                  <span className="font-bold">{transfer.toFamilyName}</span>{" "}
                  <span className="tabular font-mono">{formatMoney(transfer.amount)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-ink-soft">No hubo transferencias.</p>
          )}
          {event.optionalNote && (
            <p className="mt-3 rounded-lg bg-paper p-3 text-sm text-ink-soft">{event.optionalNote}</p>
          )}
        </div>
      )}

      {isConfirmingDelete ? (
        <div role="alert" className="mt-4 rounded-xl border-2 border-morron bg-morron-soft p-3">
          <p className="font-bold text-morron">¿Borrar esta cuenta del historial?</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsConfirmingDelete(false)}>
              Volver
            </Button>
            <Button variant="danger" size="sm" onClick={() => onDelete(event.id)}>
              Borrar
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsExpanded((current) => !current)}
            aria-expanded={isExpanded}
            aria-controls={detailsId}
          >
            {isExpanded ? "Ocultar" : "Ver detalle"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-morron"
            onClick={() => setIsConfirmingDelete(true)}
          >
            Borrar
          </Button>
        </div>
      )}
    </li>
  );
});
