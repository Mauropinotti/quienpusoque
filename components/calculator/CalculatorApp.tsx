"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { nanoid } from "nanoid";

import type { Family, SplitMode } from "@/types/family";
import type { EventTicketPhoto } from "@/types/pdf";
import { bootstrapFlow } from "@/lib/flow/bootstrapFlow";
import { buildClosedEvent } from "@/lib/flow/closedEvent";
import { eventFlowReducer, type FlowStep } from "@/lib/flow/eventFlow";
import { deriveEventInsights, deriveSettlement } from "@/lib/flow/eventInsights";
import { saveClosedEvent } from "@/lib/storage/closedEventsStorage";
import { useEventDraft } from "@/hooks/useEventDraft";

import { EventSetupCard } from "@/components/event/EventSetupCard";
import { FamilyForm } from "@/components/families/FamilyForm";
import { FamilyList } from "@/components/families/FamilyList";
import { StepHeader } from "./StepHeader";
import { StepIndicator } from "./StepIndicator";
import { StepSkeleton } from "./CalculatorSkeleton";

// Pasos pesados en chunks aparte: el primer paint solo necesita setup/familias.
const loadRecommendationStep = () =>
  import("@/components/recommendation/RecommendationStep");
const loadResultsStep = () => import("@/components/results/ResultsStep");
const loadHistory = () => import("@/components/history/EventHistoryList");

const RecommendationStep = dynamic(
  () => loadRecommendationStep().then((m) => m.RecommendationStep),
  { loading: () => <StepSkeleton /> }
);
const ResultsStep = dynamic(() => loadResultsStep().then((m) => m.ResultsStep), {
  loading: () => <StepSkeleton />,
});
const EventHistoryList = dynamic(
  () => loadHistory().then((m) => m.EventHistoryList),
  { loading: () => null }
);

// Elemento constante: React lo reconoce idéntico entre renders y ni siquiera
// re-renderiza el wrapper de next/dynamic al tipear en el paso 1.
const historyList = <EventHistoryList />;

const HISTORY_SAVE_ERROR =
  "No se pudo guardar en el historial. Revisá si el navegador permite usar almacenamiento local.";

/** Precarga los chunks de los pasos siguientes cuando el navegador está ocioso. */
function usePreloadNextSteps() {
  useEffect(() => {
    const preload = () => {
      void loadRecommendationStep();
      void loadResultsStep();
    };

    // Safari todavía no tiene requestIdleCallback.
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(preload, { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    }

    const id = window.setTimeout(preload, 1500);
    return () => window.clearTimeout(id);
  }, []);
}

export function CalculatorApp() {
  // Corre solo en el cliente (ssr: false): puede leer storage y la URL.
  const [boot] = useState(() =>
    bootstrapFlow(window.location.search, new Date().toISOString())
  );
  const [state, dispatch] = useReducer(eventFlowReducer, boot.state);
  const {
    step,
    eventData,
    createdAt,
    selectedMode,
    recommendationAccepted,
    savedClosedEventId,
    historySaveError,
    ticketPhoto,
  } = state;
  const { families, currency, splitMode, eventName } = eventData;

  const { clearDraft } = useEventDraft({
    eventData,
    selectedMode,
    recommendationAccepted,
    createdAt,
    storedFingerprint: boot.storedFingerprint,
  });

  usePreloadNextSteps();

  useEffect(() => {
    // El fallback ya cumplió: que una navegación posterior no herede la marca.
    document.documentElement.removeAttribute("data-calc-resume");
    // El link "Ver un ejemplo" usa ?demo=1: lo sacamos para que recargar no
    // pise lo que el usuario edite después.
    if (boot.source === "demo") {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [boot.source]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  // Derivados con dependencias exactas: tipear el nombre del evento ya no
  // recalcula elegibilidad, recomendación ni balances.
  const insights = useMemo(() => deriveEventInsights(families), [families]);
  const settlement = useMemo(
    () => deriveSettlement(families, currency, splitMode),
    [currency, families, splitMode]
  );
  const { recommendation } = insights;

  // dispatch es estable: estos callbacks no cambian entre renders y los
  // componentes memoizados no se re-renderizan de más.
  const goTo = useCallback(
    (nextStep: FlowStep) => dispatch({ type: "step-changed", step: nextStep }),
    []
  );
  const goToSetup = useCallback(() => goTo("setup"), [goTo]);
  const goToFamilies = useCallback(() => goTo("families"), [goTo]);
  const handleRename = useCallback(
    (name: string) => dispatch({ type: "event-renamed", name }),
    []
  );
  const handleLoadDemo = useCallback(
    () => dispatch({ type: "demo-loaded", now: new Date().toISOString() }),
    []
  );
  const handleAddFamily = useCallback(
    (data: Omit<Family, "id">) =>
      dispatch({ type: "family-added", family: { ...data, id: nanoid(8) } }),
    []
  );
  const handleUpdateFamily = useCallback(
    (family: Family) => dispatch({ type: "family-updated", family }),
    []
  );
  const handleRemoveFamily = useCallback(
    (id: string) => dispatch({ type: "family-removed", id }),
    []
  );
  const handleModeChange = useCallback(
    (mode: SplitMode) => dispatch({ type: "mode-selected", mode }),
    []
  );
  const handlePhotoChange = useCallback(
    (photo: EventTicketPhoto | null) =>
      dispatch({ type: "ticket-photo-changed", photo }),
    []
  );

  const recommendedMode = recommendation?.recommendedMode ?? null;

  const handleOpenRecommendation = useCallback(() => {
    if (recommendedMode) {
      dispatch({ type: "recommendation-opened", recommendedMode });
    }
  }, [recommendedMode]);

  const handleConfirmMode = useCallback(
    () => dispatch({ type: "mode-confirmed", recommendedMode }),
    [recommendedMode]
  );

  const handleSaveClosedEvent = useCallback(() => {
    if (!settlement) return;

    const closedEvent = buildClosedEvent({
      id: nanoid(10),
      closedAt: new Date().toISOString(),
      state: { eventData, createdAt },
      settlement,
      recommendation,
    });

    const result = saveClosedEvent(closedEvent);
    dispatch(
      result.saved
        ? { type: "closed-event-saved", id: closedEvent.id }
        : { type: "closed-event-save-failed", message: HISTORY_SAVE_ERROR }
    );
  }, [createdAt, eventData, recommendation, settlement]);

  const handleReset = useCallback(() => {
    clearDraft();
    dispatch({ type: "reset", now: new Date().toISOString() });
  }, [clearDraft]);

  const hasCurrentDraft = eventName.trim().length > 0 || families.length > 0;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-16 pt-6">
      <StepIndicator current={step} />

      <div className="mt-6 flex flex-col gap-5">
        {step === "setup" && (
          <>
            <EventSetupCard
              eventName={eventName}
              hasDraft={hasCurrentDraft}
              onEventNameChange={handleRename}
              onNext={goToFamilies}
              onLoadDemo={handleLoadDemo}
              onReset={handleReset}
            />
            {historyList}
          </>
        )}

        {step === "families" && (
          <>
            <StepHeader
              kicker="Paso 2 · ¿Quién vino?"
              title={eventName || "Tu evento"}
              onBack={goToSetup}
            />
            <FamilyForm onSubmit={handleAddFamily} />
            <FamilyList
              families={families}
              insights={insights}
              currency={currency}
              onRemove={handleRemoveFamily}
              onUpdate={handleUpdateFamily}
              onCalculate={handleOpenRecommendation}
            />
          </>
        )}

        {step === "recommendation" && recommendation && (
          <RecommendationStep
            eventName={eventName}
            families={families}
            currency={currency}
            recommendation={recommendation}
            selectedMode={selectedMode}
            onModeChange={handleModeChange}
            onConfirm={handleConfirmMode}
            onBack={goToFamilies}
          />
        )}

        {step === "results" && settlement && (
          <ResultsStep
            eventName={eventName}
            currency={currency}
            families={families}
            settlement={settlement}
            recommendation={recommendation}
            ticketPhoto={ticketPhoto}
            isSavedToHistory={savedClosedEventId !== null}
            historySaveError={historySaveError}
            onTicketPhotoChange={handlePhotoChange}
            onSaveClosedEvent={handleSaveClosedEvent}
            onEditFamilies={goToFamilies}
            onReset={handleReset}
          />
        )}

        {/* Un borrador viejo puede apuntar a un paso que ya no se puede mostrar. */}
        {((step === "recommendation" && !recommendation) ||
          (step === "results" && !settlement)) && (
          <StepHeader
            kicker="Ups"
            title="Faltan datos para este paso"
            onBack={goToFamilies}
          />
        )}
      </div>
    </div>
  );
}
