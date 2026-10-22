import { expect, test as base, type Page } from "@playwright/test";

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

export async function addFamily(
  page: Page,
  family: { name: string; members: number; type?: "Adulto" | "Menor"; amount?: string; notes?: string }
) {
  const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Agregar familia" }) });
  await form.getByLabel("Nombre", { exact: true }).fill(family.name);
  await form
    .getByRole("button", { name: family.members === 1 ? "1 integrante" : `${family.members} integrantes`, exact: true })
    .click();
  if (family.type) await form.getByRole("button", { name: family.type }).click();
  if (family.amount !== undefined) await form.getByLabel("Monto pagado").fill(family.amount);
  if (family.notes) await form.getByLabel("Nota o detalle (opcional)").fill(family.notes);
  await form.getByRole("button", { name: "Agregar familia" }).click();
}

/** Espera a que el calculador esté montado (el fallback es inerte). */
export async function waitForCalculator(page: Page) {
  await expect(page.locator("[aria-busy='true']")).toHaveCount(0);
}
