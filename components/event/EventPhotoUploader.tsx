"use client";

import { memo, useRef, useState } from "react";
import type { EventTicketPhoto } from "@/types/pdf";
import { prepareTicketPhoto } from "@/lib/image/prepareTicketPhoto";
import { TICKET_PHOTO_SLOT_MM } from "@/lib/pdf/ticketPhoto";

const PREVIEW_ASPECT = `${TICKET_PHOTO_SLOT_MM.width} / ${TICKET_PHOTO_SLOT_MM.height}`;
import { Button } from "@/components/ui/Button";
import { CameraIcon } from "@/components/ui/icons";

interface EventPhotoUploaderProps {
  photo: EventTicketPhoto | null;
  onPhotoChange: (photo: EventTicketPhoto | null) => void;
}

export const EventPhotoUploader = memo(function EventPhotoUploader({
  photo,
  onPhotoChange,
}: EventPhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = async (file: File | undefined) => {
    setError("");
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Elegí una imagen válida.");
      return;
    }

    try {
      setIsProcessing(true);
      onPhotoChange(await prepareTicketPhoto(file));
    } catch {
      setError("No se pudo preparar la foto. Podés generar el PDF sin imagen.");
    } finally {
      setIsProcessing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="rounded-xl border-2 border-dashed border-ink/40 p-3">
      {photo ? (
        // Misma proporción que el espacio del PDF: lo que ves es lo que se imprime.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo.dataUrl}
          alt="Foto elegida para el ticket PDF"
          style={{ aspectRatio: PREVIEW_ASPECT }}
          className="w-full rounded-lg border-2 border-ink object-cover"
        />
      ) : (
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-ink bg-sky-soft text-xl">
            <CameraIcon />
          </span>
          <p className="text-sm leading-snug text-ink-soft">
            <span className="block font-bold text-ink">Foto del evento (opcional)</span>
            Se usa solo para el PDF. No se sube ni se guarda.
          </p>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          onClick={() => inputRef.current?.click()}
          disabled={isProcessing}
        >
          <CameraIcon />
          {isProcessing ? "Preparando..." : photo ? "Cambiar foto" : "Sumar foto"}
        </Button>
        {photo && (
          <Button variant="ghost" size="sm" onClick={() => onPhotoChange(null)} disabled={isProcessing}>
            Quitar
          </Button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => handleFileChange(event.target.files?.[0])}
        aria-label="Seleccionar foto opcional para el ticket PDF"
      />

      {error && (
        <p role="alert" className="mt-2 text-sm font-bold text-morron">
          {error}
        </p>
      )}
    </div>
  );
});
