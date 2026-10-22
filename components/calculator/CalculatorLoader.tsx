"use client";

import dynamic from "next/dynamic";
import { CalculatorFallback } from "./CalculatorFallback";

// ssr: false → el calculador lee el borrador de localStorage al inicializar el
// estado, sin flash del paso 1 y sin riesgo de mismatch de hidratación. Su JS
// se descarga mientras el fallback (prerenderizado en el HTML) ya está pintado.
const CalculatorApp = dynamic(
  () => import("./CalculatorApp").then((module) => module.CalculatorApp),
  { ssr: false, loading: () => <CalculatorFallback /> }
);

export function CalculatorLoader() {
  return <CalculatorApp />;
}
