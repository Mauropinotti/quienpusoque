import {
  CURRENT_DRAFT_STORAGE_KEY,
  getDraftFingerprint,
  hasStoredDraft,
  readCurrentEventDraft,
} from "@/lib/storage/localEventStorage";
import {
  createDemoFlowState,
  createEmptyFlowState,
  createFlowStateFromDraft,
  type EventFlowState,
} from "./eventFlow";

export interface FlowBootstrap {
  state: EventFlowState;
  /** Huella de lo que ya está en storage; null fuerza a guardar el estado inicial. */
  storedFingerprint: string | null;
  source: "demo" | "draft" | "empty";
}

/** `?demo` en la URL arranca con el evento de ejemplo (botón de la landing). */
export function wantsDemo(search: string): boolean {
  return new URLSearchParams(search).has("demo");
}

/** ¿El calculador va a arrancar en un paso distinto del 1? */
export function shouldResumeCalculator(search: string): boolean {
  return wantsDemo(search) || hasStoredDraft();
}

/**
 * Script inline que corre antes del primer paint de /calcular y marca
 * <html data-calc-resume> si va a retomar un borrador o abrir el ejemplo.
 * Misma regla que shouldResumeCalculator, sin depender del bundle.
 */
export const CALCULATOR_RESUME_SCRIPT = `try{if(/[?&]demo(=|&|$)/.test(location.search)||localStorage.getItem(${JSON.stringify(
  CURRENT_DRAFT_STORAGE_KEY
)})!==null)document.documentElement.setAttribute("data-calc-resume","")}catch(e){}`;

/**
 * Estado inicial del calculador. Corre solo en el cliente (el calculador se
 * monta con ssr: false), así que puede leer storage sin romper la hidratación
 * y sin el "flash" del paso 1 antes de restaurar el borrador.
 */
export function bootstrapFlow(search: string, now: string): FlowBootstrap {
  if (wantsDemo(search)) {
    return { state: createDemoFlowState(now), storedFingerprint: null, source: "demo" };
  }

  const draft = readCurrentEventDraft();
  if (draft) {
    const state = createFlowStateFromDraft(draft);
    return {
      state,
      storedFingerprint: getDraftFingerprint({
        eventData: state.eventData,
        selectedMode: state.selectedMode,
        recommendationAccepted: state.recommendationAccepted,
        createdAt: state.createdAt,
      }),
      source: "draft",
    };
  }

  const state = createEmptyFlowState(now);
  return {
    state,
    storedFingerprint: getDraftFingerprint({
      eventData: state.eventData,
      selectedMode: state.selectedMode,
      recommendationAccepted: state.recommendationAccepted,
      createdAt: state.createdAt,
    }),
    source: "empty",
  };
}
