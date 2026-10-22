import { expect, money, test, waitForCalculator } from "./fixtures";

test.describe("landing", () => {
  test("presenta el producto con un ticket calculado de verdad", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1, name: "¿Quién puso qué?" })).toBeVisible();

    const ticket = page.getByRole("article", { name: /Ticket de Asado del sábado/ });
    await expect(ticket).toBeVisible();
    await expect(ticket.getByTestId("ticket-total")).toHaveText(money("16.000"));
    await expect(ticket.getByTestId("ticket-transfer")).toHaveCount(2);
    await expect(ticket.getByTestId("ticket-transfer").first()).toContainText("Los López");
  });

  test("el botón de inicio abre el calculador en el paso 1", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Empezar el cálculo" }).first().click();

    await expect(page).toHaveURL(/\/calcular$/);
    await waitForCalculator(page);
    await expect(page.getByRole("heading", { name: "¿Cómo se llama la juntada?" })).toBeVisible();
    await expect(page.getByLabel("Nombre del evento")).toBeEditable();
  });

  test("el ejemplo abre el calculador con el asado cargado", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Ver un asado de ejemplo" }).click();

    await waitForCalculator(page);
    await expect(page.getByRole("heading", { level: 1, name: "Asado del sábado" })).toBeVisible();
    await expect(page.getByTestId("family-card")).toHaveCount(5);
    // El parámetro se limpia para que recargar no pise lo que edites.
    await expect(page).toHaveURL(/\/calcular$/);
  });

  test("tiene metadatos para compartir e instalar", async ({ page, request }) => {
    await page.goto("/");
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", "/manifest.webmanifest");
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "¿Quién puso qué?");

    const manifest = await request.get("/manifest.webmanifest");
    expect(manifest.ok()).toBe(true);
    expect((await manifest.json()).start_url).toBe("/calcular");
  });

  test("muestra un 404 con salida", async ({ page, consoleErrors }) => {
    const response = await page.goto("/no-existe");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Esta página no vino al asado." })).toBeVisible();
    // El navegador loguea el 404 del documento: es justo lo que estamos probando.
    consoleErrors.splice(0, consoleErrors.length, ...consoleErrors.filter((e) => !/404/.test(e)));
  });
});
