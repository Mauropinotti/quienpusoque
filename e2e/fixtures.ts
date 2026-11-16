import { expect, test as base, type Locator, type Page } from "@playwright/test";

/**
 * Fixture común: falla el test si la página tira errores de JS o de consola.
 * Una app sin backend no tiene excusa para ensuciar la consola.
 */
export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await use(errors);
      expect(errors, "errores en consola").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/** Montos como los muestra la app ("$ 4.000", con espacio duro de Intl). */
export function money(value: string): RegExp {
  return new RegExp(`\\$\\s?${value.replace(".", "\\.")}`);
}

/** Cada cosa que puso: [qué, cuánto salió]. Con un monto suelto, qué = "". */
export type ContributionInput = [what: string, amount: string];

/** Carga las cosas en las filas de "¿Qué puso?", sumando filas si hace falta. */
export async function fillContributions(form: Locator, items: ContributionInput[]) {
  for (const [index, [what, amount]] of items.entries()) {
    const number = index + 1;
    if (index > 0 && (await form.getByLabel(`Qué puso (ítem ${number})`).count()) === 0) {
      await form.getByRole("button", { name: "Sumar otra cosa" }).click();
    }
    await form.getByLabel(`Qué puso (ítem ${number})`).fill(what);
    await form.getByLabel(`Cuánto salió (ítem ${number})`).fill(amount);
  }
}

/** Lleva el contador de adultos o menores al número pedido con − / +. */
export async function setPeople(form: Locator, kind: "adultos" | "menores", target: number) {
  const group = form.getByRole("group", { name: kind === "adultos" ? "Adultos" : "Menores" });
  const unit = kind === "adultos" ? "adulto" : "menor";
  const current = Number(await group.locator("output").textContent());
  const button = group.getByRole("button", { name: `${target > current ? "Sumar" : "Restar"} un ${unit}` });
  for (let i = 0; i < Math.abs(target - current); i += 1) await button.click();
  await expect(group.locator("output")).toHaveText(String(target));
}

export async function addFamily(
  page: Page,
  family: { name: string; adults: number; minors?: number; items?: ContributionInput[] }
) {
  const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Agregar familia" }) });
  await form.getByLabel("Nombre", { exact: true }).fill(family.name);
  await setPeople(form, "adultos", family.adults);
  await setPeople(form, "menores", family.minors ?? 0);
  if (family.items) await fillContributions(form, family.items);
  await form.getByRole("button", { name: "Agregar familia" }).click();
}

/** Espera a que el calculador esté montado (el fallback es inerte). */
export async function waitForCalculator(page: Page) {
  await expect(page.locator("[aria-busy='true']")).toHaveCount(0);
}
