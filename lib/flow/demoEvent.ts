import type { Family } from "@/types/family";

/**
 * Evento de ejemplo: lo usan la landing (ticket de muestra) y el botón de demo.
 * Cada `paidAmount` es la suma de sus `items`. Hay 7 adultos y 3 menores en
 * familias que aportan; Los Martínez (un menor solo) no aportan.
 */
export const DEMO_EVENT_NAME = "Asado del sábado";

export const DEMO_FAMILIES: Family[] = [
  {
    id: "demo-garcia",
    name: "Los García",
    adults: 2,
    minors: 2,
    paidAmount: 8000,
    items: [
      { description: "Carne", amount: 6500 },
      { description: "Carbón", amount: 1500 },
    ],
  },
  {
    id: "demo-rodriguez",
    name: "Los Rodríguez",
    adults: 2,
    minors: 0,
    paidAmount: 3000,
    items: [{ description: "Bebidas", amount: 3000 }],
  },
  {
    id: "demo-lopez",
    name: "Los López",
    adults: 1,
    minors: 0,
    paidAmount: 0,
  },
  {
    id: "demo-martinez",
    name: "Los Martínez",
    adults: 0,
    minors: 1,
    paidAmount: 0,
  },
  {
    id: "demo-fernandez",
    name: "Los Fernández",
    adults: 2,
    minors: 1,
    paidAmount: 5000,
    items: [
      { description: "Ensaladas", amount: 2500 },
      { description: "Pan", amount: 1200 },
      { description: "Hielo", amount: 1300 },
    ],
  },
];
