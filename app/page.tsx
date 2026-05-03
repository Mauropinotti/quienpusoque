"use client";

import { useCallback, useMemo, useState } from "react";
import { nanoid } from "nanoid";

import type { Family, SplitMode } from "@/types/family";
import type { ClosedEvent, EventData } from "@/types/event";
import type { LocalEventDraft } from "@/lib/storage/localEventStorage";

import { computeAllEligibility } from "@/lib/calculations/eligibility";
import { calculateBalances } from "@/lib/calculations/calculateBalances";
import { calculateTransfers } from "@/lib/calculations/calculateTransfers";
import { recommendSplitMode } from "@/lib/calculations/recommendSplitMode";
import { saveClosedEvent } from "@/lib/storage/closedEventsStorage";

import { useEventDraft } from "@/hooks/useEventDraft";
import { EventHeader } from "@/components/event/EventHeader";
import { EventSetupCard } from "@/components/event/EventSetupCard";
import { FamilyForm } from "@/components/families/FamilyForm";
import { FamilyList } from "@/components/families/FamilyList";
import { RecommendationCard } from "@/components/recommendation/RecommendationCard";
import { ModeImpactPreview } from "@/components/recommendation/ModeImpactPreview";
import { ResultsSummary } from "@/components/results/ResultsSummary";
import { EventHistoryList } from "@/components/history/EventHistoryList";

type Step = "setup" | "families" | "recommendation" | "results";

const STEPS: Step[] = ["setup", "families", "recommendation", "results"];

const EMPTY_EVENT_DATA: EventData = {
  eventName: "",
  currency: "ARS",
  splitMode: null,
  families: [],
};

const DEMO_FAMILIES: Family[] = [
  {
    id: "1",
    name: "Los García",
    members: 4,
    singleMemberType: null,
    paidAmount: 8000,
    notes: "Carne y carbón",
  },
  {
    id: "2",
    name: "Los Rodríguez",
    members: 2,
    singleMemberType: null,
    paidAmount: 3000,
    notes: "Bebidas",
  },
  {
    id: "3",
    name: "Los López",
    members: 1,
    singleMemberType: "adult",
    paidAmount: 0,
  },
  {
    id: "4",
    name: "Los Martínez",
    members: 1,
    singleMemberType: "minor",
    paidAmount: 0,
  },
  {
    id: "5",
    name: "Los Fernández",
    members: 3,
    singleMemberType: null,
    paidAmount: 5000,
    notes: "Ensaladas",
  },
];

function getStepFromDraft(draft: LocalEventDraft): Step {
  if (draft.splitMode && draft.families.length >= 2) return "results";
  if (draft.families.length > 0) return "families";
  return "setup";
}

export default function HomePage() {
  const [step, setStep] = useState<Step>("setup");
  const [eventData, setEventData] = useState<EventData>(EMPTY_EVENT_DATA);
  const [eventCreatedAt, setEventCreatedAt] = useState(() =>
    new Date().toISOString()
  );
  const [selectedMode, setSelectedMode] = useState<SplitMode>("by-family");
  const [recommendationAccepted, setRecommendationAccepted] = useState<
    boolean | null
  >(null);
  const [savedClosedEventId, setSavedClosedEventId] = useState<string | null>(
    null
  );
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  const restoreDraft = useCallback((draft: LocalEventDraft) => {
    setEventData({
      eventName: draft.eventName,
      currency: draft.currency,
      splitMode: draft.splitMode,
      families: draft.families,
    });
    setEventCreatedAt(draft.createdAt);
    setSelectedMode(draft.selectedMode);
    setRecommendationAccepted(draft.recommendationAccepted);
    setSavedClosedEventId(null);
    setStep(getStepFromDraft(draft));
  }, []);

  const { clearDraft } = useEventDraft({
    eventData,
    selectedMode,
    recommendationAccepted,
    createdAt: eventCreatedAt,
    onDraftLoaded: restoreDraft,
  });

  const recommendation = useMemo(() => {
    if (eventData.families.length < 2) return null;
    return recommendSplitMode(computeAllEligibility(eventData.families));
  }, [eventData.families]);

  const calculation = useMemo(() => {
    if (eventData.families.length < 2) return null;

    const balancesResult = calculateBalances({
      ...eventData,
      splitMode: selectedMode,
    });

    if (!balancesResult.ok) return null;

    const { transfers } = calculateTransfers(balancesResult.data.balances);

    return {
      balances: balancesResult.data.balances,
      transfers,
    };
  }, [eventData, selectedMode]);

  const markDraftChanged = useCallback(() => {
    setRecommendationAccepted(null);
    setSavedClosedEventId(null);
  }, []);

  const loadDemo = useCallback(() => {
    setEventCreatedAt(new Date().toISOString());
    setEventData((prev) => ({
      ...prev,
      eventName: "Asado del sábado",
      splitMode: null,
      families: DEMO_FAMILIES,
    }));
    setSelectedMode("by-family");
    setRecommendationAccepted(null);
    setSavedClosedEventId(null);
    setStep("families");
  }, []);

  const handleAddFamily = useCallback(
    (data: Omit<Family, "id">) => {
      const family: Family = { ...data, id: nanoid(8) };
      setEventData((prev) => ({
        ...prev,
        families: [...prev.families, family],
      }));
      markDraftChanged();
    },
    [markDraftChanged]
  );

  const handleUpdateFamily = useCallback(
    (updatedFamily: Family) => {
      setEventData((prev) => ({
        ...prev,
        families: prev.families.map((family) =>
          family.id === updatedFamily.id ? updatedFamily : family
        ),
      }));
      markDraftChanged();
    },
    [markDraftChanged]
  );

  const handleRemoveFamily = useCallback(
    (id: string) => {
      setEventData((prev) => ({
        ...prev,
        families: prev.families.filter((family) => family.id !== id),
      }));
      markDraftChanged();
    },
    [markDraftChanged]
  );

  const handleShowRecommendation = useCallback(() => {
    if (!recommendation) return;
    setSelectedMode(recommendation.recommendedMode);
    setRecommendationAccepted(null);
    setStep("recommendation");
  }, [recommendation]);

  const handleModeChange = useCallback((mode: SplitMode) => {
    setSelectedMode(mode);
    setRecommendationAccepted(null);
  }, []);

  const handleConfirmMode = useCallback(() => {
    setEventData((prev) => ({ ...prev, splitMode: selectedMode }));
    setRecommendationAccepted(
      recommendation ? selectedMode === recommendation.recommendedMode : null
    );
    setSavedClosedEventId(null);
    setStep("results");
  }, [recommendation, selectedMode]);

  const handleSaveClosedEvent = useCallback(() => {
    if (!calculation || !eventData.splitMode) return;

    const closedEvent: ClosedEvent = {
      id: nanoid(10),
      eventName: eventData.eventName.trim() || "Evento sin nombre",
      createdAt: eventCreatedAt,
      closedAt: new Date().toISOString(),
      totalAmount: calculation.balances.reduce(
        (sum, balance) => sum + balance.paidAmount,
        0
      ),
      splitModeUsed: eventData.splitMode,
      familiesSnapshot: eventData.families,
      balancesSnapshot: calculation.balances,
      transfersSnapshot: calculation.transfers,
      recommendationSnapshot: recommendation,
    };

    saveClosedEvent(closedEvent);
    setSavedClosedEventId(closedEvent.id);
    setHistoryRefreshKey((current) => current + 1);
  }, [calculation, eventCreatedAt, eventData, recommendation]);

  const handleReset = useCallback(() => {
    clearDraft();
    setStep("setup");
    setEventData(EMPTY_EVENT_DATA);
    setEventCreatedAt(new Date().toISOString());
    setSelectedMode("by-family");
    setRecommendationAccepted(null);
    setSavedClosedEventId(null);
  }, [clearDraft]);

  const stepIndex = STEPS.indexOf(step);
  const hasCurrentDraft =
    eventData.eventName.trim().length > 0 || eventData.families.length > 0;

  return (
    <main className="min-h-screen">
      <EventHeader eventName={eventData.eventName} />

      <div className="mx-auto flex max-w-lg justify-center gap-2 px-4 pb-4">
        {STEPS.map((currentStep, index) => (
          <div
            key={currentStep}
            className={[
              "h-2 rounded-full transition-all duration-300",
              currentStep === step
                ? "w-8 bg-orange-600"
                : index < stepIndex
                  ? "w-3 bg-orange-300"
                  : "w-3 bg-stone-200",
            ].join(" ")}
          />
        ))}
      </div>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 pb-8">
        {step === "setup" && (
          <>
            <EventSetupCard
              eventName={eventData.eventName}
              onEventNameChange={(name) =>
                setEventData((prev) => ({ ...prev, eventName: name }))
              }
              onNext={() => setStep("families")}
            />
            <button
              onClick={loadDemo}
              className="min-h-11 rounded-lg text-center text-sm font-medium text-stone-500 transition-colors hover:text-orange-700"
            >
              Probar con datos de ejemplo
            </button>
            <EventHistoryList refreshKey={historyRefreshKey} />
          </>
        )}

        {step === "families" && (
          <>
            <StepTitle
              title={eventData.eventName}
              onBack={() => setStep("setup")}
            />
            <FamilyForm onSubmit={handleAddFamily} />
            <FamilyList
              families={eventData.families}
              currency={eventData.currency}
              onRemove={handleRemoveFamily}
              onUpdate={handleUpdateFamily}
              onCalculate={handleShowRecommendation}
            />
          </>
        )}

        {step === "recommendation" && recommendation && (
          <>
            <StepTitle
              title={eventData.eventName}
              onBack={() => setStep("families")}
            />
            <RecommendationCard
              recommendation={recommendation}
              selectedMode={selectedMode}
              onModeChange={handleModeChange}
              onConfirm={handleConfirmMode}
            />
            <ModeImpactPreview metrics={recommendation.metrics} />
          </>
        )}

        {step === "results" && eventData.splitMode && calculation && (
          <ResultsSummary
            eventName={eventData.eventName}
            currency={eventData.currency}
            splitMode={eventData.splitMode}
            balances={calculation.balances}
            transfers={calculation.transfers}
            isSavedToHistory={savedClosedEventId !== null}
            onSaveClosedEvent={handleSaveClosedEvent}
            onEditFamilies={() => setStep("families")}
            onReset={handleReset}
          />
        )}

        {step !== "results" && hasCurrentDraft && (
          <div className="rounded-lg border border-stone-200 bg-white p-3 text-center">
            <p className="mb-2 text-xs text-stone-500">
              Borrador guardado en este navegador.
            </p>
            <button
              onClick={handleReset}
              className="min-h-11 text-sm font-semibold text-stone-500 transition hover:text-red-700"
            >
              Empezar de nuevo
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

function StepTitle({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onBack}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-2xl text-stone-500 transition hover:bg-white hover:text-stone-800"
        aria-label="Volver"
      >
        ‹
      </button>
      <h2 className="min-w-0 truncate text-lg font-bold text-stone-900">
        {title}
      </h2>
    </div>
  );
}
