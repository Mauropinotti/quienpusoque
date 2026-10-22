"use client";

import { useSyncExternalStore } from "react";
import { hasStoredDraft } from "@/lib/storage/localEventStorage";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ArrowRightIcon } from "@/components/ui/icons";

// Isla cliente mínima: el resto de la ayuda es HTML estático.
const subscribe = () => () => undefined;
const getServerSnapshot = () => false;

export function HelpCta() {
  const hasDraft = useSyncExternalStore(subscribe, hasStoredDraft, getServerSnapshot);

  return (
    <ButtonLink href="/calcular" size="xl" fullWidth>
      {hasDraft ? "Seguir con mi cuenta" : "Empezar el cálculo"}
      <ArrowRightIcon />
    </ButtonLink>
  );
}
