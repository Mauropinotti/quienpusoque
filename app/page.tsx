"use client";

import { useState, useCallback } from "react";
import { nanoid } from "nanoid";

import type { Family, SplitMode } from "@/types/family";
import type { EventData } from "@/types/event";
import type { FamilyBalance, Transfer } from "@/types/calculation";
import type { SplitRecommendation } from "@/types/recommendation";

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
  { id: "1", name: "Los García", members: 4, singleMemberType: null, paidAmount: 8000 },
  { id: "2", name: "Los Rodríguez", members: 2, singleMemberType: null, paidAmount: 3000 },
  { id: "3", name: "Los López", members: 1, singleMemberType: "adult", paidAmount: 0 },
  { id: "4", name: "Los Martínez", members: 1, singleMemberType: "minor", paidAmount: 0 },
  { id: "5", name: "Los Fernández", members: 3, singleMemberType: null, paidAmount: 5000 },
];

export default function HomePage() {
  const [step, setStep] = useState<Step>("setup");
  const [eventData, setEventData] = useState<EventData>({
    eventName: "",
    currency: "ARS",
    splitMode: null,
    families: [],
  });
  const [recommendation, setRecommendation] = useState<SplitRecommendation | null>(null);
  const [selectedMode, setSelectedMode] = useState<SplitMode>("by-family");
  const [balances, setBalances] = useState<FamilyBalance[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);

  const loadDemo = useCallback(() => {
    setEventData((prev) => ({
      ...prev,
      eventName: "Asado del sábado",
      families: DEMO_FAMILIES,
    }));
    setStep("families");
  }, []);

  const handleAddFamily = useCallback((data: Omit<Family, "id">) => {
    const family: Family = { ...data, id: nanoid(8) };
    setEventData((prev) => ({
      ...prev,
      families: [...prev.families, family],
    }));
  }, []);

  const handleRemoveFamily = useCallback((id: string) => {
    setEventData((prev) => ({
      ...prev,
      families: prev.families.filter((f) => f.id !== id),
    }));
  }, []);

  const handleCalculate = useCallback(() => {
    const withEligibility = computeAllEligibility(eventData.families);
    const rec = recommendSplitMode(withEligibility);
    setRecommendation(rec);
    setSelectedMode(rec.recommendedMode);
    setStep("recommendation");
  }, [eventData.families]);

  const handleConfirmMode = useCallback(() => {
    const withEligibility = computeAllEligibility(eventData.families);
    const b = calculateBalances(withEligibility, selectedMode);
    const t = calculateTransfers(b);
    setBalances(b);
    setTransfers(t);
    setEventData((prev) => ({ ...prev, splitMode: selectedMode }));
    setStep("results");
  }, [eventData.families, selectedMode]);

  const handleReset = useCallback(() => {
    setStep("setup");
    setEventData({ eventName: "", currency: "ARS", splitMode: null, families: [] });
    setRecommendation(null);
    setBalances([]);
    setTransfers([]);
  }, []);

  const stepIndex = STEPS.indexOf(step);

  return (
    <main className="min-h-screen flex flex-col">
      <EventHeader eventName={eventData.eventName} />

      {/* Step progress dots */}
      <div className="flex justify-center gap-2 pb-4 px-4">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`h-2 rounded-full transition-all duration-300 ${
              s === step
                ? "w-8 bg-orange-500"
                : i < stepIndex
                ? "w-2 bg-orange-300"
                : "w-2 bg-stone-200"
            }`}
          />
        ))}
      </div>

      <div className="flex-1 px-4 pb-8 max-w-lg mx-auto w-full flex flex-col gap-4">
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
              className="text-sm text-stone-400 hover:text-orange-500 text-center transition-colors"
            >
              Probar con datos de ejemplo →
            </button>
          </>
        )}

        {step === "families" && (
          <>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStep("setup")}
                className="text-stone-400 hover:text-stone-600 text-xl"
              >
                ←
              </button>
              <h2 className="text-lg font-bold text-stone-800">
                {eventData.eventName}
              </h2>
            </div>
            <FamilyForm onAdd={handleAddFamily} />
            <FamilyList
              families={eventData.families}
              currency={eventData.currency}
              onRemove={handleRemoveFamily}
              onCalculate={handleCalculate}
            />
          </>
        )}

        {step === "recommendation" && recommendation && (
          <>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStep("families")}
                className="text-stone-400 hover:text-stone-600 text-xl"
              >
                ←
              </button>
              <h2 className="text-lg font-bold text-stone-800">
                {eventData.eventName}
              </h2>
            </div>
            <RecommendationCard
              recommendation={recommendation}
              selectedMode={selectedMode}
              onModeChange={setSelectedMode}
              onConfirm={handleConfirmMode}
            />
            <ModeImpactPreview metrics={recommendation.metrics} />
          </>
        )}

        {step === "results" && eventData.splitMode && (
          <ResultsSummary
            eventName={eventData.eventName}
            currency={eventData.currency}
            splitMode={eventData.splitMode}
            balances={balances}
            transfers={transfers}
            onReset={handleReset}
          />
        )}
      </div>
    </main>
  );
}
