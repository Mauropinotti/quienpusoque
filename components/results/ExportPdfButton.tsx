"use client";

import { memo, useState } from "react";
import type { EventTicketPdfData } from "@/types/pdf";
import { Button } from "@/components/ui/Button";
import { DownloadIcon } from "@/components/ui/icons";

interface ExportPdfButtonProps {
  /** Se llama al hacer click: la fecha del ticket es la del momento de descarga. */
  getData: () => EventTicketPdfData;
}

// jsPDF pesa ~120 KB: vive en su propio chunk y se pide recién cuando el
// usuario muestra intención (hover, foco o toque) para que el click sea instantáneo.
const loadPdfModule = () => import("@/lib/pdf/generateEventTicketPdf");

export const ExportPdfButton = memo(function ExportPdfButton({
  getData,
}: ExportPdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const prefetch = () => {
    void loadPdfModule();
  };

  const handleExport = async () => {
    setError("");

    try {
      setIsGenerating(true);
      const { generateEventTicketPdf } = await loadPdfModule();
      generateEventTicketPdf(getData());
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
      <Button
        variant="secondary"
        size="lg"
        fullWidth
        onClick={handleExport}
        onPointerEnter={prefetch}
        onFocus={prefetch}
        onTouchStart={prefetch}
        disabled={isGenerating}
      >
        <DownloadIcon />
        {isGenerating ? "Generando PDF..." : "Descargar ticket PDF"}
      </Button>
      {error && (
        <p role="alert" className="rounded-xl border-2 border-morron bg-morron-soft px-3 py-2 text-sm font-bold text-morron">
          {error}
        </p>
      )}
    </div>
  );
});
