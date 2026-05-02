"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

interface CopyResultButtonProps {
  getText: () => string;
}

export function CopyResultButton({ getText }: CopyResultButtonProps) {
  const [copied, setCopied] = useState(false);
  const [fallbackText, setFallbackText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCopy = async () => {
    const text = getText();
    setFallbackText("");

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        return;
      } catch {
        // Some browsers block clipboard access outside secure contexts.
      }
    }

    setCopied(false);
    setFallbackText(text);
    window.setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }, 0);
  };

  return (
    <div className="flex flex-col gap-3">
      <Button
        fullWidth
        size="lg"
        variant={copied ? "secondary" : "primary"}
        onClick={handleCopy}
      >
        {copied ? "Copiado para WhatsApp" : "Copiar resumen para WhatsApp"}
      </Button>

      {fallbackText && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm font-medium text-amber-900">
            No se pudo copiar automáticamente.
          </p>
          <p className="mt-1 text-sm text-amber-800">
            Seleccioná el texto y copialo manualmente.
          </p>
          <textarea
            ref={textareaRef}
            readOnly
            value={fallbackText}
            className="mt-3 h-44 w-full rounded-lg border border-amber-200 bg-white p-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
      )}
    </div>
  );
}
