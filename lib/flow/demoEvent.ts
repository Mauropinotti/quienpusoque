import type { Family } from "@/types/family";

/** Evento de ejemplo: lo usan la landing (ticket de muestra) y el botón de demo. */
export const DEMO_EVENT_NAME = "Asado del sábado";

export const DEMO_FAMILIES: Family[] = [
  {
    id: "demo-garcia",
    name: "Los García",
    members: 4,
    singleMemberType: null,
    paidAmount: 8000,
    notes: "Carne y carbón",
  },
  {
    id: "demo-rodriguez",
    name: "Los Rodríguez",
    members: 2,
    singleMemberType: null,
    paidAmount: 3000,
    notes: "Bebidas",
  },
  {
    id: "demo-lopez",
    name: "Los López",
    members: 1,
    singleMemberType: "adult",
    paidAmount: 0,
  },
  {
    id: "demo-martinez",
    name: "Los Martínez",
    members: 1,
    singleMemberType: "minor",
    paidAmount: 0,
  },
  {
    id: "demo-fernandez",
    name: "Los Fernández",
    members: 3,
    singleMemberType: null,
    paidAmount: 5000,
    notes: "Ensaladas",
  },
];
