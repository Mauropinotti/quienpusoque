import type { FamilyBalance, Transfer } from "@/types/calculation";
import type { Family, SplitMode } from "@/types/family";
import type { SplitRecommendation } from "@/types/recommendation";
import type { EventTicketPhoto } from "@/types/pdf";
import { BalanceCard } from "./BalanceCard";
import { TransfersList } from "./TransfersList";
import { CopyResultButton } from "./CopyResultButton";
import { ExportPdfButton } from "./ExportPdfButton";
import { Button } from "@/components/ui/Button";
import { EventPhotoUploader } from "@/components/event/EventPhotoUploader";
import { generateWhatsappText } from "@/lib/text/generateWhatsappText";
import { formatCurrency } from "@/lib/formatting/formatCurrency";

interface ResultsSummaryProps {
  eventName: string;
  currency: string;
  splitMode: SplitMode;
  families: Family[];
  balances: FamilyBalance[];
  transfers: Transfer[];
  recommendation: SplitRecommendation | null;
  ticketPhoto: EventTicketPhoto | null;
  isSavedToHistory?: boolean;
  historySaveError?: string;
  onTicketPhotoChange: (photo: EventTicketPhoto | null) => void;
  onSaveClosedEvent: () => void;
  onEditFamilies: () => void;
  onReset: () => void;
}

export function ResultsSummary({
  eventName,
  currency,
  splitMode,
  families,
  balances,
  transfers,
  recommendation,
  ticketPhoto,
  isSavedToHistory = false,
  historySaveError,
  onTicketPhotoChange,
  onSaveClosedEvent,
  onEditFamilies,
  onReset,
}: ResultsSummaryProps) {
  const total = balances.reduce((sum, balance) => sum + balance.paidAmount, 0);
  const modeLabel = splitMode === "by-family" ? "por familia" : "por persona";
  const hasNoTotal = total === 0;

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border border-orange-200 bg-orange-50 p-5 text-center">
        <p className="text-sm font-medium text-orange-800">Total del evento</p>
        <p className="mt-1 text-4xl font-black text-orange-800">
          {formatCurrency(total, currency)}
        </p>
        <p className="mt-2 text-sm text-orange-900">Reparto {modeLabel}</p>
      </section>

      {hasNoTotal && (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">
            El gasto total quedó en cero.
          </p>
          <p className="mt-1 text-sm text-amber-800">
            No hay nada para transferir. Si faltó cargar un gasto, volvé a editar familias.
          </p>
        </section>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" fullWidth onClick={onEditFamilies}>
          Editar familias
        </Button>
        <Button variant="ghost" fullWidth onClick={onReset}>
          Nuevo evento
        </Button>
      </div>

      <Button
        variant={isSavedToHistory ? "secondary" : "primary"}
        fullWidth
        onClick={onSaveClosedEvent}
        disabled={isSavedToHistory}
      >
        {isSavedToHistory ? "Guardado en historial" : "Guardar evento cerrado"}
      </Button>
      {historySaveError && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {historySaveError}
        </p>
      )}

      <EventPhotoUploader
        photo={ticketPhoto}
        onPhotoChange={onTicketPhotoChange}
      />

      <ExportPdfButton
        data={{
          appName: "¿Quién puso qué?",
          eventName,
          currency,
          generatedAt: new Date(),
          splitMode,
          families,
          balances,
          transfers,
          recommendation,
          photo: ticketPhoto,
        }}
      />

      <section className="flex flex-col gap-2">
        <h3 className="text-lg font-bold text-stone-900">Balances</h3>
        {balances.map((balance) => (
          <BalanceCard
            key={balance.familyId}
            balance={balance}
            currency={currency}
          />
        ))}
      </section>

      <TransfersList transfers={transfers} currency={currency} />

      <CopyResultButton
        getText={() =>
          generateWhatsappText({
            eventName,
            currency,
            splitMode,
            balances,
            transfers,
          })
        }
      />
    </div>
  );
}
