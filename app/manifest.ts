import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "¿Quién puso qué?",
    short_name: "Quién puso",
    description:
      "Repartí gastos compartidos: quién pagó de más, quién paga y qué transferencias hacer.",
    start_url: "/calcular",
    display: "standalone",
    background_color: "#fff6e9",
    theme_color: "#ff5b1f",
    lang: "es-AR",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
