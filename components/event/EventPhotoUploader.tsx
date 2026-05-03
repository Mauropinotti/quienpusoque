"use client";

import { useRef, useState } from "react";
import type { EventTicketPhoto } from "@/types/pdf";
import { Button } from "@/components/ui/Button";

interface EventPhotoUploaderProps {
  photo: EventTicketPhoto | null;
  onPhotoChange: (photo: EventTicketPhoto | null) => void;
}

const MAX_WIDTH = 1400;
const MAX_HEIGHT = 900;
const JPEG_QUALITY = 0.82;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo procesar la imagen."));
    image.src = dataUrl;
  });
}

async function compressImage(file: File): Promise<EventTicketPhoto> {
  const originalDataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(originalDataUrl);
  const ratio = Math.min(MAX_WIDTH / image.width, MAX_HEIGHT / image.height, 1);
  const width = Math.round(image.width * ratio);
  const height = Math.round(image.height * ratio);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("El navegador no permitió preparar la imagen.");

  context.drawImage(image, 0, 0, width, height);

  return {
    dataUrl: canvas.toDataURL("image/jpeg", JPEG_QUALITY),
    name: file.name,
    type: "image/jpeg",
    size: file.size,
  };
}

export function EventPhotoUploader({
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
      const compressedPhoto = await compressImage(file);
      onPhotoChange(compressedPhoto);
    } catch {
      setError("No se pudo preparar la foto. Podés generar el PDF sin imagen.");
    } finally {
      setIsProcessing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-stone-900">
            Foto opcional del evento
          </h3>
          <p className="mt-1 text-sm text-stone-500">
            Se usa solo para armar el PDF. No se sube ni se guarda en historial.
          </p>
        </div>
      </div>

      {photo && (
        <div className="mt-3 overflow-hidden rounded-lg border border-stone-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.dataUrl}
            alt="Foto seleccionada para el ticket PDF"
            className="h-40 w-full object-cover"
          />
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          variant="secondary"
          fullWidth
          onClick={() => inputRef.current?.click()}
          disabled={isProcessing}
        >
          {photo ? "Cambiar foto" : "Subir foto"}
        </Button>
        <Button
          variant="ghost"
          fullWidth
          onClick={() => onPhotoChange(null)}
          disabled={!photo || isProcessing}
        >
          Quitar foto
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => handleFileChange(event.target.files?.[0])}
        aria-label="Seleccionar foto opcional para el ticket PDF"
      />

      {isProcessing && (
        <p className="mt-2 text-xs text-stone-500">Preparando imagen...</p>
      )}
      {error && <p className="mt-2 text-xs font-medium text-red-700">{error}</p>}
    </section>
  );
}
