"use client";

import { memo, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { CheckIcon, CopyIcon } from "@/components/ui/icons";

interface CopyResultButtonProps {
  getText: () => string;
}

export const CopyResultButton = memo(function CopyResultButton({
  getText,
}: CopyResultButtonProps) {
  const [copied, setCopied] = useState(false);
  const [fallbackText, setFallbackText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 2500);
    return () => window.clearTimeout(id);
  }, [copied]);

  useEffect(() => {
    if (!fallbackText) return;
    textareaRef.current?.focus();
    textareaRef.current?.select();
  }, [fallbackText]);

  const handleCopy = async () => {
    const text = getText();
    setFallbackText("");

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        return;
      } catch {
        // Algunos navegadores bloquean el portapapeles fuera de contextos seguros.
      }
    }

    setCopied(false);
    setFallbackText(text);
  };

  return (
    <div className="flex flex-col gap-3">
      <Button fullWidth size="lg" onClick={handleCopy} variant={copied ? "ink" : "primary"}>
        {copied ? <CheckIcon /> : <CopyIcon />}
        <span aria-live="polite">
          {copied ? "¡Copiado! Pegalo en el grupo" : "Copiar resumen para WhatsApp"}
        </span>
      </Button>

      {fallbackText && (
        <div className="rounded-xl border-2 border-ink bg-mustard-soft p-3">
          <p className="font-bold text-mustard-text">No se pudo copiar automáticamente.</p>
          <p className="text-sm text-mustard-text">Seleccioná el texto y copialo a mano.</p>
          <textarea
            ref={textareaRef}
            readOnly
            aria-label="Resumen para WhatsApp"
            value={fallbackText}
            className="mt-3 h-44 w-full rounded-xl border-2 border-ink bg-white p-3 font-mono text-sm"
          />
        </div>
      )}
    </div>
  );
});
