import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { AppFooter } from "@/components/layout/AppFooter";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://quien-puso-que.vercel.app"),
  title: {
    default: "¿Quién puso qué?",
    template: "%s | ¿Quién puso qué?",
  },
  description:
    "Calculadora mobile first para repartir gastos compartidos, ver transferencias y copiar el resumen para WhatsApp.",
  applicationName: "¿Quién puso qué?",
  openGraph: {
    title: "¿Quién puso qué?",
    description:
      "Calculá quién puso de más, quién paga y qué transferencias conviene hacer.",
    locale: "es_AR",
    type: "website",
    url: "https://quien-puso-que.vercel.app",
    siteName: "¿Quién puso qué?",
  },
  twitter: {
    card: "summary",
    title: "¿Quién puso qué?",
    description:
      "Repartí gastos compartidos desde el celular y copiá el resumen para WhatsApp.",
  },
  icons: {
    icon: "/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ea580c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-[#fdf8f3] text-stone-950">
        <div className="flex-1">{children}</div>
        <AppFooter />
      </body>
    </html>
  );
}
