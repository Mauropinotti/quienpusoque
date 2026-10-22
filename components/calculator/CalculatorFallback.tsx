"use client";

import { useSyncExternalStore } from "react";
import { shouldResumeCalculator } from "@/lib/flow/bootstrapFlow";
import { EventSetupCard } from "@/components/event/EventSetupCard";
import { CalculatorSkeleton } from "./CalculatorSkeleton";
import { StepIndicator } from "./StepIndicator";

const noop = () => undefined;
const subscribe = () => noop;
const readResume = () => shouldResumeCalculator(window.location.search);
const readServerResume = () => null;

/**
 * Lo que se ve mientras baja el calculador (se prerenderiza en el HTML):
 *
 * - Visitante nuevo: una réplica inerte del paso 1, idéntica a la real. El
 *   LCP ocurre en el primer paint y al montar la app no se mueve nada.
 * - Hay borrador o ?demo: un skeleton neutro, para no mostrar el paso 1 y
 *   después saltar a otro paso.
 *
 * En la carga inicial no sabemos en el servidor cuál corresponde: se
 * renderizan ambos y un script inline marca <html data-calc-resume> antes del
 * primer paint (ver app/calcular/page.tsx). En navegación del lado cliente
 * se decide directamente con useSyncExternalStore.
 */
export function CalculatorFallback() {
  const resume = useSyncExternalStore(subscribe, readResume, readServerResume);

  return (
    <div className="min-h-[calc(100dvh-4rem)]" aria-busy="true">
      {resume !== true && (
        <div data-fallback="setup" inert className="mx-auto w-full max-w-2xl px-4 pb-16 pt-6">
          <StepIndicator current="setup" />
          <div className="mt-6 flex flex-col gap-5">
            <EventSetupCard
              eventName=""
              hasDraft={false}
              onEventNameChange={noop}
              onNext={noop}
              onLoadDemo={noop}
              onReset={noop}
            />
          </div>
        </div>
      )}
      {resume !== false && (
        <div data-fallback="resume">
          <CalculatorSkeleton />
        </div>
      )}
    </div>
  );
}
