"use client";

import { useCallback, useMemo, useState } from "react";
import { nanoid } from "nanoid";

import type { Family, SplitMode } from "@/types/family";
import type { EventData } from "@/types/event";

import { computeAllEligibility } from "@/lib/calculations/eligibility";
import { calculateBalances } from "@/lib/calculations/calculateBalances";
import { calculateTransfers } from "@/lib/calculations/calculateTransfers";
import { recommendSplitMode } from "@/lib/calculations/recommendSplitMode";

import { EventHeader } from "@/components/event/EventHeader";
import { EventSetupCard } from "@/components/event/EventSetupCard";
import { FamilyForm } from "@/components/families/FamilyForm";
import { FamilyList } from "@/components/families/FamilyList";
import { RecommendationCard } from "@/components/recommendation/RecommendationCard";
import { ModeImpactPreview } from "@/components/recommendation/ModeImpactPreview";
import { ResultsSummary } from "@/components/results/ResultsSummary";

type Step = "setup" | "families" | "recommendation" | "results";

const STEPS: Step[] = ["setup", "families", "recommendation", "results"];

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

export default function HomePage() {
  const [step, setStep] = useState<Step>("setup");
  const [eventData, setEventData] = useState<EventData>({
    eventName: "",
    currency: "ARS",
    splitMode: null,
    families: [],
  });
  const [selectedMode, setSelectedMode] = useState<SplitMode>("by-family");

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

  const loadDemo = useCallback(() => {
    setEventData((prev) => ({
      ...prev,
      eventName: "Asado del sábado",
      splitMode: null,
      families: DEMO_FAMILIES,
    }));
    setSelectedMode("by-family");
    setStep("families");
  }, []);

  const handleAddFamily = useCallback((data: Omit<Family, "id">) => {
    const family: Family = { ...data, id: nanoid(8) };
    setEventData((prev) => ({
      ...prev,
      families: [...prev.families, family],
    }));
  }, []);

  const handleUpdateFamily = useCallback((updatedFamily: Family) => {
    setEventData((prev) => ({
      ...prev,
      families: prev.families.map((family) =>
        family.id === updatedFamily.id ? updatedFamily : family
      ),
    }));
  }, []);

  const handleRemoveFamily = useCallback((id: string) => {
    setEventData((prev) => ({
      ...prev,
      families: prev.families.filter((family) => family.id !== id),
    }));
  }, []);

  const handleShowRecommendation = useCallback(() => {
    if (!recommendation) return;
    setSelectedMode(recommendation.recommendedMode);
    setStep("recommendation");
  }, [recommendation]);

  const handleConfirmMode = useCallback(() => {
    setEventData((prev) => ({ ...prev, splitMode: selectedMode }));
    setStep("results");
  }, [selectedMode]);

  const handleReset = useCallback(() => {
    setStep("setup");
    setEventData({ eventName: "", currency: "ARS", splitMode: null, families: [] });
    setSelectedMode("by-family");
  }, []);

  const stepIndex = STEPS.indexOf(step);

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
              onModeChange={setSelectedMode}
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
            onEditFamilies={() => setStep("families")}
            onReset={handleReset}
          />
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
