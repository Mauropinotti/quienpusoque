"use client";

import { useState } from "react";
import type { EventTicketPdfData } from "@/types/pdf";
import { Button } from "@/components/ui/Button";

interface ExportPdfButtonProps {
  data: EventTicketPdfData;
}

export function ExportPdfButton({ data }: ExportPdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const handleExport = async () => {
    setError("");

    try {
      setIsGenerating(true);
      const { generateEventTicketPdf } = await import(
        "@/lib/pdf/generateEventTicketPdf"
      );
      generateEventTicketPdf(data);
    } catch {
      setError(
        "No se pudo descargar el PDF. Probá de nuevo o revisá los permisos del navegador."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button fullWidth size="lg" onClick={handleExport} disabled={isGenerating}>
        {isGenerating ? "Generando PDF..." : "Descargar ticket PDF"}
      </Button>
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}
    </div>
  );
}
