"use client";

import { memo, useRef, useState } from "react";
import type { EventSnapshot } from "@/types/event";
import {
  EVENT_FILE_ACCEPT,
  IMPORT_ERRORS,
  MAX_EVENT_FILE_BYTES,
  parseEventExportFile,
} from "@/lib/exchange/eventFile";
import { Button } from "@/components/ui/Button";
import { UploadIcon } from "@/components/ui/icons";

interface ImportEventCardProps {
  /** Hay una cuenta en curso: importar la reemplaza, así que se confirma. */
  hasDraft: boolean;
  onImport: (event: EventSnapshot) => void;
}

function describeEvent(event: EventSnapshot): string {
  const name = event.eventName.trim() || "Evento sin nombre";
  const families =
    event.families.length === 1 ? "1 familia" : `${event.families.length} familias`;
  return `“${name}”, ${families}`;
}

export const ImportEventCard = memo(function ImportEventCard({
  hasDraft,
  onImport,
}: ImportEventCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [isReading, setIsReading] = useState(false);
  const [pending, setPending] = useState<EventSnapshot | null>(null);

  const handleFile = async (file: File | undefined) => {
    setError("");
    setPending(null);
    if (!file) return;

    try {
      if (file.size > MAX_EVENT_FILE_BYTES) {
        setError(IMPORT_ERRORS.tooLarge);
        return;
      }

      setIsReading(true);
      const result = parseEventExportFile(await file.text());
      if (!result.ok) {
        setError(result.error);
      } else if (hasDraft) {
        setPending(result.event);
      } else {
        onImport(result.event);
      }
    } catch {
      setError(IMPORT_ERRORS.unreadable);
    } finally {
      setIsReading(false);
      // Permite volver a elegir el mismo archivo.
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <section
      aria-labelledby="import-title"
      className="rounded-[1.25rem] border-2 border-dashed border-ink/40 bg-white/60 p-4"
    >
      <div className="flex items-center gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 border-ink bg-sky-soft text-2xl">
          <UploadIcon />
        </span>
        <span>
          <span id="import-title" className="block font-bold">
            ¿Tenés un cálculo guardado?
          </span>
          <span className="block text-sm text-ink-soft">
            Importá el archivo que exportaste y seguí donde lo dejaste.
          </span>
        </span>
      </div>

      {pending ? (
        <div role="alert" className="mt-3 rounded-xl border-2 border-ink bg-mustard-soft p-3">
          <p className="font-bold text-mustard-text">¿Reemplazamos la cuenta en curso?</p>
          <p className="text-sm text-mustard-text">
            Se carga {describeEvent(pending)} en lugar de lo que tenés ahora. El historial guardado queda.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPending(null)}>
              Mejor no
            </Button>
            <Button
              variant="ink"
              size="sm"
              onClick={() => {
                onImport(pending);
                setPending(null);
              }}
            >
              Sí, importar
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="secondary"
          fullWidth
          className="mt-3"
          onClick={() => inputRef.current?.click()}
          disabled={isReading}
        >
          <UploadIcon />
          {isReading ? "Leyendo archivo..." : "Importar cálculo"}
        </Button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={EVENT_FILE_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => handleFile(event.target.files?.[0])}
        aria-label="Seleccionar archivo de cálculo para importar"
      />

      {error && (
        <p role="alert" className="mt-3 rounded-xl border-2 border-morron bg-morron-soft px-3 py-2 text-sm font-bold text-morron">
          {error}
        </p>
      )}
    </section>
  );
});
