import { afterEach, describe, expect, it, vi } from "vitest";
import type { Family } from "@/types/family";
import type { EventData, ClosedEvent } from "@/types/event";
import { computeAllEligibility, computeEligibility } from "@/lib/calculations/eligibility";
import { calculateBalances } from "@/lib/calculations/calculateBalances";
import { calculateTransfers } from "@/lib/calculations/calculateTransfers";
import { calculateModeImpact } from "@/lib/calculations/calculateModeImpact";
import { recommendSplitMode } from "@/lib/calculations/recommendSplitMode";
import { generateWhatsappText } from "@/lib/text/generateWhatsappText";
import {
  clearCurrentEventDraft,
  readCurrentEventDraft,
  saveCurrentEventDraft,
} from "@/lib/storage/localEventStorage";
import {
  deleteClosedEvent,
  readClosedEvents,
  saveClosedEvent,
} from "@/lib/storage/closedEventsStorage";

function family(overrides: Partial<Family>): Family {
  return {
    id: overrides.id ?? "family-id",
    name: overrides.name ?? "Familia",
    members: overrides.members ?? 2,
    singleMemberType: overrides.singleMemberType ?? null,
    paidAmount: overrides.paidAmount ?? 0,
    notes: overrides.notes,
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
    members: 4,
    paidAmount: 8000,
  }),
  family({
    id: "rodriguez",
    name: "Los Rodríguez",
    members: 2,
    paidAmount: 3000,
  }),
  family({
    id: "lopez",
    name: "Los López",
    members: 1,
    singleMemberType: "adult",
    paidAmount: 0,
  }),
  family({
    id: "martinez",
    name: "Los Martínez",
    members: 1,
    singleMemberType: "minor",
    paidAmount: 0,
  }),
  family({
    id: "fernandez",
    name: "Los Fernández",
    members: 3,
    paidAmount: 5000,
  }),
];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("eligibility", () => {
  it("marca una familia de 1 adulto como aportante", () => {
    const result = computeEligibility(
      family({ members: 1, singleMemberType: "adult" })
    );

    expect(result.isEligibleToPay).toBe(true);
    expect(result.eligiblePersons).toBe(1);
  });

  it("marca una familia de 1 menor como no aportante", () => {
    const result = computeEligibility(
      family({ members: 1, singleMemberType: "minor" })
    );

    expect(result.isEligibleToPay).toBe(false);
    expect(result.eligiblePersons).toBe(0);
  });

  it("marca una familia de 2 o más integrantes como aportante", () => {
    const result = computeEligibility(family({ members: 4 }));

    expect(result.isEligibleToPay).toBe(true);
    expect(result.eligiblePersons).toBe(4);
  });
});

describe("calculateBalances", () => {
  it("reparte por familia con dos familias que pagaron y varias que no", () => {
    const families = [
      family({ id: "a", name: "Familia A", members: 2, paidAmount: 10000 }),
      family({ id: "b", name: "Familia B", members: 2, paidAmount: 5000 }),
      family({ id: "c", name: "Familia C", members: 2, paidAmount: 0 }),
      family({ id: "d", name: "Familia D", members: 2, paidAmount: 0 }),
    ];
    const result = calculateBalances(eventData(families, "by-family"));
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
    const result = calculateBalances(eventData(demoFamilies, "by-family"));
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
          family({ id: "a", name: "Familia A", members: 2, paidAmount: 0 }),
          family({ id: "b", name: "Familia B", members: 1, singleMemberType: "adult", paidAmount: 0 }),
          family({ id: "c", name: "Familia C", members: 1, singleMemberType: "minor", paidAmount: 0 }),
        ],
        "by-family"
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
    const result = calculateBalances(eventData(demoFamilies, "by-family"));
    expectOk(result);

    const transfers = calculateTransfers(result.data.balances);

    expect(transfers.totalOwed).toBe(5000);
    expect(transfers.totalTransferred).toBe(5000);
    expect(transfers.roundingDiscrepancy).toBe(0);
    expect(transfers.transfers).toEqual([
      expect.objectContaining({
        fromFamilyName: "Los López",
        toFamilyName: "Los García",
        amount: 4000,
      }),
      expect.objectContaining({
        fromFamilyName: "Los Rodríguez",
        toFamilyName: "Los Fernández",
        amount: 1000,
      }),
    ]);
  });
});

describe("recommendSplitMode", () => {
  it("sugiere reparto por persona cuando hay muchas familias de 1 adulto", () => {
    const recommendation = recommendSplitMode(
      computeAllEligibility([
        family({ id: "a", name: "A", members: 1, singleMemberType: "adult", paidAmount: 1000 }),
        family({ id: "b", name: "B", members: 1, singleMemberType: "adult", paidAmount: 1000 }),
        family({ id: "c", name: "C", members: 3, paidAmount: 1000 }),
      ])
    );

    expect(recommendation.recommendedMode).toBe("by-person");
  });

  it("sugiere reparto por familia con tamaños similares", () => {
    const recommendation = recommendSplitMode(
      computeAllEligibility([
        family({ id: "a", name: "A", members: 3, paidAmount: 3000 }),
        family({ id: "b", name: "B", members: 3, paidAmount: 3000 }),
        family({ id: "c", name: "C", members: 4, paidAmount: 3000 }),
        family({ id: "d", name: "D", members: 4, paidAmount: 3000 }),
      ])
    );

    expect(recommendation.recommendedMode).toBe("by-family");
  });

  it("sugiere reparto por persona cuando el impacto económico es alto", () => {
    const families = computeAllEligibility([
      family({ id: "a", name: "A", members: 1, singleMemberType: "adult", paidAmount: 5000 }),
      family({ id: "b", name: "B", members: 1, singleMemberType: "adult", paidAmount: 0 }),
      family({ id: "c", name: "C", members: 5, paidAmount: 5000 }),
    ]);

    const impact = calculateModeImpact(families);
    const recommendation = recommendSplitMode(families);

    expect(impact.maxDiffRatio).toBeGreaterThan(0.35);
    expect(recommendation.recommendedMode).toBe("by-person");
  });
});

describe("calculateModeImpact", () => {
  it("calcula cuotas por familia y por persona para comparar criterios", () => {
    const impact = calculateModeImpact(computeAllEligibility(demoFamilies));

    expect(impact.byFamilyShares.garcia).toBe(4000);
    expect(impact.byPersonShares.garcia).toBe(6400);
    expect(impact.avgDiffRatio).toBeGreaterThan(0);
    expect(impact.maxDiffRatio).toBeGreaterThan(impact.avgDiffRatio);
  });
});

describe("generateWhatsappText", () => {
  it("genera texto legible para WhatsApp", () => {
    const result = calculateBalances(eventData(demoFamilies, "by-family"));
    expectOk(result);
    const { transfers } = calculateTransfers(result.data.balances);

    const text = generateWhatsappText({
      eventName: "Asado del sábado",
      currency: "ARS",
      splitMode: "by-family",
      balances: result.data.balances,
      transfers,
    });

    expect(text).toContain("Asado del sábado");
    expect(text).toContain("Gasto total:");
    expect(text).toContain("Transferencias sugeridas:");
    expect(text).toContain("Invitados no aportantes:");
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
        eventData: eventData(demoFamilies, "by-family"),
        selectedMode: "by-family",
        recommendationAccepted: true,
        createdAt: "2026-05-03T12:00:00.000Z",
      })
    ).toBeNull();
  });

  it("guarda y recupera un borrador válido", () => {
    installWindowWithStorage();

    const saved = saveCurrentEventDraft({
      eventData: eventData(demoFamilies, "by-family"),
      selectedMode: "by-family",
      recommendationAccepted: true,
      createdAt: "2026-05-03T12:00:00.000Z",
    });
    const draft = readCurrentEventDraft();

    expect(saved).not.toBeNull();
    expect(draft?.eventName).toBe("Asado del sábado");
    expect(draft?.families).toHaveLength(5);
    expect(draft?.createdAt).toBe("2026-05-03T12:00:00.000Z");
  });
});

describe("closedEventsStorage", () => {
  function buildClosedEvent(): ClosedEvent {
    const result = calculateBalances(eventData(demoFamilies, "by-family"));
    expectOk(result);
    const transferResult = calculateTransfers(result.data.balances);
    const recommendation = recommendSplitMode(computeAllEligibility(demoFamilies));

    return {
      id: "closed-1",
      eventName: "Asado del sábado",
      createdAt: "2026-05-03T12:00:00.000Z",
      closedAt: "2026-05-03T15:00:00.000Z",
      totalAmount: result.data.totalAmount,
      splitModeUsed: "by-family",
      familiesSnapshot: demoFamilies,
      balancesSnapshot: result.data.balances,
      transfersSnapshot: transferResult.transfers,
      recommendationSnapshot: recommendation,
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
      splitModeUsed: "by-family",
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
});
