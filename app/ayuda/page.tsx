import type { Metadata } from "next";
import { HelpSection } from "@/components/help/HelpSection";

export const metadata: Metadata = {
  title: "Ayuda",
  description:
    "Guía rápida para entender cómo cargar familias, elegir criterios y leer resultados en ¿Quién puso qué?",
};

export default function HelpPage() {
  return <HelpSection />;
}
