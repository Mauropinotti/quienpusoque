import { afterEach, describe, expect, it, vi } from "vitest";
import type { EventSnapshot } from "@/types/event";
import type { Family } from "@/types/family";
import {
  MAX_CONTRIBUTION_ITEMS,
  buildContributionsById,
  getContributionLabel,
  sumContributionItems,
  toContributionFields,
} from "@/lib/calculations/contributions";
import {
  addContributionRow,
  emptyFamilyFormValues,
  familyToFormValues,
  getFormTotal,
  parseFamilyForm,
  removeContributionRow,
  updateContributionRow,
  type FamilyFormValues,
} from "@/lib/forms/familyForm";
import { isValidFamily, normalizeFamily } from "@/lib/storage/validators";
import {
  CURRENT_DRAFT_STORAGE_KEY,
  readCurrentEventDraft,
} from "@/lib/storage/localEventStorage";
import { DEMO_FAMILIES } from "@/lib/flow/demoEvent";
import { deriveSettlement } from "@/lib/flow/eventInsights";
import { createEmptyFlowState, eventFlowReducer } from "@/lib/flow/eventFlow";
import { generateWhatsappText } from "@/lib/text/generateWhatsappText";
import { buildEventTicketPdf } from "@/lib/pdf/generateEventTicketPdf";
import {
  EVENT_FILE_FORMAT,
  IMPORT_ERRORS,
  buildEventExportFile,
  buildEventExportFileName,
  buildEventSnapshot,
  parseEventExportFile,
  serializeEventExportFile,
} from "@/lib/exchange/eventFile";

const NOW = "2026-11-16T15:00:00.000Z";

afterEach(() => {
  vi.unstubAllGlobals();
});

function formWith(rows: Array<[string, string]>, overrides: Partial<FamilyFormValues> = {}) {
  return {
    ...emptyFamilyFormValues(),
    name: "Los Pérez",
    items: rows.map(([description, amount], index) => ({
      key: String(index + 1),
      description,
      amount,
    })),
    ...overrides,
  } satisfies FamilyFormValues;
}

function snapshot(overrides: Partial<EventSnapshot> = {}): EventSnapshot {
  return {
    eventName: "Asado del sábado",
    currency: "ARS",
    createdAt: NOW,
    splitMode: null,
    selectedMode: "by-family",
    recommendationAccepted: null,
    families: DEMO_FAMILIES,
    ...overrides,
  };
}

function fileText(event: unknown, extra: Record<string, unknown> = {}): string {
  return JSON.stringify({ format: EVENT_FILE_FORMAT, version: 1, exportedAt: NOW, event, ...extra });
}

describe("contributions", () => {
  it("suma las cosas sin arrastrar errores de punto flotante", () => {
    expect(
      sumContributionItems([
        { description: "Pan", amount: 0.1 },
        { description: "Sal", amount: 0.2 },
      ])
    ).toBe(0.3);
    expect(sumContributionItems([])).toBe(0);
  });

  it("guarda un monto suelto sin desglose y varias cosas con su total", () => {
    expect(toContributionFields([{ description: "", amount: 5000 }])).toEqual({
      paidAmount: 5000,
      items: undefined,
    });
    expect(
      toContributionFields([
        { description: " Carne ", amount: 10000 },
        { description: "Hielo", amount: 2000 },
      ])
    ).toEqual({
      paidAmount: 12000,
      items: [
        { description: "Carne", amount: 10000 },
        { description: "Hielo", amount: 2000 },
      ],
    });
  });

  it("nombra las cosas sin descripción y las indexa por familia", () => {
    expect(getContributionLabel({ description: "  ", amount: 1 })).toBe("Sin detalle");
    const byId = buildContributionsById(DEMO_FAMILIES);
    expect(byId.get("demo-garcia")?.map((item) => item.description)).toEqual(["Carne", "Carbón"]);
    expect(byId.has("demo-lopez")).toBe(false);
  });

  it("el evento de ejemplo cumple total = suma de lo que puso", () => {
    for (const family of DEMO_FAMILIES) {
      if (family.items) expect(sumContributionItems(family.items)).toBe(family.paidAmount);
    }
  });
});

describe("familyForm: cosas que puso", () => {
  it("calcula el total sumando cada cosa e ignora filas vacías", () => {
    const result = parseFamilyForm(
      formWith([
        ["Carne", "10000"],
        ["", ""],
        ["Hielo", "2000,5"],
      ])
    );

    expect(result).toEqual({
      ok: true,
      family: {
        name: "Los Pérez",
        members: 2,
        singleMemberType: null,
        paidAmount: 12000.5,
        items: [
          { description: "Carne", amount: 10000 },
          { description: "Hielo", amount: 2000.5 },
        ],
      },
    });
  });

  it("sin nada cargado la familia puso $0", () => {
    const result = parseFamilyForm(formWith([["", ""]]));
    expect(result.ok && result.family).toMatchObject({ paidAmount: 0, items: undefined });
  });

  it("marca el error en la fila que corresponde", () => {
    const result = parseFamilyForm(
      formWith([
        ["Carne", "10000"],
        ["Hielo", ""],
        ["Pan", "abc"],
      ])
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.items).toEqual({
        "2": "¿Cuánto salió? Si no costó nada, poné 0.",
        "3": "Ingresá un monto válido.",
      });
    }
  });

  it("suma en vivo solo los montos que ya se pueden leer", () => {
    expect(getFormTotal(formWith([["Carne", "1000"], ["Hielo", ""], ["Pan", "250,5"]]))).toBe(1250.5);
    expect(
      getFormTotal(formWith([["Globos", "999"]], { members: 1, singleMemberType: "minor" }))
    ).toBe(0);
  });

  it("agrega, edita y quita filas con claves únicas y deja siempre una", () => {
    let values = emptyFamilyFormValues();
    values = addContributionRow(values);
    values = addContributionRow(values);
    expect(values.items.map((row) => row.key)).toEqual(["1", "2", "3"]);

    values = updateContributionRow(values, "2", { description: "Hielo", amount: "$ 2.000x" });
    expect(values.items[1]).toEqual({ key: "2", description: "Hielo", amount: "2.000" });

    values = removeContributionRow(values, "3");
    values = addContributionRow(values);
    expect(new Set(values.items.map((row) => row.key)).size).toBe(values.items.length);

    let single = emptyFamilyFormValues();
    single = updateContributionRow(single, "1", { description: "Carne" });
    single = removeContributionRow(single, "1");
    expect(single.items).toHaveLength(1);
    expect(single.items[0].description).toBe("");
  });

  it("no pasa del máximo de cosas por familia", () => {
    let values = emptyFamilyFormValues();
    for (let i = 0; i < MAX_CONTRIBUTION_ITEMS + 3; i += 1) values = addContributionRow(values);
    expect(values.items).toHaveLength(MAX_CONTRIBUTION_ITEMS);
  });

  it("al editar recupera el desglose, o el total suelto en una fila", () => {
    const garcia = DEMO_FAMILIES[0];
    expect(familyToFormValues(garcia).items).toEqual([
      { key: "1", description: "Carne", amount: "6500" },
      { key: "2", description: "Carbón", amount: "1500" },
    ]);

    const plain: Family = { ...garcia, items: undefined, paidAmount: 4000 };
    expect(familyToFormValues(plain).items).toEqual([{ key: "1", description: "", amount: "4000" }]);

    // Editar y dejar un monto suelto borra el desglose anterior.
    const edited = parseFamilyForm({ ...familyToFormValues(garcia), items: [{ key: "1", description: "", amount: "9000" }] });
    expect(edited.ok && { ...garcia, ...edited.family }).toMatchObject({ paidAmount: 9000, items: undefined });
  });
});

describe("storage: familias con desglose", () => {
  const base = { id: "a", name: "Los Pérez", members: 2, singleMemberType: null };

  it("valida cada cosa guardada", () => {
    expect(isValidFamily({ ...base, paidAmount: 10, items: [{ description: "Pan", amount: 10 }] })).toBe(true);
    expect(isValidFamily({ ...base, paidAmount: 10, items: [{ description: "Pan", amount: -1 }] })).toBe(false);
    expect(isValidFamily({ ...base, paidAmount: 10, items: [{ amount: 10 }] })).toBe(false);
    expect(isValidFamily({ ...base, paidAmount: 10, items: "pan" })).toBe(false);
    expect(
      isValidFamily({
        ...base,
        paidAmount: 0,
        items: Array.from({ length: MAX_CONTRIBUTION_ITEMS + 1 }, () => ({ description: "x", amount: 0 })),
      })
    ).toBe(false);
  });

  it("recalcula el total desde el desglose y no confía en lo guardado", () => {
    const family = normalizeFamily({
      ...base,
      paidAmount: 999999,
      items: [
        { description: "Carne", amount: 10000 },
        { description: "Hielo", amount: 2000 },
      ],
    });
    expect(family.paidAmount).toBe(12000);
  });

  it("convierte la nota libre de versiones anteriores en el único ítem", () => {
    const legacy = { ...base, paidAmount: 8000, notes: "Carne y carbón" } as Family;
    expect(normalizeFamily(legacy)).toEqual({
      ...base,
      paidAmount: 8000,
      items: [{ description: "Carne y carbón", amount: 8000 }],
    });
  });

  it("un menor solo queda en $0 y sin desglose", () => {
    const minor = normalizeFamily({
      ...base,
      members: 1,
      singleMemberType: "minor",
      paidAmount: 500,
      items: [{ description: "Globos", amount: 500 }],
    });
    expect(minor).toEqual({ ...base, members: 1, singleMemberType: "minor", paidAmount: 0 });
  });

  it("un borrador viejo con notas se recupera con el desglose", () => {
    const data = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => data.get(key) ?? null,
        setItem: (key: string, value: string) => void data.set(key, value),
        removeItem: (key: string) => void data.delete(key),
      },
    });
    data.set(
      CURRENT_DRAFT_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        eventName: "Asado",
        currency: "ARS",
        createdAt: NOW,
        families: [{ ...base, paidAmount: 3000, notes: "Bebidas" }],
        selectedMode: "by-family",
        splitMode: null,
        recommendationAccepted: null,
        updatedAt: NOW,
      })
    );

    expect(readCurrentEventDraft()?.families[0].items).toEqual([{ description: "Bebidas", amount: 3000 }]);
  });
});

describe("salidas con el desglose", () => {
  const settlement = deriveSettlement(DEMO_FAMILIES, "ARS", "by-family")!;

  it("WhatsApp muestra lo que puso cada uno, cosa por cosa", () => {
    const text = generateWhatsappText({
      eventName: "Asado del sábado",
      currency: "ARS",
      splitMode: "by-family",
      families: DEMO_FAMILIES,
      balances: settlement.balances,
      transfers: settlement.transfers,
    });
    const lines = text.split("\n");
    const start = lines.indexOf("Lo que puso cada uno:");

    expect(start).toBeGreaterThan(-1);
    expect(lines.slice(start + 1, start + 10).map((line) => line.replace(/ /g, " "))).toEqual([
      "- Los García: $ 8.000",
      "   · Carne: $ 6.500",
      "   · Carbón: $ 1.500",
      "- Los Rodríguez: $ 3.000 (Bebidas)",
      "- Los López: $ 0",
      "- Los Fernández: $ 5.000",
      "   · Ensaladas: $ 2.500",
      "   · Pan: $ 1.200",
      "   · Hielo: $ 1.300",
    ]);
    // El menor solo sigue en su propia sección.
    expect(lines.slice(start, start + 11).join("\n")).not.toContain("Los Martínez");
    expect(start).toBeLessThan(lines.indexOf("Transferencias sugeridas:"));
  });

  it("WhatsApp omite la sección si nadie cargó desglose ni hay aportantes", () => {
    const text = generateWhatsappText({
      eventName: "Asado",
      currency: "ARS",
      splitMode: "by-family",
      families: [],
      balances: [],
      transfers: [],
    });
    expect(text).not.toContain("Lo que puso cada uno:");
  });

  it("el PDF lista cada cosa con su monto debajo de la familia", () => {
    const doc = buildEventTicketPdf({
      appName: "¿Quién puso qué?",
      eventName: "Asado del sábado",
      currency: "ARS",
      generatedAt: new Date(NOW),
      splitMode: "by-family",
      families: DEMO_FAMILIES,
      balances: settlement.balances,
      transfers: settlement.transfers,
      recommendation: null,
    });
    const content = doc.output();

    for (const text of ["Carne", "Bebidas", "Ensaladas", "Pan", "Hielo", "6.500,00", "1.300,00"]) {
      expect(content).toContain(text);
    }
  });
});

describe("exportar e importar el cálculo", () => {
  it("lo exportado se importa igual", () => {
    const original = snapshot({ splitMode: "by-person", selectedMode: "by-person", recommendationAccepted: false });
    const text = serializeEventExportFile(buildEventExportFile(original, NOW));
    const result = parseEventExportFile(text);

    expect(result).toEqual({ ok: true, event: original });
    expect(JSON.parse(text)).toMatchObject({ format: "quien-puso-que/calculo", version: 1, exportedAt: NOW });
  });

  it("arma el snapshot desde el estado del flujo", () => {
    const state = createEmptyFlowState(NOW);
    const event = buildEventSnapshot({
      ...state,
      eventData: { ...state.eventData, eventName: "Cumple", families: DEMO_FAMILIES },
    });
    expect(event).toMatchObject({ eventName: "Cumple", currency: "ARS", createdAt: NOW, splitMode: null });
    expect(event.families).toBe(DEMO_FAMILIES);
  });

  it("nombra el archivo como el PDF, con extensión .json", () => {
    expect(buildEventExportFileName("Asado del sábado", new Date(2026, 10, 16))).toBe(
      "quien-puso-que-asado-del-sabado-2026-11-16.json"
    );
    expect(buildEventExportFileName("", new Date(2026, 0, 2))).toBe("quien-puso-que-evento-2026-01-02.json");
  });

  it("rechaza archivos que no son un cálculo", () => {
    expect(parseEventExportFile("no es json")).toEqual({ ok: false, error: IMPORT_ERRORS.notAnEventFile });
    expect(parseEventExportFile(JSON.stringify({ hola: 1 }))).toEqual({
      ok: false,
      error: IMPORT_ERRORS.notAnEventFile,
    });
    expect(parseEventExportFile(fileText(snapshot(), { version: 2 }))).toEqual({
      ok: false,
      error: IMPORT_ERRORS.newerVersion,
    });
  });

  it("no carga nada si el contenido está dañado", () => {
    const damaged = [
      snapshot({ currency: "PESOS" }),
      snapshot({ createdAt: "ayer" }),
      { ...snapshot(), selectedMode: "a-ojo" },
      { ...snapshot(), families: [{ id: "x", name: "", members: 2, singleMemberType: null, paidAmount: 0 }] },
      snapshot({ families: [DEMO_FAMILIES[0], DEMO_FAMILIES[0]] }),
      { ...snapshot(), families: "muchas" },
    ];

    for (const event of damaged) {
      expect(parseEventExportFile(fileText(event))).toEqual({ ok: false, error: IMPORT_ERRORS.damaged });
    }
  });

  it("pone al día familias de versiones anteriores y re-suma totales", () => {
    const result = parseEventExportFile(
      fileText(
        snapshot({
          families: [
            { id: "a", name: "Los Pérez", members: 2, singleMemberType: null, paidAmount: 1, items: [{ description: "Pan", amount: 700 }, { description: "Hielo", amount: 300 }] },
            { id: "b", name: "Juli", members: 1, singleMemberType: "minor", paidAmount: 900 },
            { id: "c", name: "Los Gómez", members: 3, singleMemberType: null, paidAmount: 2000, notes: "Vino" } as Family,
          ],
        })
      )
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.event.families.map((family) => family.paidAmount)).toEqual([1000, 0, 2000]);
      expect(result.event.families[2].items).toEqual([{ description: "Vino", amount: 2000 }]);
    }
  });

  it("el reducer retoma lo importado en la carga de familias", () => {
    const current = {
      ...createEmptyFlowState("2026-01-01T00:00:00.000Z"),
      step: "results" as const,
      savedClosedEventId: "viejo",
    };
    const imported = snapshot({ splitMode: "by-person", selectedMode: "by-person", recommendationAccepted: true });
    const next = eventFlowReducer(current, { type: "event-imported", event: imported });

    expect(next.step).toBe("families");
    expect(next.eventData).toEqual({
      eventName: "Asado del sábado",
      currency: "ARS",
      splitMode: "by-person",
      families: DEMO_FAMILIES,
    });
    expect(next.createdAt).toBe(NOW);
    expect(next.selectedMode).toBe("by-person");
    expect(next.recommendationAccepted).toBe(true);
    expect(next.savedClosedEventId).toBeNull();
    expect(next.ticketPhoto).toBeNull();

    const empty = eventFlowReducer(current, {
      type: "event-imported",
      event: snapshot({ eventName: " ", families: [] }),
    });
    expect(empty.step).toBe("setup");
  });
});
