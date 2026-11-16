import { afterEach, describe, expect, it, vi } from "vitest";
import type { Family } from "@/types/family";
import type { EventData, ClosedEvent } from "@/types/event";
import { computeEligibility, validateFamily } from "@/lib/calculations/eligibility";
import { calculateBalances } from "@/lib/calculations/calculateBalances";
import { calculateTransfers } from "@/lib/calculations/calculateTransfers";
import { generateWhatsappText } from "@/lib/text/generateWhatsappText";
import {
  CURRENT_DRAFT_STORAGE_KEY,
  clearCurrentEventDraft,
  readCurrentEventDraft,
  saveCurrentEventDraft,
} from "@/lib/storage/localEventStorage";
import {
  clearClosedEvents,
  deleteClosedEvent,
  readClosedEvents,
  saveClosedEvent,
} from "@/lib/storage/closedEventsStorage";

function family(overrides: Partial<Family>): Family {
  return {
    id: overrides.id ?? "family-id",
    name: overrides.name ?? "Familia",
    adults: overrides.adults ?? 2,
    minors: overrides.minors ?? 0,
    paidAmount: overrides.paidAmount ?? 0,
    ...(overrides.items ? { items: overrides.items } : {}),
  };
}

function eventData(families: Family[], splitMode: EventData["splitMode"]): EventData {
  return {
    eventName: "Asado del sábado",
    currency: "ARS",
    splitMode,
    families,
  };
}

function expectOk<T extends { ok: boolean }>(
  result: T
): asserts result is Extract<T, { ok: true }> {
  expect(result.ok).toBe(true);
}

function createMemoryStorage() {
  const data = new Map<string, string>();

  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
    removeItem: (key: string) => {
      data.delete(key);
    },
    clear: () => {
      data.clear();
    },
  };
}

function installWindowWithStorage() {
  const localStorage = createMemoryStorage();
  vi.stubGlobal("window", { localStorage });
  return localStorage;
}

const demoFamilies: Family[] = [
  family({
    id: "garcia",
    name: "Los García",
    adults: 4,
    paidAmount: 8000,
  }),
  family({
    id: "rodriguez",
    name: "Los Rodríguez",
    adults: 2,
    paidAmount: 3000,
  }),
  family({
    id: "lopez",
    name: "Los López",
    adults: 1,
    minors: 0,
    paidAmount: 0,
  }),
  family({
    id: "martinez",
    name: "Los Martínez",
    adults: 0,
    minors: 1,
    paidAmount: 0,
  }),
  family({
    id: "fernandez",
    name: "Los Fernández",
    adults: 3,
    paidAmount: 5000,
  }),
];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("eligibility", () => {
  it("marca una familia de 1 adulto como aportante", () => {
    const result = computeEligibility(
      family({ adults: 1 })
    );

    expect(result.isEligibleToPay).toBe(true);
    expect(result.eligiblePersons).toBe(1);
  });

  it("marca una familia de 1 menor como no aportante", () => {
    const result = computeEligibility(
      family({ adults: 0, minors: 1 })
    );

    expect(result.isEligibleToPay).toBe(false);
    expect(result.eligiblePersons).toBe(0);
  });

  it("marca una familia de 2 o más integrantes como aportante", () => {
    const result = computeEligibility(family({ adults: 4 }));

    expect(result.isEligibleToPay).toBe(true);
    expect(result.eligiblePersons).toBe(4);
  });

  it("rechaza monto pagado en una familia de 1 menor", () => {
    const minor = family({
      id: "menor",
      adults: 0,
      minors: 1,
      paidAmount: 1000,
    });

    expect(validateFamily(minor).map((error) => error.code)).toEqual([
      "GUEST_PAID_AMOUNT",
    ]);

    const result = calculateBalances(
      eventData([minor, family({ id: "a" }), family({ id: "b" })], "by-person")
    );
    expect(result.ok).toBe(false);
  });
});

describe("calculateBalances", () => {
  it("reparte por persona entre familias del mismo tamaño", () => {
    const families = [
      family({ id: "a", name: "Familia A", adults: 2, paidAmount: 10000 }),
      family({ id: "b", name: "Familia B", adults: 2, paidAmount: 5000 }),
      family({ id: "c", name: "Familia C", adults: 2, paidAmount: 0 }),
      family({ id: "d", name: "Familia D", adults: 2, paidAmount: 0 }),
    ];
    const result = calculateBalances(eventData(families, "by-person"));
    expectOk(result);

    expect(result.data.totalAmount).toBe(15000);
    expect(result.data.balances.map((balance) => balance.expectedShare)).toEqual([
      3750,
      3750,
      3750,
      3750,
    ]);
    expect(result.data.balances.map((balance) => balance.status)).toEqual([
      "receives",
      "receives",
      "pays",
      "pays",
    ]);
  });

  it("reparte por persona con familias de distinto tamaño", () => {
    const result = calculateBalances(eventData(demoFamilies, "by-person"));
    expectOk(result);

    expect(result.data.eligiblePersonCount).toBe(10);
    expect(result.data.balances.map((balance) => balance.expectedShare)).toEqual([
      6400,
      3200,
      1600,
      0,
      4800,
    ]);
    expect(result.data.balances.map((balance) => balance.status)).toEqual([
      "receives",
      "pays",
      "pays",
      "guest",
      "receives",
    ]);
  });

  it("los balances positivos y negativos cierran contra cero", () => {
    const result = calculateBalances(eventData(demoFamilies, "by-person"));
    expectOk(result);

    const balanceSum = result.data.balances.reduce(
      (sum, balance) => sum + balance.balance,
      0
    );

    expect(balanceSum).toBeCloseTo(0, 2);
  });

  it("maneja gasto total cero como estado controlado", () => {
    const result = calculateBalances(
      eventData(
        [
          family({ id: "a", name: "Familia A", adults: 2, paidAmount: 0 }),
          family({ id: "b", name: "Familia B", adults: 1, minors: 0, paidAmount: 0 }),
          family({ id: "c", name: "Familia C", adults: 0, minors: 1, paidAmount: 0 }),
        ],
        "by-person"
      )
    );
    expectOk(result);

    expect(result.data.totalAmount).toBe(0);
    expect(result.data.balances.map((balance) => balance.status)).toEqual([
      "balanced",
      "balanced",
      "guest",
    ]);
  });
});

describe("calculateTransfers", () => {
  it("cancela deudas y créditos con transferencias", () => {
    const result = calculateBalances(eventData(demoFamilies, "by-person"));
    expectOk(result);

    const transfers = calculateTransfers(result.data.balances);

    expect(transfers.totalOwed).toBe(1800);
    expect(transfers.totalTransferred).toBe(1800);
    expect(transfers.roundingDiscrepancy).toBe(0);
    expect(transfers.transfers).toEqual([
      expect.objectContaining({
        fromFamilyName: "Los López",
        toFamilyName: "Los García",
        amount: 1600,
      }),
      expect.objectContaining({
        fromFamilyName: "Los Rodríguez",
        toFamilyName: "Los Fernández",
        amount: 200,
      }),
    ]);
  });
});

describe("generateWhatsappText", () => {
  it("genera texto legible para WhatsApp", () => {
    const result = calculateBalances(eventData(demoFamilies, "by-person"));
    expectOk(result);
    const { transfers } = calculateTransfers(result.data.balances);

    const text = generateWhatsappText({
      eventName: "Asado del sábado",
      currency: "ARS",
      splitMode: "by-person",
      families: demoFamilies,
      breakdown: result.data.breakdown,
      balances: result.data.balances,
      transfers,
    });

    expect(text).toContain("Asado del sábado");
    expect(text).toContain("Gasto total:");
    expect(text).toContain("Transferencias sugeridas:");
    expect(text).toContain("No aportan (menores solos invitados):");
    expect(text).toContain("Cómo se calculó:");
    expect(text).toContain("Calculado con ¿Quién puso qué?");
    expect(text).not.toMatch(/Ã|Â|�/);
  });
});

describe("localEventStorage", () => {
  it("no rompe cuando localStorage no está disponible", () => {
    vi.stubGlobal("window", undefined);

    expect(readCurrentEventDraft()).toBeNull();
    expect(clearCurrentEventDraft()).toBe(false);
    expect(
      saveCurrentEventDraft({
        eventData: eventData(demoFamilies, "by-person"),
        selectedMode: "by-person",
        createdAt: "2026-05-03T12:00:00.000Z",
      })
    ).toBeNull();
  });

  it("guarda y recupera un borrador válido", () => {
    installWindowWithStorage();

    const saved = saveCurrentEventDraft({
      eventData: eventData(demoFamilies, "by-person"),
      selectedMode: "by-person",
      createdAt: "2026-05-03T12:00:00.000Z",
    });
    const draft = readCurrentEventDraft();

    expect(saved).not.toBeNull();
    expect(draft?.eventName).toBe("Asado del sábado");
    expect(draft?.families).toHaveLength(5);
    expect(draft?.createdAt).toBe("2026-05-03T12:00:00.000Z");
  });

  it("pone en 0 el monto de un menor solo al recuperar un borrador viejo", () => {
    const storage = installWindowWithStorage();
    const families = demoFamilies.map((current) =>
      current.id === "martinez" ? { ...current, paidAmount: 1000 } : current
    );

    storage.setItem(
      CURRENT_DRAFT_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        eventName: "Asado del sábado",
        currency: "ARS",
        createdAt: "2026-05-03T12:00:00.000Z",
        families,
        selectedMode: "by-person",
        splitMode: "by-person",
        updatedAt: "2026-05-03T12:00:00.000Z",
      })
    );

    const draft = readCurrentEventDraft();
    const minor = draft?.families.find((current) => current.id === "martinez");

    expect(minor?.paidAmount).toBe(0);
    expect(draft?.families).toHaveLength(5);
  });
});

describe("closedEventsStorage", () => {
  function buildClosedEvent(): ClosedEvent {
    const result = calculateBalances(eventData(demoFamilies, "by-person"));
    expectOk(result);
    const transferResult = calculateTransfers(result.data.balances);

    return {
      id: "closed-1",
      eventName: "Asado del sábado",
      createdAt: "2026-05-03T12:00:00.000Z",
      closedAt: "2026-05-03T15:00:00.000Z",
      totalAmount: result.data.totalAmount,
      splitModeUsed: "by-person",
      familiesSnapshot: demoFamilies,
      balancesSnapshot: result.data.balances,
      transfersSnapshot: transferResult.transfers,
      optionalNote: "Cerrado en la sobremesa.",
    };
  }

  it("guarda y recupera un evento cerrado", () => {
    installWindowWithStorage();
    const event = buildClosedEvent();

    saveClosedEvent(event);
    const events = readClosedEvents();

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      id: "closed-1",
      eventName: "Asado del sábado",
      totalAmount: 16000,
      splitModeUsed: "by-person",
    });
    expect(events[0].balancesSnapshot).toHaveLength(5);
    expect(events[0].transfersSnapshot.length).toBeGreaterThan(0);
  });

  it("elimina un evento cerrado", () => {
    installWindowWithStorage();
    saveClosedEvent(buildClosedEvent());

    const events = deleteClosedEvent("closed-1");

    expect(events).toEqual([]);
    expect(readClosedEvents()).toEqual([]);
  });

  it("borra todo el historial de eventos cerrados", () => {
    installWindowWithStorage();
    saveClosedEvent(buildClosedEvent());

    expect(clearClosedEvents()).toEqual([]);
    expect(readClosedEvents()).toEqual([]);
  });
});
