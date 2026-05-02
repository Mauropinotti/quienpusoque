"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface CopyResultButtonProps {
  getText: () => string;
}

export function CopyResultButton({ getText }: CopyResultButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Button
      fullWidth
      size="lg"
      variant={copied ? "secondary" : "primary"}
      onClick={handleCopy}
    >
      {copied ? "Copiado para WhatsApp" : "Copiar resumen para WhatsApp"}
    </Button>
  );
}
