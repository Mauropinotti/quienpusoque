"use client";

import { memo, useCallback, useState } from "react";
import type { Family } from "@/types/family";
import type { EventTicketPdfData, EventTicketPhoto } from "@/types/pdf";
import type { SplitRecommendation } from "@/types/recommendation";
import type { Settlement } from "@/lib/flow/eventInsights";
import { formatMediumDateTime } from "@/lib/formatting/formatDate";
import { generateWhatsappText } from "@/lib/text/generateWhatsappText";
import { Button } from "@/components/ui/Button";
import { BookmarkIcon, CheckIcon, PencilIcon, PlusIcon } from "@/components/ui/icons";
import { EventPhotoUploader } from "@/components/event/EventPhotoUploader";
import { StepHeader } from "@/components/calculator/StepHeader";
import { CopyResultButton } from "./CopyResultButton";
import { ExportPdfButton } from "./ExportPdfButton";
import { SettlementTicket } from "./SettlementTicket";

interface ResultsStepProps {
  eventName: string;
  currency: string;
  families: Family[];
  settlement: Settlement;
  recommendation: SplitRecommendation | null;
  ticketPhoto: EventTicketPhoto | null;
  isSavedToHistory: boolean;
  historySaveError: string;
  onTicketPhotoChange: (photo: EventTicketPhoto | null) => void;
  onSaveClosedEvent: () => void;
  onEditFamilies: () => void;
  onReset: () => void;
}

// El ticket solo se vuelve a dibujar si cambia el cálculo, no al guardar en el
// historial ni al elegir una foto.
const MemoTicket = memo(SettlementTicket);

// Se carga con next/dynamic: no forma parte del bundle inicial de /calcular.
export function ResultsStep({
  eventName,
  currency,
  families,
  settlement,
  recommendation,
  ticketPhoto,
  isSavedToHistory,
  historySaveError,
  onTicketPhotoChange,
  onSaveClosedEvent,
  onEditFamilies,
  onReset,
}: ResultsStepProps) {
  const [dateLabel] = useState(() => formatMediumDateTime(new Date()));
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  const getWhatsappText = useCallback(
    () =>
      generateWhatsappText({
        eventName,
        currency,
        splitMode: settlement.splitMode,
        balances: settlement.balances,
        transfers: settlement.transfers,
      }),
    [currency, eventName, settlement]
  );

  const getPdfData = useCallback(
    (): EventTicketPdfData => ({
      appName: "¿Quién puso qué?",
      eventName,
      currency,
      generatedAt: new Date(),
      splitMode: settlement.splitMode,
      families,
      balances: settlement.balances,
      transfers: settlement.transfers,
      recommendation,
      photo: ticketPhoto,
    }),
    [currency, eventName, families, recommendation, settlement, ticketPhoto]
  );

  return (
    <>
      <StepHeader
        kicker="Paso 4 · El ticket"
        title="¡Cuenta cerrada!"
        onBack={onEditFamilies}
        backLabel="Editar familias"
      />

      {settlement.totalAmount === 0 && (
        <div className="rounded-xl border-2 border-ink bg-mustard-soft px-4 py-3">
          <p className="font-bold text-mustard-text">El gasto total quedó en cero.</p>
          <p className="text-sm text-mustard-text">
            No hay nada para transferir. Si faltó cargar un gasto, volvé a editar familias.
          </p>
        </div>
      )}

      <div className="animate-print px-1" style={{ "--tilt": "-0.6deg" } as React.CSSProperties}>
        <MemoTicket
          eventName={eventName}
          currency={currency}
          settlement={settlement}
          variant="full"
          dateLabel={dateLabel}
        />
      </div>

      <section aria-labelledby="share-title" className="paper-card mt-2 flex flex-col gap-3 p-5">
        <h2 id="share-title" className="font-display text-2xl">
          Compartir y cerrar
        </h2>

        <CopyResultButton getText={getWhatsappText} />
        <ExportPdfButton getData={getPdfData} />
        <EventPhotoUploader photo={ticketPhoto} onPhotoChange={onTicketPhotoChange} />

        <Button
          variant={isSavedToHistory ? "ink" : "secondary"}
          fullWidth
          onClick={onSaveClosedEvent}
          disabled={isSavedToHistory}
          className="disabled:opacity-100"
        >
          {isSavedToHistory ? <CheckIcon /> : <BookmarkIcon />}
          {isSavedToHistory ? "Guardado en el historial" : "Guardar en el historial"}
        </Button>
        {historySaveError && (
          <p role="alert" className="rounded-xl border-2 border-ink bg-mustard-soft px-3 py-2 text-sm text-mustard-text">
            {historySaveError}
          </p>
        )}
      </section>

      {isConfirmingReset ? (
        <div role="alert" className="rounded-xl border-2 border-morron bg-morron-soft p-4">
          <p className="font-bold text-morron">¿Arrancamos una cuenta nueva?</p>
          <p className="text-sm text-morron">
            Se borra esta cuenta del borrador. El historial guardado queda.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsConfirmingReset(false)}>
              Mejor no
            </Button>
            <Button variant="danger" size="sm" onClick={onReset}>
              Sí, nueva cuenta
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={onEditFamilies}>
            <PencilIcon />
            Editar familias
          </Button>
          <Button variant="secondary" onClick={() => setIsConfirmingReset(true)}>
            <PlusIcon />
            Nuevo evento
          </Button>
        </div>
      )}
    </>
  );
}
