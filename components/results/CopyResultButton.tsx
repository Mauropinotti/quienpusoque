"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface CopyResultButtonProps {
  getText: () => string;
}

export function CopyResultButton({ getText }: CopyResultButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = getText();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Button fullWidth size="lg" variant={copied ? "secondary" : "primary"} onClick={handleCopy}>
      {copied ? "✓ ¡Copiado! Pegalo en WhatsApp" : "📋 Copiar resumen para WhatsApp"}
    </Button>
  );
}
