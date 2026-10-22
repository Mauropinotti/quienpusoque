import type { Metadata } from "next";
import { CalculatorLoader } from "@/components/calculator/CalculatorLoader";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppFooter } from "@/components/layout/AppFooter";
import { CALCULATOR_RESUME_SCRIPT } from "@/lib/flow/bootstrapFlow";

export const metadata: Metadata = {
  title: "Calculadora",
  description:
    "Cargá las familias, elegí el criterio y obtené las transferencias para cerrar la cuenta del evento.",
  alternates: { canonical: "/calcular" },
};

// El shell (header, skeleton, footer) se prerenderiza estático; el calculador
// se hidrata en el cliente porque todo su estado vive en el navegador.
export default function CalculatorPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      <main className="flex-1">
        {/* Corre durante el parseo, antes del primer paint: decide qué fallback mostrar. */}
        <script dangerouslySetInnerHTML={{ __html: CALCULATOR_RESUME_SCRIPT }} />
        <CalculatorLoader />
      </main>
      <AppFooter />
    </div>
  );
}
