"use client";

import { memo, useEffect, useState } from "react";
import type { EventSnapshot } from "@/types/event";
import { downloadTextFile } from "@/lib/exchange/downloadFile";
import {
  EVENT_FILE_MIME_TYPE,
  buildEventExportFile,
  buildEventExportFileName,
  serializeEventExportFile,
} from "@/lib/exchange/eventFile";
import { Button, type ButtonSize } from "@/components/ui/Button";
import { CheckIcon, DownloadIcon } from "@/components/ui/icons";

interface ExportEventButtonProps {
  /** Se llama al hacer click: exporta el estado de ese momento. */
  getSnapshot: () => EventSnapshot;
  size?: ButtonSize;
  fullWidth?: boolean;
  label?: string;
}

export const ExportEventButton = memo(function ExportEventButton({
  getSnapshot,
  size = "sm",
  fullWidth = false,
  label = "Exportar cálculo",
}: ExportEventButtonProps) {
  const [exportedFile, setExportedFile] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!exportedFile) return;
    const id = window.setTimeout(() => setExportedFile(""), 4000);
    return () => window.clearTimeout(id);
  }, [exportedFile]);

  const handleExport = () => {
    setError("");
    const snapshot = getSnapshot();
    const now = new Date();
    const fileName = buildEventExportFileName(snapshot.eventName, now);
    const content = serializeEventExportFile(
      buildEventExportFile(snapshot, now.toISOString())
    );

    if (downloadTextFile(fileName, content, EVENT_FILE_MIME_TYPE)) {
      setExportedFile(fileName);
    } else {
      setError("No se pudo descargar el archivo. Revisá los permisos de descarga del navegador.");
    }
  };

  // Al lado de un título (no fullWidth) solo cambia el botón, para no
  // empujar el layout; el detalle igual se anuncia a lectores de pantalla.
  return (
    <div className={`flex flex-col gap-2 ${fullWidth ? "" : "items-end"}`}>
      <Button
        variant="secondary"
        size={size}
        fullWidth={fullWidth}
        onClick={handleExport}
        title="Baja un archivo con lo cargado para seguir después con Importar cálculo"
      >
        {exportedFile ? <CheckIcon /> : <DownloadIcon />}
        {exportedFile && !fullWidth ? "¡Archivo listo!" : label}
      </Button>
      <p aria-live="polite" className={fullWidth ? "text-sm text-ink-soft empty:hidden" : "sr-only"}>
        {exportedFile && (
          <>
            Listo: bajó <span className="font-mono text-xs font-bold break-all">{exportedFile}</span>. Para
            seguir, importalo desde el paso 1.
          </>
        )}
      </p>
      {error && (
        <p role="alert" className="rounded-xl border-2 border-morron bg-morron-soft px-3 py-2 text-sm font-bold text-morron">
          {error}
        </p>
      )}
    </div>
  );
});
