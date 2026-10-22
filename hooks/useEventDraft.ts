"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  clearCurrentEventDraft,
  getDraftFingerprint,
  hasDraftContent,
  saveCurrentEventDraft,
  type SaveEventDraftInput,
} from "@/lib/storage/localEventStorage";

/** Agrupa ráfagas de cambios (tipear un nombre) en una sola escritura. */
const SAVE_DELAY_MS = 400;

interface UseEventDraftOptions extends SaveEventDraftInput {
  /** Huella de lo que ya está guardado al montar (null = guardar de entrada). */
  storedFingerprint: string | null;
}

/**
 * Persiste el borrador en localStorage sin bloquear la escritura del usuario.
 *
 * - Debounce: antes se escribía el borrador completo en cada tecla.
 * - Dedupe: si el contenido no cambió, no se escribe.
 * - Flush al ocultar o cerrar la pestaña, para no perder el último cambio.
 */
export function useEventDraft({
  eventData,
  selectedMode,
  recommendationAccepted,
  createdAt,
  storedFingerprint,
}: UseEventDraftOptions) {
  const lastFingerprintRef = useRef(storedFingerprint);
  const pendingRef = useRef<SaveEventDraftInput | null>(null);
  const timerRef = useRef<number | undefined>(undefined);

  const flush = useCallback(() => {
    window.clearTimeout(timerRef.current);
    const pending = pendingRef.current;
    if (!pending) return;
    pendingRef.current = null;

    if (hasDraftContent(pending.eventData)) {
      saveCurrentEventDraft(pending);
    } else {
      clearCurrentEventDraft();
    }
  }, []);

  useEffect(() => {
    const input = { eventData, selectedMode, recommendationAccepted, createdAt };
    const fingerprint = getDraftFingerprint(input);
    if (fingerprint === lastFingerprintRef.current) return;

    lastFingerprintRef.current = fingerprint;
    pendingRef.current = input;
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(flush, SAVE_DELAY_MS);
  }, [createdAt, eventData, flush, recommendationAccepted, selectedMode]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };

    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", handleVisibility);
      flush();
    };
  }, [flush]);

  const clearDraft = useCallback(() => {
    window.clearTimeout(timerRef.current);
    pendingRef.current = null;
    clearCurrentEventDraft();
  }, []);

  return { clearDraft };
}
