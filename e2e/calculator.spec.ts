import { readFile } from "node:fs/promises";
import { TICKET_PHOTO_ASPECT } from "@/lib/pdf/ticketPhoto";
import { addFamily, expect, money, test, waitForCalculator } from "./fixtures";

test.describe("calculadora: flujo completo", () => {
  test("de cero a transferencias, WhatsApp, PDF e historial", async ({ page, context, browserName }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/calcular");
    await waitForCalculator(page);

    // Paso 1: Enter avanza (es un <form> de verdad).
    await page.getByLabel("Nombre del evento").fill("Cumple de Juli");
    await page.getByLabel("Nombre del evento").press("Enter");
    await expect(page.getByRole("heading", { level: 1, name: "Cumple de Juli" })).toBeVisible();

    // Paso 2: validación visible al intentar agregar vacío.
    await page.getByRole("button", { name: "Agregar familia" }).click();
    await expect(page.getByText("Poné un nombre para identificarla.")).toBeVisible();

    await addFamily(page, { name: "Los Pérez", members: 4, amount: "12000", notes: "Torta y bebidas" });
    await addFamily(page, { name: "Los Gómez", members: 2, amount: "0" });
    await addFamily(page, { name: "Juli", members: 1, type: "Menor" });

    await expect(page.getByTestId("family-card")).toHaveCount(3);
    await expect(page.getByTestId("families-total")).toHaveText(money("12.000"));
    await expect(page.getByTestId("family-card").filter({ hasText: "Juli" })).toContainText("No aporta");

    // Paso 3: recomendación + elección manual.
    await page.getByRole("button", { name: "Ver recomendación" }).click();
    await expect(page.getByRole("heading", { name: /Conviene repartir/ })).toBeVisible();
    await page
      .getByRole("group", { name: "Criterio de reparto" })
      .getByText("Por persona", { exact: true })
      .click();
    await expect(page.getByRole("radio", { name: /Por persona/ })).toBeChecked();
    await page.getByRole("button", { name: "Ver resultado" }).click();

    // Paso 4: 6 personas habilitadas → $2.000 c/u. Pérez debía 8.000 y puso 12.000.
    const ticket = page.getByRole("article", { name: /Ticket de Cumple de Juli/ });
    await expect(ticket.getByTestId("ticket-total")).toHaveText(money("12.000"));
    await expect(ticket).toContainText("Reparto por persona");
    await expect(ticket.getByTestId("ticket-transfer")).toHaveCount(1);
    await expect(ticket.getByTestId("ticket-transfer")).toContainText("Los Gómez");
    await expect(ticket.getByTestId("ticket-transfer")).toContainText(money("4.000"));

    // WhatsApp: el texto llega al portapapeles.
    await page.getByRole("button", { name: "Copiar resumen para WhatsApp" }).click();
    await expect(page.getByText("¡Copiado! Pegalo en el grupo")).toBeVisible();
    if (browserName === "chromium") {
      const clipboard = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboard).toContain("Cumple de Juli");
      expect(clipboard).toMatch(/Los Gómez le transfiere \$\s?4\.000 a Los Pérez/);
    }

    // PDF: se descarga un archivo PDF real, generado en el navegador.
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Descargar ticket PDF" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^quien-puso-que-cumple-de-juli-\d{4}-\d{2}-\d{2}\.pdf$/);
    const pdf = await readFile(await download.path());
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");

    // Historial.
    await page.getByRole("button", { name: "Guardar en el historial" }).click();
    await expect(page.getByRole("button", { name: "Guardado en el historial" })).toBeDisabled();

    // Recargar enseguida no pierde nada: el borrador se guarda al ocultar la página.
    await page.reload();
    await waitForCalculator(page);
    await expect(page.getByRole("heading", { level: 1, name: "¡Cuenta cerrada!" })).toBeVisible();

    // Nueva cuenta (con confirmación) y el evento queda en el historial.
    await page.getByRole("button", { name: "Nuevo evento" }).click();
    await page.getByRole("button", { name: "Sí, nueva cuenta" }).click();
    await expect(page.getByRole("heading", { name: "¿Cómo se llama la juntada?" })).toBeVisible();
    const history = page.getByTestId("history-card");
    await expect(history).toHaveCount(1);
    await expect(history).toContainText("Cumple de Juli");
    await history.getByRole("button", { name: "Ver detalle" }).click();
    await expect(history).toContainText("Los Gómez");
  });

  test("editar y eliminar familias recalcula todo", async ({ page }) => {
    await page.goto("/calcular?demo=1");
    await waitForCalculator(page);
    await expect(page.getByTestId("families-total")).toHaveText(money("16.000"));

    const garcia = page.getByTestId("family-card").filter({ hasText: "Los García" });
    await garcia.getByRole("button", { name: /Editar/ }).click();
    const editForm = page.locator("form").filter({ has: page.getByRole("button", { name: "Guardar cambios" }) });
    await editForm.getByLabel("Monto pagado").fill("10000");
    await editForm.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.getByTestId("families-total")).toHaveText(money("18.000"));

    const lopez = page.getByTestId("family-card").filter({ hasText: "Los López" });
    await lopez.getByRole("button", { name: /Eliminar/ }).click();
    await page.getByRole("button", { name: "Sí, sacar" }).click();
    await expect(page.getByTestId("family-card")).toHaveCount(4);
  });

  test("el criterio se elige con teclado (radios nativos)", async ({ page }) => {
    await page.goto("/calcular?demo=1");
    await waitForCalculator(page);
    await page.getByRole("button", { name: "Ver recomendación" }).click();

    const byFamily = page.getByRole("radio", { name: /Por familia/ });
    const byPerson = page.getByRole("radio", { name: /Por persona/ });
    const initial = (await byFamily.isChecked()) ? byFamily : byPerson;
    const other = initial === byFamily ? byPerson : byFamily;

    await initial.focus();
    await page.keyboard.press(initial === byFamily ? "ArrowDown" : "ArrowUp");
    await expect(other).toBeChecked();
    await expect(other).toBeFocused();
  });

  test("un menor solo no puede cargar monto", async ({ page }) => {
    await page.goto("/calcular");
    await waitForCalculator(page);
    await page.getByLabel("Nombre del evento").fill("Asado");
    await page.getByRole("button", { name: "Cargar familias" }).click();

    await page.getByRole("button", { name: "1 integrante", exact: true }).click();
    await page.getByRole("button", { name: "Menor" }).click();
    await expect(page.getByLabel("Monto pagado")).toBeDisabled();
    await expect(page.getByLabel("Monto pagado")).toHaveValue("0");
  });

  test("la foto opcional se recorta al formato del ticket", async ({ page }) => {
    await page.goto("/calcular?demo=1");
    await waitForCalculator(page);
    await page.getByRole("button", { name: "Ver recomendación" }).click();
    await page.getByRole("button", { name: "Ver resultado" }).click();

    // Imagen cuadrada generada en el momento: tiene que quedar apaisada.
    const png = await page.evaluate(async () => {
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 600;
      const context = canvas.getContext("2d")!;
      context.fillStyle = "#ff5b1f";
      context.fillRect(0, 0, 600, 600);
      const blob: Blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/png"));
      return Array.from(new Uint8Array(await blob.arrayBuffer()));
    });
    await page
      .getByLabel("Seleccionar foto opcional para el ticket PDF")
      .setInputFiles({ name: "asado.png", mimeType: "image/png", buffer: Buffer.from(png) });

    const preview = page.getByRole("img", { name: "Foto elegida para el ticket PDF" });
    await expect(preview).toBeVisible();
    const size = await preview.evaluate((img: HTMLImageElement) => ({
      w: img.naturalWidth,
      h: img.naturalHeight,
    }));
    expect(size.w / size.h).toBeCloseTo(TICKET_PHOTO_ASPECT, 1);
  });
});

test.describe("borrador", () => {
  test("retoma la cuenta en el paso donde quedó, sin pasar por el paso 1", async ({ page }) => {
    await page.goto("/calcular?demo=1");
    await waitForCalculator(page);
    await page.getByRole("button", { name: "Ver recomendación" }).click();
    await page.getByRole("button", { name: "Ver resultado" }).click();
    await expect(page.getByRole("heading", { name: "¡Cuenta cerrada!" })).toBeVisible();

    // Registramos todo h1 que llegue a pintarse durante la recarga.
    await page.addInitScript(() => {
      const seen: string[] = [];
      (window as unknown as { __h1s: string[] }).__h1s = seen;
      new MutationObserver(() => {
        document.querySelectorAll("h1").forEach((h1) => {
          if (h1.checkVisibility() && !seen.includes(h1.textContent ?? "")) seen.push(h1.textContent ?? "");
        });
      }).observe(document, { childList: true, subtree: true });
    });
    await page.reload();
    await waitForCalculator(page);
    await expect(page.getByRole("heading", { name: "¡Cuenta cerrada!" })).toBeVisible();

    const seen = await page.evaluate(() => (window as unknown as { __h1s: string[] }).__h1s);
    expect(seen).not.toContain("¿Cómo se llama la juntada?");
  });
});

test.describe("ayuda", () => {
  test("explica el funcionamiento y adapta el llamado a la acción", async ({ page }) => {
    await page.goto("/ayuda");
    await expect(page.getByRole("heading", { level: 1, name: "¿Cómo funciona?" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "¿Quién aporta?" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Empezar el cálculo" })).toBeVisible();

    await page.goto("/calcular?demo=1");
    await waitForCalculator(page);
    await page.goto("/ayuda");
    await expect(page.getByRole("link", { name: "Seguir con mi cuenta" })).toBeVisible();
  });
});
