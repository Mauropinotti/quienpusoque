import { describe, expect, it } from "vitest";
import type { Family, SplitMode } from "@/types/family";
import { calculateBalances } from "@/lib/calculations/calculateBalances";
import { calculateTransfers } from "@/lib/calculations/calculateTransfers";
import { computeAllEligibility, validateFamily } from "@/lib/calculations/eligibility";
import { getSplitBasis, isPersonSplitMode } from "@/lib/calculations/splitModes";
import { createEmptyFlowState, eventFlowReducer } from "@/lib/flow/eventFlow";
import { deriveModeComparison, derivePersonModePreviews, deriveSettlement } from "@/lib/flow/eventInsights";
import { DEMO_FAMILIES } from "@/lib/flow/demoEvent";
import { isValidFamily, normalizeFamily } from "@/lib/storage/validators";
import { parseEventExportFile } from "@/lib/exchange/eventFile";
import {
  describeComposition,
  describeFamilyShare,
  describeSplitSteps,
  describeUnitShares,
} from "@/lib/text/describeSplit";
import { generateWhatsappText } from "@/lib/text/generateWhatsappText";
import { buildEventTicketPdf } from "@/lib/pdf/generateEventTicketPdf";
import { formatMoney } from "@/lib/formatting/formatCurrency";

const NOW = "2026-11-16T15:00:00.000Z";
const plain = (text: string) => text.replace(/ /g, " ");
const money = (amount: number) => plain(formatMoney(amount));

function family(id: string, adults: number, minors: number, paidAmount = 0): Family {
  return { id, name: `Familia ${id}`, adults, minors, paidAmount };
}

/** El ejemplo del pedido: 6 adultos y 2 menores en familias que aportan, $ 12.000. */
const GROUP: Family[] = [
  family("perez", 2, 1, 9000),
  family("gomez", 2, 1, 3000),
  family("ana", 1, 0),
  family("ruiz", 1, 0),
  family("juli", 0, 1),
];

function settle(families: Family[], mode: SplitMode) {
  const result = calculateBalances({ eventName: "", currency: "ARS", splitMode: mode, families });
  if (!result.ok) throw new Error(result.errors[0].message);
  return result.data;
}

const shares = (families: Family[], mode: SplitMode) =>
  Object.fromEntries(settle(families, mode).balances.map((b) => [b.familyId, b.expectedShare]));

describe("adultos y menores", () => {
  it("una familia sin adultos no aporta y sus menores no entran en la cuenta", () => {
    const [, , , , juli] = computeAllEligibility(GROUP);
    expect(juli).toMatchObject({ isEligibleToPay: false, eligiblePersons: 0 });

    for (const mode of ["by-family", "by-person", "by-person-minors-half", "by-person-minors-zero"] as const) {
      const data = settle(GROUP, mode);
      expect(data.breakdown).toMatchObject({ contributingFamilies: 4, adults: 6, minors: 2 });
      expect(data.balances.find((b) => b.familyId === "juli")).toMatchObject({ expectedShare: 0, status: "guest" });
    }
  });

  it("valida la composición y el monto de una familia sin adultos", () => {
    expect(validateFamily(family("x", 0, 0))[0]?.code).toBe("MEMBERS_OUT_OF_RANGE");
    expect(validateFamily(family("x", 21, 0))[0]?.code).toBe("MEMBERS_OUT_OF_RANGE");
    expect(validateFamily(family("x", 1.5, 0))[0]?.code).toBe("MEMBERS_OUT_OF_RANGE");
    expect(validateFamily(family("x", 0, 2, 100))[0]?.code).toBe("GUEST_PAID_AMOUNT");
    expect(validateFamily(family("x", 0, 2))).toEqual([]);
  });

  it("describe la composición en castellano", () => {
    expect(describeComposition({ adults: 2, minors: 1 })).toBe("2 adultos y 1 menor");
    expect(describeComposition({ adults: 1, minors: 0 })).toBe("1 adulto");
    expect(describeComposition({ adults: 0, minors: 3 })).toBe("3 menores");
  });
});

describe("criterios de reparto", () => {
  it("por familia: partes iguales por familia que aporta, sin mirar menores", () => {
    expect(shares(GROUP, "by-family")).toEqual({ perez: 3000, gomez: 3000, ana: 3000, ruiz: 3000, juli: 0 });
  });

  it("1) por persona, todos iguales: total ÷ (adultos + menores)", () => {
    const data = settle(GROUP, "by-person");
    expect(data.breakdown).toMatchObject({ personShare: 1500, adultShare: 1500, minorShare: 1500, minorsUnpaid: 0 });
    expect(shares(GROUP, "by-person")).toEqual({ perez: 4500, gomez: 4500, ana: 1500, ruiz: 1500, juli: 0 });
  });

  it("2) menores al 50%: lo que no pagan se reparte entre los adultos", () => {
    const { breakdown } = settle(GROUP, "by-person-minors-half");

    // Parte igual 12.000 ÷ 8 = 1.500; cada menor paga 750; los 2 menores dejan
    // 1.500 sin pagar, que se reparten entre 6 adultos: 250 más cada uno.
    expect(breakdown).toMatchObject({
      personShare: 1500,
      minorRatio: 0.5,
      minorShare: 750,
      minorsUnpaid: 1500,
      adultSurcharge: 250,
      adultShare: 1750,
    });
    const result = shares(GROUP, "by-person-minors-half");
    expect(result).toEqual({ perez: 4250, gomez: 4250, ana: 1750, ruiz: 1750, juli: 0 });
    expect(Object.values(result).reduce((a, b) => a + b, 0)).toBe(12000);
  });

  it("3) menores al 0%: el total se divide entre los adultos", () => {
    const { breakdown } = settle(GROUP, "by-person-minors-zero");
    expect(breakdown).toMatchObject({ adultShare: 2000, minorShare: 0, minorRatio: 0 });
    expect(shares(GROUP, "by-person-minors-zero")).toEqual({ perez: 4000, gomez: 4000, ana: 2000, ruiz: 2000, juli: 0 });
  });

  it("sin menores las tres respuestas dan lo mismo", () => {
    const adultsOnly = [family("a", 2, 0, 9000), family("b", 1, 0)];
    const results = (["by-person", "by-person-minors-half", "by-person-minors-zero"] as const).map((mode) =>
      shares(adultsOnly, mode)
    );
    expect(results[1]).toEqual(results[0]);
    expect(results[2]).toEqual(results[0]);
  });

  it("redondea cada paso a centavos y las transferencias cierran en pesos", () => {
    const group = [family("a", 2, 1, 10000), family("b", 1, 0)];
    const data = settle(group, "by-person-minors-half");
    expect(data.breakdown).toMatchObject({
      personShare: 2500,
      minorShare: 1250,
      minorsUnpaid: 1250,
      adultSurcharge: 416.67,
      adultShare: 2916.67,
    });
    // 2 × 2.916,67 + 1 × 1.250 = 7.083,34; 1 × 2.916,67. Suman 10.000,01.
    expect(shares(group, "by-person-minors-half")).toEqual({ a: 7083.34, b: 2916.67 });
    const { transfers, roundingDiscrepancy } = calculateTransfers(data.balances);
    expect(transfers).toEqual([
      { fromFamilyId: "b", fromFamilyName: "Familia b", toFamilyId: "a", toFamilyName: "Familia a", amount: 2917 },
    ]);
    expect(Math.abs(roundingDiscrepancy)).toBeLessThanOrEqual(1);
  });

  it("agrupa los tres criterios por persona bajo la misma base", () => {
    expect(getSplitBasis("by-person-minors-half")).toBe("by-person");
    expect(getSplitBasis("by-family")).toBe("by-family");
    expect(isPersonSplitMode("by-person-minors-zero")).toBe(true);
    expect(isPersonSplitMode("by-family")).toBe(false);
  });
});

describe("el cálculo queda explícito", () => {
  const { breakdown } = settle(GROUP, "by-person-minors-half");

  it("describe cada paso con los montos que ya aparecieron", () => {
    expect(describeSplitSteps(breakdown, money)).toEqual([
      "6 adultos + 2 menores = 8 personas",
      "Parte igual: $ 12.000 ÷ 8 = $ 1.500 por persona",
      "Cada menor paga el 50%: $ 750",
      "Lo que no pagan los menores: 2 × $ 750 = $ 1.500",
      "Se reparte entre los 6 adultos: $ 1.500 ÷ 6 = $ 250 más cada uno",
      "Cada adulto paga: $ 1.500 + $ 250 = $ 1.750",
    ]);
    expect(describeSplitSteps(settle(GROUP, "by-person-minors-zero").breakdown, money)).toEqual([
      "$ 12.000 ÷ 6 adultos = $ 2.000 por adulto",
      "Los 2 menores no pagan",
    ]);
    expect(describeSplitSteps(settle(GROUP, "by-family").breakdown, money)).toEqual([
      "$ 12.000 ÷ 4 familias = $ 3.000 por familia",
    ]);
  });

  it("arma la cuenta de cada familia", () => {
    expect(describeFamilyShare(GROUP[0], breakdown, money)).toBe("2 adultos × $ 1.750 + 1 menor × $ 750");
    expect(describeFamilyShare(GROUP[2], breakdown, money)).toBe("1 adulto × $ 1.750");
    expect(describeFamilyShare(GROUP[4], breakdown, money)).toBeNull();
    const zero = settle(GROUP, "by-person-minors-zero").breakdown;
    expect(describeFamilyShare(GROUP[0], zero, money)).toBe("2 adultos × $ 2.000 + 1 menor × $ 0");
    expect(describeUnitShares(breakdown, money)).toBe("$ 1.750 c/ adulto · $ 750 c/ menor");
  });

  it("WhatsApp muestra los pasos y lo que le toca a cada familia", () => {
    const settlement = deriveSettlement(GROUP, "ARS", "by-person-minors-half")!;
    const text = plain(
      generateWhatsappText({
        eventName: "Asado",
        currency: "ARS",
        splitMode: "by-person-minors-half",
        families: GROUP,
        breakdown: settlement.breakdown,
        balances: settlement.balances,
        transfers: settlement.transfers,
      })
    );

    expect(text).toContain("Criterio usado: por persona, menores al 50%");
    expect(text).toContain("Cómo se calculó:\n- 6 adultos + 2 menores = 8 personas");
    expect(text).toContain("- Se reparte entre los 6 adultos: $ 1.500 ÷ 6 = $ 250 más cada uno");
    expect(text).toContain("Le toca a cada familia:\n- Familia perez: 2 adultos × $ 1.750 + 1 menor × $ 750 = $ 4.250");
    expect(text).toContain("No aportan (sin adultos):\n- Familia juli: 1 menor, sin cargo");
  });

  it("el PDF incluye los pasos del cálculo", () => {
    const settlement = deriveSettlement(GROUP, "ARS", "by-person-minors-half")!;
    const content = buildEventTicketPdf({
      appName: "¿Quién puso qué?",
      eventName: "Asado",
      currency: "ARS",
      generatedAt: new Date(NOW),
      splitMode: "by-person-minors-half",
      families: GROUP,
      balances: settlement.balances,
      transfers: settlement.transfers,
      breakdown: settlement.breakdown,
      recommendation: null,
    }).output();

    for (const text of ["Cada adulto paga", "1.750,00", "Adul.", "Men.", "Le toca"]) {
      expect(content).toContain(text);
    }
  });
});

describe("decidir en la mesa", () => {
  it("compara por familia contra por persona con la regla de menores elegida", () => {
    const half = deriveModeComparison(GROUP, "by-person-minors-half");
    expect(half.find((row) => row.familyId === "perez")).toMatchObject({ byFamily: 3000, byPerson: 4250 });
    const previews = derivePersonModePreviews(GROUP);
    expect(previews["by-person-minors-zero"].adultShare).toBe(2000);
    expect(previews["by-person"].personShare).toBe(1500);
  });

  it("aceptar la sugerencia depende de la base, no de cómo pagan los menores", () => {
    let state = eventFlowReducer(createEmptyFlowState(NOW), { type: "demo-loaded", now: NOW });
    state = eventFlowReducer(state, { type: "recommendation-opened", recommendedMode: "by-person" });
    state = eventFlowReducer(state, { type: "mode-selected", mode: "by-person-minors-half" });
    const confirmed = eventFlowReducer(state, { type: "mode-confirmed", recommendedMode: "by-person" });
    expect(confirmed.recommendationAccepted).toBe(true);
    expect(confirmed.eventData.splitMode).toBe("by-person-minors-half");

    // Volver a abrir la sugerencia no pisa la respuesta sobre menores.
    const reopened = eventFlowReducer(confirmed, { type: "recommendation-opened", recommendedMode: "by-person" });
    expect(reopened.selectedMode).toBe("by-person-minors-half");
    const byFamily = eventFlowReducer(confirmed, { type: "recommendation-opened", recommendedMode: "by-family" });
    expect(byFamily.selectedMode).toBe("by-family");
  });

  it("el ejemplo tiene 7 adultos y 3 menores que aportan, y un menor solo invitado", () => {
    const data = settle(DEMO_FAMILIES, "by-person");
    expect(data.breakdown).toMatchObject({ adults: 7, minors: 3, contributingFamilies: 4 });
    expect(data.balances.find((b) => b.familyId === "demo-martinez")?.status).toBe("guest");
  });
});

describe("datos de versiones anteriores", () => {
  const legacy = (members: number, singleMemberType: "adult" | "minor" | null, paidAmount = 0) => ({
    id: `l${members}${singleMemberType ?? ""}`,
    name: "Vieja",
    members,
    singleMemberType,
    paidAmount,
  });

  it("acepta integrantes sin distinguir y los pasa a adultos y menores", () => {
    expect(isValidFamily(legacy(3, null))).toBe(true);
    expect(isValidFamily(legacy(1, null))).toBe(false);
    expect(normalizeFamily(legacy(3, null, 900) as never)).toEqual({ id: "l3", name: "Vieja", adults: 3, minors: 0, paidAmount: 900 });
    expect(normalizeFamily(legacy(1, "adult") as never)).toMatchObject({ adults: 1, minors: 0 });
    expect(normalizeFamily(legacy(1, "minor", 500) as never)).toMatchObject({ adults: 0, minors: 1, paidAmount: 0 });
  });

  it("rechaza composiciones imposibles en el formato nuevo", () => {
    const base = { id: "x", name: "X", paidAmount: 0 };
    expect(isValidFamily({ ...base, adults: 0, minors: 0 })).toBe(false);
    expect(isValidFamily({ ...base, adults: -1, minors: 2 })).toBe(false);
    expect(isValidFamily({ ...base, adults: 2 })).toBe(false);
    expect(isValidFamily({ ...base, adults: 2, minors: 1 })).toBe(true);
  });

  it("importa archivos de la versión 1 con familias del formato anterior", () => {
    const file = JSON.stringify({
      format: "quien-puso-que/calculo",
      version: 1,
      exportedAt: NOW,
      event: {
        eventName: "Asado viejo",
        currency: "ARS",
        createdAt: NOW,
        splitMode: "by-person",
        selectedMode: "by-person",
        recommendationAccepted: null,
        families: [legacy(4, null, 8000), legacy(1, "minor")],
      },
    });
    const result = parseEventExportFile(file);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.event.families.map((f) => [f.adults, f.minors])).toEqual([[4, 0], [0, 1]]);
    }
  });
});
