import { afterEach, describe, expect, it, vi } from "vitest";
import type { ClosedEvent } from "@/types/event";
import type { Family } from "@/types/family";
import {
  createEmptyFlowState,
  eventFlowReducer,
  getStepFromDraft,
  type EventFlowState,
} from "@/lib/flow/eventFlow";
import { bootstrapFlow, wantsDemo } from "@/lib/flow/bootstrapFlow";
import { DEMO_FAMILIES } from "@/lib/flow/demoEvent";
import { deriveEventInsights, deriveSettlement } from "@/lib/flow/eventInsights";
import { getBrowserStorage } from "@/lib/storage/browserStorage";
import {
  CURRENT_DRAFT_STORAGE_KEY,
  getDraftFingerprint,
  saveCurrentEventDraft,
} from "@/lib/storage/localEventStorage";
import {
  getClosedEventsSnapshot,
  saveClosedEvent,
  subscribeToClosedEvents,
} from "@/lib/storage/closedEventsStorage";
import { formatCurrency, formatMoney } from "@/lib/formatting/formatCurrency";
import { computeCoverCrop, computeOutputSize } from "@/lib/image/prepareTicketPhoto";

const NOW = "2026-10-22T12:00:00.000Z";

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

function countingStorage(options: { failWrites?: boolean } = {}) {
  const data = new Map<string, string>();
  const calls = { get: 0, set: 0, remove: 0 };

  return {
    calls,
    getItem: (key: string) => {
      calls.get += 1;
      return data.get(key) ?? null;
    },
    setItem: (key: string, value: string) => {
      calls.set += 1;
      if (options.failWrites && !key.endsWith(":probe")) {
        throw new Error("QuotaExceededError");
      }
      data.set(key, value);
    },
    removeItem: (key: string) => {
      calls.remove += 1;
      data.delete(key);
    },
  };
}

function installStorage(storage: ReturnType<typeof countingStorage>) {
  const listeners = new Map<string, () => void>();
  vi.stubGlobal("window", {
    localStorage: storage,
    addEventListener: (name: string, fn: () => void) => listeners.set(name, fn),
    removeEventListener: (name: string) => listeners.delete(name),
  });
  return storage;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

// ── Reducer del flujo ─────────────────────────────────────────────────────────

describe("eventFlowReducer", () => {
  const base = createEmptyFlowState(NOW);

  function withDemo(): EventFlowState {
    return eventFlowReducer(base, { type: "demo-loaded", now: NOW });
  }

  it("carga el ejemplo en el paso de familias conservando la moneda", () => {
    const state = eventFlowReducer(
      { ...base, eventData: { ...base.eventData, currency: "USD" } },
      { type: "demo-loaded", now: NOW }
    );

    expect(state.step).toBe("families");
    expect(state.eventData.families).toHaveLength(5);
    expect(state.eventData.currency).toBe("USD");
  });

  it("devuelve el mismo estado ante acciones que no cambian nada", () => {
    expect(eventFlowReducer(base, { type: "event-renamed", name: "" })).toBe(base);
    expect(eventFlowReducer(base, { type: "step-changed", step: "setup" })).toBe(base);
    expect(
      eventFlowReducer(base, { type: "mode-selected", mode: "by-person" })
    ).toBe(base);
  });

  it("invalida guardado y foto al tocar familias", () => {
    const dirty: EventFlowState = {
      ...withDemo(),
      savedClosedEventId: "closed-1",
      historySaveError: "error",
      ticketPhoto: { dataUrl: "data:", name: "a.jpg", type: "image/jpeg", size: 1 },
    };

    const state = eventFlowReducer(dirty, {
      type: "family-added",
      family: family({ id: "nueva", name: "Los Pérez" }),
    });

    expect(state.eventData.families).toHaveLength(6);
    expect(state.savedClosedEventId).toBeNull();
    expect(state.historySaveError).toBe("");
    expect(state.ticketPhoto).toBeNull();
  });

  it("abre el criterio, respeta lo elegido sobre menores y lo confirma", () => {
    let state = eventFlowReducer(withDemo(), { type: "criterion-opened" });
    expect(state.step).toBe("criterion");
    expect(state.selectedMode).toBe("by-person");

    state = eventFlowReducer(state, { type: "mode-selected", mode: "by-person-minors-half" });
    state = eventFlowReducer(state, { type: "step-changed", step: "families" });
    state = eventFlowReducer(state, { type: "criterion-opened" });
    expect(state.selectedMode).toBe("by-person-minors-half");

    state = eventFlowReducer(state, { type: "mode-confirmed" });
    expect(state.step).toBe("results");
    expect(state.eventData.splitMode).toBe("by-person-minors-half");
  });

  it("edita y elimina familias por id", () => {
    let state = withDemo();
    const garcia = state.eventData.families[0];

    state = eventFlowReducer(state, {
      type: "family-updated",
      family: { ...garcia, paidAmount: 9000 },
    });
    expect(state.eventData.families[0].paidAmount).toBe(9000);

    state = eventFlowReducer(state, { type: "family-removed", id: garcia.id });
    expect(state.eventData.families.map((f) => f.id)).not.toContain(garcia.id);
  });

  it("resetea a un evento vacío", () => {
    const state = eventFlowReducer(withDemo(), { type: "reset", now: NOW });
    expect(state).toEqual(createEmptyFlowState(NOW));
  });

  it("elige el paso inicial según el borrador recuperado", () => {
    const draft = {
      version: 1 as const,
      eventName: "Asado",
      currency: "ARS",
      createdAt: NOW,
      families: DEMO_FAMILIES,
      selectedMode: "by-person" as const,
      splitMode: null,
      updatedAt: NOW,
    };

    expect(getStepFromDraft(draft)).toBe("families");
    expect(getStepFromDraft({ ...draft, splitMode: "by-person-minors-half" })).toBe("results");
    expect(getStepFromDraft({ ...draft, families: [] })).toBe("setup");
  });
});

// ── Arranque del calculador ───────────────────────────────────────────────────

describe("bootstrapFlow", () => {
  it("detecta el parámetro ?demo", () => {
    expect(wantsDemo("?demo=1")).toBe(true);
    expect(wantsDemo("?demo")).toBe(true);
    expect(wantsDemo("")).toBe(false);
  });

  it("arranca con el ejemplo y fuerza a guardarlo", () => {
    installStorage(countingStorage());
    const boot = bootstrapFlow("?demo=1", NOW);

    expect(boot.source).toBe("demo");
    expect(boot.state.step).toBe("families");
    expect(boot.storedFingerprint).toBeNull();
  });

  it("restaura el borrador guardado sin volver a escribirlo", () => {
    installStorage(countingStorage());
    const input = {
      eventData: {
        eventName: "Cumple",
        currency: "ARS",
        splitMode: "by-person" as const,
        families: DEMO_FAMILIES,
      },
      selectedMode: "by-person" as const,
      createdAt: NOW,
    };
    saveCurrentEventDraft(input);

    const boot = bootstrapFlow("", NOW);

    expect(boot.source).toBe("draft");
    expect(boot.state.step).toBe("results");
    expect(boot.storedFingerprint).toBe(getDraftFingerprint(input));
  });

  it("arranca vacío si no hay storage", () => {
    vi.stubGlobal("window", undefined);
    const boot = bootstrapFlow("", NOW);

    expect(boot.source).toBe("empty");
    expect(boot.state.step).toBe("setup");
  });
});

// ── Derivados ─────────────────────────────────────────────────────────────────

describe("deriveEventInsights", () => {
  it("resume la lista en una sola pasada", () => {
    const insights = deriveEventInsights(DEMO_FAMILIES);

    expect(insights.familyCount).toBe(5);
    expect(insights.eligibleFamilyCount).toBe(4);
    expect(insights.totalPaid).toBe(16000);
    expect(insights.canCalculate).toBe(true);
    expect(insights).toMatchObject({ adultCount: 7, familyMinorCount: 3, soloMinorCount: 0, guestMinorCount: 1 });
  });

  it("no permite calcular con una sola familia habilitada", () => {
    const insights = deriveEventInsights([
      family({ id: "a", adults: 3, paidAmount: 100 }),
      family({ id: "b", adults: 0, minors: 1 }),
    ]);

    expect(insights.canCalculate).toBe(false);
  });
});

describe("deriveSettlement", () => {
  it("calcula balances y transferencias del criterio confirmado", () => {
    const settlement = deriveSettlement(DEMO_FAMILIES, "ARS", "by-person");

    expect(settlement?.totalAmount).toBe(16000);
    expect(settlement?.transfers).toHaveLength(2);
  });

  it("devuelve null sin criterio confirmado", () => {
    expect(deriveSettlement(DEMO_FAMILIES, "ARS", null)).toBeNull();
  });
});

// ── Storage ───────────────────────────────────────────────────────────────────

describe("browserStorage", () => {
  it("sondea localStorage una sola vez por instancia", () => {
    const storage = installStorage(countingStorage());

    for (let i = 0; i < 10; i++) getBrowserStorage();

    // 1 escritura + 1 borrado de la clave de prueba, no 20 de cada una.
    expect(storage.calls.set).toBe(1);
    expect(storage.calls.remove).toBe(1);
  });
});

describe("closed events store", () => {
  function closedEvent(id: string): ClosedEvent {
    const settlement = deriveSettlement(DEMO_FAMILIES, "ARS", "by-person");
    if (!settlement) throw new Error("settlement esperado");

    return {
      id,
      eventName: "Asado del sábado",
      createdAt: NOW,
      closedAt: NOW,
      totalAmount: settlement.totalAmount,
      splitModeUsed: "by-person",
      familiesSnapshot: DEMO_FAMILIES,
      balancesSnapshot: settlement.balances,
      transfersSnapshot: settlement.transfers,
    };
  }

  it("notifica a los suscriptores y mantiene el snapshot estable", () => {
    installStorage(countingStorage());
    const listener = vi.fn();
    const unsubscribe = subscribeToClosedEvents(listener);

    const before = getClosedEventsSnapshot();
    expect(getClosedEventsSnapshot()).toBe(before);

    const result = saveClosedEvent(closedEvent("closed-1"));

    expect(result.saved).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(getClosedEventsSnapshot()).toBe(result.events);
    unsubscribe();
  });

  it("informa el fallo si el storage no acepta la escritura", () => {
    installStorage(countingStorage({ failWrites: true }));

    const result = saveClosedEvent(closedEvent("closed-2"));

    expect(result.saved).toBe(false);
    expect(result.events).toEqual([]);
  });

  it("no relee ni revalida el historial en cada guardado", () => {
    const storage = installStorage(countingStorage());

    saveClosedEvent(closedEvent("a"));
    saveClosedEvent(closedEvent("b"));
    saveClosedEvent(closedEvent("c"));

    expect(storage.calls.get).toBe(1);
    expect(getClosedEventsSnapshot().map((event) => event.id)).toEqual(["c", "b", "a"]);
  });
});

describe("getDraftFingerprint", () => {
  it("cambia con el contenido y no con el momento de guardado", () => {
    const input = {
      eventData: { eventName: "A", currency: "ARS", splitMode: null, families: [] },
      selectedMode: "by-person" as const,
      createdAt: NOW,
    };

    expect(getDraftFingerprint(input)).toBe(getDraftFingerprint({ ...input }));
    expect(getDraftFingerprint(input)).not.toBe(
      getDraftFingerprint({ ...input, eventData: { ...input.eventData, eventName: "B" } })
    );
    expect(CURRENT_DRAFT_STORAGE_KEY).toBe("quien-puso-que:current-draft");
  });
});

// ── Formato ───────────────────────────────────────────────────────────────────

describe("formatMoney", () => {
  it("muestra centavos solo cuando existen", () => {
    expect(formatMoney(8000)).toMatch(/^\$\s?8\.000$/);
    expect(formatMoney(1333.333)).toMatch(/1\.333,33$/);
    expect(formatCurrency(8000)).toMatch(/8\.000,00$/);
  });
});

// ── Foto del ticket ───────────────────────────────────────────────────────────

describe("computeCoverCrop", () => {
  it("recorta los costados de una foto apaisada", () => {
    const crop = computeCoverCrop(4000, 1000, 2);
    expect(crop).toEqual({ sx: 1000, sy: 0, sw: 2000, sh: 1000 });
  });

  it("recorta arriba y abajo de una foto vertical", () => {
    const crop = computeCoverCrop(1000, 3000, 2);
    expect(crop).toEqual({ sx: 0, sy: 1250, sw: 1000, sh: 500 });
  });

  it("no agranda imágenes chicas", () => {
    const crop = computeCoverCrop(600, 300, 2);
    expect(computeOutputSize(crop, 2, 1200)).toEqual({ width: 600, height: 300 });
    expect(computeOutputSize(computeCoverCrop(4000, 2000, 2), 2, 1200)).toEqual({
      width: 1200,
      height: 600,
    });
  });
});

describe("getUnitShare", () => {
  it("da lo que paga cada adulto", async () => {
    const { getUnitShare } = await import("@/lib/flow/eventInsights");
    const full = deriveSettlement(DEMO_FAMILIES, "ARS", "by-person");
    const zero = deriveSettlement(DEMO_FAMILIES, "ARS", "by-person-minors-zero");
    if (!full || !zero) throw new Error("settlement esperado");

    expect(getUnitShare(full)).toBe(1600);
    expect(getUnitShare(zero)).toBe(2285.71);
  });
});

describe("deriveModeComparison", () => {
  it("compara la cuota de cada familia con las tres respuestas sobre menores", async () => {
    const { deriveModeComparison } = await import("@/lib/flow/eventInsights");
    const rows = deriveModeComparison(DEMO_FAMILIES);

    expect(rows).toHaveLength(4);
    // García: 2 adultos y 2 menores. 100%: 4 × 1.600. 50%: 8,5 porciones →
    // 2 × 1.882,35 + 2 × 941,18. 0%: 16.000 ÷ 7 × 2.
    expect(rows[0]).toEqual({
      familyId: "demo-garcia",
      name: "Los García",
      isSoloMinor: false,
      shares: {
        "by-person": 6400,
        "by-person-minors-half": 5647.06,
        "by-person-minors-zero": 4571.42,
      },
    });
  });
});

describe("buildClosedEvent", () => {
  it("arma la foto del evento desde el settlement confirmado", async () => {
    const { buildClosedEvent } = await import("@/lib/flow/closedEvent");
    const settlement = deriveSettlement(DEMO_FAMILIES, "ARS", "by-person");
    if (!settlement) throw new Error("settlement esperado");

    const event = buildClosedEvent({
      id: "x",
      closedAt: NOW,
      state: {
        createdAt: NOW,
        eventData: { eventName: "  ", currency: "ARS", splitMode: "by-person", families: DEMO_FAMILIES },
      },
      settlement,
    });

    expect(event.eventName).toBe("Evento sin nombre");
    expect(event.totalAmount).toBe(16000);
    expect(event.splitModeUsed).toBe("by-person");
  });
});

describe("parseFamilyForm", () => {
  it("valida nombre y cada cosa cargada", async () => {
    const { emptyFamilyFormValues, parseFamilyForm } = await import("@/lib/forms/familyForm");

    const values = emptyFamilyFormValues();
    const result = parseFamilyForm({
      ...values,
      adults: 1,
      items: [{ ...values.items[0], description: "Hielo", amount: "" }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual(["items", "name"]);
      expect(result.errors.items?.[values.items[0].key]).toMatch(/Cuánto salió/);
    }
  });

  it("pide al menos una persona y cuenta adultos y menores dentro del tope", async () => {
    const { changePeople, emptyFamilyFormValues, parseFamilyForm } = await import("@/lib/forms/familyForm");
    const { MAX_PEOPLE_PER_KIND } = await import("@/lib/calculations/eligibility");

    const empty = { ...emptyFamilyFormValues(), name: "Nadie", adults: 0, minors: 0 };
    const result = parseFamilyForm(empty);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.people).toBe("Sumá al menos un adulto o un menor.");

    let values = emptyFamilyFormValues();
    values = changePeople(values, "adults", -1);
    values = changePeople(values, "minors", 1);
    values = changePeople(values, "minors", 1);
    expect([values.adults, values.minors]).toEqual([1, 2]);
    expect(changePeople({ ...values, minors: 0 }, "minors", -1).minors).toBe(0);
    expect(changePeople({ ...values, adults: MAX_PEOPLE_PER_KIND }, "adults", 1).adults).toBe(MAX_PEOPLE_PER_KIND);

    const family = parseFamilyForm({ ...values, name: "Los Pérez" });
    expect(family.ok && family.family).toMatchObject({ adults: 1, minors: 2, paidAmount: 0 });
  });

  it("bloquea el monto de una familia sin adultos en 0 y acepta coma decimal", async () => {
    const { parseFamilyForm, parseAmount } = await import("@/lib/forms/familyForm");

    const minor = parseFamilyForm({
      name: " Juli ",
      adults: 0,
      minors: 1,
      paysOwnShare: false,
      items: [{ key: "1", description: "Globos", amount: "999" }],
    });
    expect(minor).toEqual({
      ok: true,
      family: { name: "Juli", adults: 0, minors: 1, paysOwnShare: undefined, paidAmount: 0, items: undefined },
    });
    expect(parseAmount("2500,5")).toBe(2500.5);
    expect(parseAmount("-1")).toBeNull();
  });
});

describe("calculator resume script", () => {
  it("usa la misma clave de storage y detecta ?demo", async () => {
    const { CALCULATOR_RESUME_SCRIPT, shouldResumeCalculator } = await import(
      "@/lib/flow/bootstrapFlow"
    );
    expect(CALCULATOR_RESUME_SCRIPT).toContain(JSON.stringify(CURRENT_DRAFT_STORAGE_KEY));

    const attributes = new Map<string, string>();
    const run = (search: string, stored: string | null) => {
      attributes.clear();
      new Function("location", "localStorage", "document", CALCULATOR_RESUME_SCRIPT)(
        { search },
        { getItem: () => stored },
        { documentElement: { setAttribute: (k: string, v: string) => attributes.set(k, v) } }
      );
      return attributes.has("data-calc-resume");
    };

    expect(run("", null)).toBe(false);
    expect(run("?demo=1", null)).toBe(true);
    expect(run("?demonio=1", null)).toBe(false);
    expect(run("", "{}")).toBe(true);

    installStorage(countingStorage());
    expect(shouldResumeCalculator("?demo")).toBe(true);
    expect(shouldResumeCalculator("")).toBe(false);
  });
});
