import type { Metadata } from "next";
import { HelpSection } from "@/components/help/HelpSection";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppFooter } from "@/components/layout/AppFooter";

export const metadata: Metadata = {
  title: "Ayuda",
  description:
    "Guía rápida para entender cómo cargar familias, elegir criterios y leer resultados en ¿Quién puso qué?",
  alternates: { canonical: "/ayuda" },
};

export default function HelpPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader action="calculator" />
      <main className="flex-1">
        <HelpSection />
      </main>
      <AppFooter />
    </div>
  );
}
