import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "¿Quién puso qué?",
  description:
    "Distribuí gastos compartidos en asados, reuniones y salidas grupales. La matemática no perdona, pero reparte justo.",
  openGraph: {
    title: "¿Quién puso qué?",
    description: "Calculá quién puso de más y qué transferencias conviene hacer.",
    locale: "es_AR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#fdf8f3]">{children}</body>
    </html>
  );
}
