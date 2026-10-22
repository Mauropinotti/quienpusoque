import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import localFont from "next/font/local";
import "./globals.css";

// Una sola fuente variable (un woff2 para todos los pesos) autoalojada, con
// fallback de métricas ajustadas para evitar layout shift. Es un subset propio
// de Bricolage Grotesque (OFL, ver app/fonts/OFL.txt): Latin básico + Latin-1 +
// puntuación tipográfica y eje de peso 400–800. 35 KB contra 41 KB del subset
// "latin" de Google, y el build no depende de descargar fuentes.
const bricolage = localFont({
  src: "./fonts/bricolage-grotesque-latin-wght.woff2",
  weight: "400 800",
  variable: "--font-bricolage",
  display: "swap",
  adjustFontFallback: "Arial",
});

const SITE_URL = "https://quien-puso-que.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "¿Quién puso qué? · Repartí gastos sin discutir",
    template: "%s · ¿Quién puso qué?",
  },
  description:
    "Cargás quién vino y cuánto puso: la app reparte por familia o por persona, arma las transferencias y te da el resumen para WhatsApp y un ticket PDF. Sin registro, todo en tu navegador.",
  applicationName: "¿Quién puso qué?",
  authors: [{ name: "MauroHP" }],
  keywords: [
    "dividir gastos",
    "repartir gastos",
    "asado",
    "calculadora de gastos compartidos",
    "transferencias",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "¿Quién puso qué?",
    description:
      "Calculá quién puso de más, quién paga y qué transferencias conviene hacer.",
    locale: "es_AR",
    type: "website",
    url: SITE_URL,
    siteName: "¿Quién puso qué?",
  },
  twitter: {
    card: "summary_large_image",
    title: "¿Quién puso qué?",
    description:
      "Repartí gastos compartidos desde el celular y mandá el resumen al grupo.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ff5b1f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: el script inline de /calcular marca <html>
    // antes de hidratar (data-calc-resume). Solo afecta a este elemento.
    <html lang="es-AR" className={bricolage.variable} suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        {children}
        {/* Solo en Vercel: en otros hosts el script da 404 y ensucia la consola. */}
        {process.env.VERCEL ? <Analytics /> : null}
      </body>
    </html>
  );
}
