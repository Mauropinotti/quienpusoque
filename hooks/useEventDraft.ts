"use client";

import { useCallback, useEffect, useRef } from "react";
import type { EventData } from "@/types/event";
import type { SplitMode } from "@/types/family";
import {
  clearCurrentEventDraft,
  type LocalEventDraft,
  readCurrentEventDraft,
  saveCurrentEventDraft,
} from "@/lib/storage/localEventStorage";

interface UseEventDraftOptions {
  eventData: EventData;
  selectedMode: SplitMode;
  recommendationAccepted: boolean | null;
  onDraftLoaded: (draft: LocalEventDraft) => void;
}

function hasDraftContent(eventData: EventData): boolean {
  return (
    eventData.eventName.trim().length > 0 ||
    eventData.families.length > 0 ||
    eventData.splitMode !== null
  );
}

export function useEventDraft({
  eventData,
  selectedMode,
  recommendationAccepted,
  onDraftLoaded,
}: UseEventDraftOptions) {
  const loadedRef = useRef(false);
  const skipNextSaveRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;

    const draft = readCurrentEventDraft();
    if (draft) {
      skipNextSaveRef.current = true;
      onDraftLoaded(draft);
    }

    loadedRef.current = true;
  }, [onDraftLoaded]);

  useEffect(() => {
    if (!loadedRef.current) return;

    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }

    if (!hasDraftContent(eventData)) {
      clearCurrentEventDraft();
      return;
    }

    saveCurrentEventDraft({
      eventData,
      selectedMode,
      recommendationAccepted,
    });
  }, [eventData, recommendationAccepted, selectedMode]);

  const clearDraft = useCallback(() => {
    clearCurrentEventDraft();
  }, []);

  return {
    clearDraft,
  };
}
