import { afterEach, describe, expect, it, vi } from "vitest";
import type { Family, SplitMode } from "@/types/family";
import { calculateBalances } from "@/lib/calculations/calculateBalances";
import { calculateTransfers } from "@/lib/calculations/calculateTransfers";
import {
  computeAllEligibility,
  isGuestFamily,
  isPayingSoloMinorFamily,
  validateFamily,
} from "@/lib/calculations/eligibility";
import { deriveModeComparison, deriveModePreviews, deriveSettlement } from "@/lib/flow/eventInsights";
import { DEMO_FAMILIES } from "@/lib/flow/demoEvent";
import { isValidFamily, normalizeFamily } from "@/lib/storage/validators";
import { CURRENT_DRAFT_STORAGE_KEY, readCurrentEventDraft } from "@/lib/storage/localEventStorage";
import { CLOSED_EVENTS_STORAGE_KEY, readClosedEvents } from "@/lib/storage/closedEventsStorage";
import { parseEventExportFile } from "@/lib/exchange/eventFile";
import { asksIfMinorsPay, emptyFamilyFormValues, parseFamilyForm } from "@/lib/forms/familyForm";
import {
  describeComposition,
  describeFamilyShare,
  describeSplitSteps,
  describeTransfer,
  describeUnitShares,
  getSoloMinorIds,
  splitModeLabel,
} from "@/lib/text/describeSplit";
import { generateWhatsappText } from "@/lib/text/generateWhatsappText";
import { buildEventTicketPdf } from "@/lib/pdf/generateEventTicketPdf";
import { formatMoney } from "@/lib/formatting/formatCurrency";

const NOW = "2026-11-16T15:00:00.000Z";
const plain = (text: string) => text.replace(/ /g, " ");
const money = (amount: number) => plain(formatMoney(amount));

afterEach(() => {
  vi.unstubAllGlobals();
});

function family(id: string, name: string, adults: number, minors: number, paidAmount = 0, extra: Partial<Family> = {}): Family {
  return { id, name, adults, minors, paidAmount, ...extra };
}

/** El caso del pedido: $ 12.000, un adulto con un menor (Ana) entre familias con y sin chicos. */
const PEREZ = family("perez", "Los Pérez", 2, 0, 9000);
const ANA = family("ana", "Ana", 1, 1);
const GOMEZ = family("gomez", "Los Gómez", 2, 2, 3000);
const JULI_GUEST = family("juli", "Juli", 0, 1);
const JULI_PAYS = family("juli", "Juli", 0, 1, 0, { paysOwnShare: true });

const GROUP = [PEREZ, ANA, GOMEZ, JULI_GUEST];
const GROUP_WITH_JULI = [PEREZ, ANA, GOMEZ, JULI_PAYS];

function settle(families: Family[], mode: SplitMode) {
  const result = calculateBalances({ eventName: "", currency: "ARS", splitMode: mode, families });
  if (!result.ok) throw new Error(result.errors[0].message);
  return result.data;
}

const shares = (families: Family[], mode: SplitMode) =>
  Object.fromEntries(settle(families, mode).balances.map((b) => [b.familyId, b.expectedShare]));

function stubStorage() {
  const data = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => void data.set(key, value),
      removeItem: (key: string) => void data.delete(key),
    },
  });
  return data;
}

describe("quién entra en la cuenta", () => {
  it("los menores solos entran solo si pagan su parte", () => {
    expect(isGuestFamily(JULI_GUEST)).toBe(true);
    expect(isPayingSoloMinorFamily(JULI_PAYS)).toBe(true);
    expect(computeAllEligibility([JULI_GUEST, JULI_PAYS]).map((f) => f.isEligibleToPay)).toEqual([false, true]);

    const guest = settle(GROUP, "by-person").balances.find((b) => b.familyId === "juli");
    expect(guest).toMatchObject({ status: "guest", expectedShare: 0 });
  });

  it("valida que los invitados no carguen monto y que haya al menos un adulto", () => {
    expect(validateFamily({ ...JULI_GUEST, paidAmount: 100 })[0]?.code).toBe("GUEST_PAID_AMOUNT");
    expect(validateFamily({ ...JULI_PAYS, paidAmount: 100 })).toEqual([]);
    const onlyMinors = calculateBalances({
      eventName: "",
      currency: "ARS",
      splitMode: "by-person",
      families: [JULI_PAYS, { ...JULI_PAYS, id: "otro" }],
    });
    expect(onlyMinors.ok).toBe(false);
  });

  it("describe la composición y marca a los menores solos", () => {
    expect(describeComposition(ANA)).toBe("1 adulto y 1 menor");
    expect(describeComposition(PEREZ)).toBe("2 adultos");
    expect(describeComposition(JULI_PAYS)).toBe("1 menor (vino solo)");
  });
});

describe("reparto por porciones", () => {
  it("100%: cada menor es una porción entera", () => {
    const { breakdown } = settle(GROUP, "by-person");
    expect(breakdown).toMatchObject({ adults: 5, minors: 3, portions: 8, adultShare: 1500, minorShare: 1500 });
    expect(shares(GROUP, "by-person")).toEqual({ perez: 3000, ana: 3000, gomez: 6000, juli: 0 });
  });

  it("50%: cada menor es media porción y paga la mitad que un adulto", () => {
    const { breakdown } = settle(GROUP, "by-person-minors-half");
    // 5 adultos × 1 + 3 menores × ½ = 6,5 porciones; $ 12.000 ÷ 6,5 = $ 1.846,15.
    expect(breakdown).toMatchObject({ portions: 6.5, adultShare: 1846.15, minorShare: 923.08, minorRatio: 0.5 });
    expect(breakdown.minorShare).toBeCloseTo(breakdown.adultShare / 2, 2);
    // Ana (1 adulto + 1 menor) paga 1,5 porciones: menos que los 2 adultos de Los Pérez.
    expect(shares(GROUP, "by-person-minors-half")).toEqual({
      perez: 3692.3,
      ana: 2769.23,
      gomez: 5538.46,
      juli: 0,
    });
  });

  it("0%: el total se divide entre los adultos", () => {
    const { breakdown } = settle(GROUP, "by-person-minors-zero");
    expect(breakdown).toMatchObject({ portions: 5, adultShare: 2400, minorShare: 0 });
    expect(shares(GROUP, "by-person-minors-zero")).toEqual({ perez: 4800, ana: 2400, gomez: 4800, juli: 0 });
  });

  it("un menor solo que paga su parte cuenta su porción como cualquier menor", () => {
    const { breakdown } = settle(GROUP_WITH_JULI, "by-person-minors-half");
    expect(breakdown).toMatchObject({ minors: 4, soloMinors: 1, portions: 7, adultShare: 1714.29, minorShare: 857.15 });
    expect(shares(GROUP_WITH_JULI, "by-person-minors-half").juli).toBe(857.15);
  });

  it("sin menores las tres respuestas dan lo mismo", () => {
    const adultsOnly = [family("a", "A", 2, 0, 9000), family("b", "B", 1, 0)];
    const [full, half, zero] = (["by-person", "by-person-minors-half", "by-person-minors-zero"] as const).map(
      (mode) => shares(adultsOnly, mode)
    );
    expect(half).toEqual(full);
    expect(zero).toEqual(full);
  });

  it("los centavos de redondeo los absorben las transferencias, en pesos enteros", () => {
    const data = settle(GROUP_WITH_JULI, "by-person-minors-half");
    const { transfers, roundingDiscrepancy } = calculateTransfers(data.balances);
    expect(Math.abs(roundingDiscrepancy)).toBeLessThanOrEqual(1);
    expect(transfers.find((t) => t.fromFamilyId === "juli")).toMatchObject({ toFamilyId: "perez", amount: 857 });
  });
});

describe("el cálculo queda explícito", () => {
  const half = settle(GROUP_WITH_JULI, "by-person-minors-half").breakdown;

  it("describe cada paso del reparto por porciones", () => {
    expect(describeSplitSteps(settle(GROUP, "by-person-minors-half").breakdown, money)).toEqual([
      "5 adultos × 1 + 3 menores × ½ = 6,5 porciones",
      "$ 12.000 ÷ 6,5 porciones = $ 1.846,15 por porción: lo que paga cada adulto",
      "Cada menor paga media porción: $ 1.846,15 ÷ 2 = $ 923,08",
    ]);
    expect(describeSplitSteps(half, money)[1]).toBe(
      "1 de los menores vino solo y paga su parte (a través de su padre, madre o tutor)"
    );
    expect(describeSplitSteps(settle(GROUP, "by-person").breakdown, money)).toEqual([
      "5 adultos + 3 menores = 8 personas",
      "$ 12.000 ÷ 8 personas = $ 1.500 por persona",
    ]);
    expect(describeSplitSteps(settle(GROUP, "by-person-minors-zero").breakdown, money)).toEqual([
      "$ 12.000 ÷ 5 adultos = $ 2.400 por adulto",
      "Los 3 menores no pagan",
    ]);
  });

  it("arma la cuenta de cada familia", () => {
    const b = settle(GROUP, "by-person-minors-half").breakdown;
    expect(describeFamilyShare(ANA, b, money)).toBe("1 adulto × $ 1.846,15 + 1 menor × $ 923,08");
    expect(describeFamilyShare(PEREZ, b, money)).toBe("2 adultos × $ 1.846,15");
    expect(describeFamilyShare(JULI_GUEST, b, money)).toBeNull();
    expect(describeFamilyShare(JULI_PAYS, half, money)).toBe("1 menor × $ 857,15");
    expect(describeFamilyShare(ANA, settle(GROUP, "by-person-minors-zero").breakdown, money)).toBe(
      "1 adulto × $ 2.400 + 1 menor × $ 0"
    );
    expect(describeUnitShares(b, money)).toBe("$ 1.846,15 c/ adulto · $ 923,08 c/ menor");
  });

  it("un menor solo no transfiere: lo hace su padre, madre o tutor", () => {
    const ids = getSoloMinorIds(GROUP_WITH_JULI);
    const transfer = {
      fromFamilyId: "juli",
      fromFamilyName: "Juli",
      toFamilyId: "perez",
      toFamilyName: "Los Pérez",
      amount: 857,
    };
    expect(describeTransfer(transfer, ids, money)).toBe(
      "Padre/madre o tutor encargado de Juli le transfiere $ 857 a Los Pérez"
    );
    expect(
      describeTransfer({ ...transfer, fromFamilyId: "perez", fromFamilyName: "Los Pérez", toFamilyId: "juli", toFamilyName: "Juli" }, ids, money)
    ).toBe("Los Pérez le transfiere $ 857 al padre/madre o tutor encargado de Juli");
  });

  it("WhatsApp muestra los pasos, la cuenta de cada familia y al tutor", () => {
    const settlement = deriveSettlement(GROUP_WITH_JULI, "ARS", "by-person-minors-half")!;
    const text = plain(
      generateWhatsappText({
        eventName: "Asado",
        currency: "ARS",
        splitMode: "by-person-minors-half",
        families: GROUP_WITH_JULI,
        breakdown: settlement.breakdown,
        balances: settlement.balances,
        transfers: settlement.transfers,
      })
    );

    expect(text).toContain("Criterio usado: por persona, menores al 50%");
    expect(text).toContain("Cómo se calculó:\n- 5 adultos × 1 + 4 menores × ½ = 7 porciones");
    expect(text).toContain("- Ana: 1 adulto × $ 1.714,29 + 1 menor × $ 857,15 = $ 2.571,44");
    expect(text).toContain("- Juli (menor solo): 1 menor × $ 857,15 = $ 857,15");
    expect(text).toContain("- Padre/madre o tutor encargado de Juli le transfiere $ 857 a Los Pérez");
    expect(text).toContain("- Juli (menor; padre/madre o tutor encargado de Juli): $ 857,15");
    expect(text).not.toMatch(/- Juli le transfiere/);
  });

  it("el PDF incluye las porciones y al tutor en las transferencias", () => {
    const settlement = deriveSettlement(GROUP_WITH_JULI, "ARS", "by-person-minors-half")!;
    const content = buildEventTicketPdf({
      appName: "¿Quién puso qué?",
      eventName: "Asado",
      currency: "ARS",
      generatedAt: new Date(NOW),
      splitMode: "by-person-minors-half",
      families: GROUP_WITH_JULI,
      balances: settlement.balances,
      transfers: settlement.transfers,
      breakdown: settlement.breakdown,
    }).output();

    for (const text of ["7 porciones", "1.714,29", "tutor encargado de Juli le transfiere", "menor solo", "Adul."]) {
      expect(content).toContain(text);
    }
  });
});

describe("decidir en la mesa", () => {
  it("compara las tres respuestas familia por familia", () => {
    const rows = deriveModeComparison(GROUP);
    expect(rows.find((row) => row.familyId === "ana")?.shares).toEqual({
      "by-person": 3000,
      "by-person-minors-half": 2769.23,
      "by-person-minors-zero": 2400,
    });
    expect(rows.some((row) => row.familyId === "juli")).toBe(false);
    expect(deriveModeComparison(GROUP_WITH_JULI).find((row) => row.familyId === "juli")?.isSoloMinor).toBe(true);
    expect(deriveModePreviews(GROUP)["by-person-minors-half"].adultShare).toBe(1846.15);
  });

  it("el formulario pregunta si los menores solos pagan su parte", () => {
    const values = { ...emptyFamilyFormValues(), name: "Juli", adults: 0, minors: 1 };
    expect(asksIfMinorsPay(values)).toBe(true);
    expect(asksIfMinorsPay({ ...values, adults: 1 })).toBe(false);

    const paying = parseFamilyForm({
      ...values,
      paysOwnShare: true,
      items: [{ key: "1", description: "Globos", amount: "500" }],
    });
    expect(paying.ok && paying.family).toMatchObject({ paysOwnShare: true, paidAmount: 500 });

    const withAdult = parseFamilyForm({ ...values, adults: 1, paysOwnShare: true });
    expect(withAdult.ok && withAdult.family.paysOwnShare).toBeUndefined();
  });

  it("el ejemplo tiene 7 adultos y 3 menores que entran, y un menor solo invitado", () => {
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

  it("pasa integrantes a adultos y menores y limpia 'paga su parte' donde no corresponde", () => {
    expect(isValidFamily(legacy(3, null))).toBe(true);
    expect(isValidFamily(legacy(1, null))).toBe(false);
    expect(normalizeFamily(legacy(3, null, 900) as never)).toEqual({ id: "l3", name: "Vieja", adults: 3, minors: 0, paidAmount: 900 });
    expect(normalizeFamily(legacy(1, "minor", 500) as never)).toMatchObject({ adults: 0, minors: 1, paidAmount: 0 });
    expect(normalizeFamily({ ...ANA, paysOwnShare: true })).not.toHaveProperty("paysOwnShare");
    expect(normalizeFamily({ ...JULI_PAYS, paidAmount: 300 })).toMatchObject({ paysOwnShare: true, paidAmount: 300 });
    expect(isValidFamily({ ...JULI_PAYS, paysOwnShare: "sí" })).toBe(false);
  });

  it("un borrador con 'por familia' vuelve a pedir cómo pagan los menores", () => {
    const data = stubStorage();
    data.set(
      CURRENT_DRAFT_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        eventName: "Asado",
        currency: "ARS",
        createdAt: NOW,
        families: [PEREZ, ANA],
        selectedMode: "by-family",
        splitMode: "by-family",
        recommendationAccepted: true,
        updatedAt: NOW,
      })
    );

    const draft = readCurrentEventDraft();
    expect(draft).toMatchObject({ selectedMode: "by-person", splitMode: null });
    expect(draft).not.toHaveProperty("recommendationAccepted");
  });

  it("el historial sigue mostrando las cuentas cerradas 'por familia'", () => {
    const data = stubStorage();
    const settlement = deriveSettlement([PEREZ, ANA], "ARS", "by-person")!;
    data.set(
      CLOSED_EVENTS_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        events: [
          {
            id: "viejo",
            eventName: "Asado viejo",
            createdAt: NOW,
            closedAt: NOW,
            totalAmount: 9000,
            splitModeUsed: "by-family",
            familiesSnapshot: [legacy(2, null, 9000)],
            balancesSnapshot: settlement.balances,
            transfersSnapshot: settlement.transfers,
            recommendationSnapshot: { recommendedMode: "by-family" },
          },
        ],
      })
    );

    const [event] = readClosedEvents();
    expect(event.splitModeUsed).toBe("by-family");
    expect(splitModeLabel(event.splitModeUsed)).toBe("por familia");
    expect(event).not.toHaveProperty("recommendationSnapshot");
    expect(event.familiesSnapshot[0]).toMatchObject({ adults: 2, minors: 0 });
  });

  it("importa archivos de las versiones 1 y 2, aunque traigan 'por familia'", () => {
    for (const version of [1, 2]) {
      const result = parseEventExportFile(
        JSON.stringify({
          format: "quien-puso-que/calculo",
          version,
          exportedAt: NOW,
          event: {
            eventName: "Asado viejo",
            currency: "ARS",
            createdAt: NOW,
            splitMode: "by-family",
            selectedMode: "by-family",
            recommendationAccepted: true,
            families: [legacy(4, null, 8000), legacy(1, "minor")],
          },
        })
      );
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.event).toMatchObject({ splitMode: null, selectedMode: "by-person" });
        expect(result.event.families.map((f) => [f.adults, f.minors])).toEqual([[4, 0], [0, 1]]);
      }
    }
  });
});

describe("versiones", () => {
  it("la versión actual de la landing coincide con package.json", async () => {
    const { CURRENT_RELEASE, RELEASES, formatReleaseMonth, releaseName } = await import("@/lib/releases");
    const { readFile } = await import("node:fs/promises");
    const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

    expect(releaseName()).toBe("Quienpusoque V1.3");
    expect(pkg.version.split(".").slice(0, 2).join(".")).toBe(CURRENT_RELEASE.version);
    expect(formatReleaseMonth(CURRENT_RELEASE)).toBe("noviembre de 2026");
    // De la más nueva a la más vieja, sin repetir.
    const versions = RELEASES.map((release) => Number(release.version));
    expect([...versions].sort((a, b) => b - a)).toEqual(versions);
    expect(new Set(versions).size).toBe(RELEASES.length);
  });
});
