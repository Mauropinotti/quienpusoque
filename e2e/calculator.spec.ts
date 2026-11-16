import { readFile } from "node:fs/promises";
import { TICKET_PHOTO_ASPECT } from "@/lib/pdf/ticketPhoto";
import { addFamily, expect, fillContributions, money, setPeople, test, waitForCalculator } from "./fixtures";

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

    // Cada cosa con lo que salió: la app suma el total en vivo.
    const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Agregar familia" }) });
    await fillContributions(form, [
      ["Torta", "8000"],
      ["Bebidas", "3500"],
      ["Hielo", ""],
    ]);
    await expect(form.getByTestId("family-form-total")).toHaveText(money("11.500"));
    await form.getByLabel("Nombre", { exact: true }).fill("Los Pérez");
    await setPeople(form, "adultos", 2);
    await setPeople(form, "menores", 2);
    await form.getByRole("button", { name: "Agregar familia" }).click();
    // Una cosa sin monto no se cuela como $0: se marca en su fila.
    await expect(form.getByText("¿Cuánto salió? Si no costó nada, poné 0.")).toBeVisible();
    await form.getByLabel("Cuánto salió (ítem 3)").fill("500");
    await expect(form.getByTestId("family-form-total")).toHaveText(money("12.000"));
    await form.getByRole("button", { name: "Agregar familia" }).click();

    await addFamily(page, { name: "Los Gómez", adults: 2, items: [["", "0"]] });
    await addFamily(page, { name: "Juli", adults: 0, minors: 1 });

    await expect(page.getByTestId("family-card")).toHaveCount(3);
    await expect(page.getByTestId("families-total")).toHaveText(money("12.000"));
    const perez = page.getByTestId("family-card").filter({ hasText: "Los Pérez" });
    await expect(perez.getByTestId("family-items").getByRole("listitem")).toHaveCount(3);
    await expect(perez.getByTestId("family-items")).toContainText("Hielo");
    await expect(page.getByTestId("family-card").filter({ hasText: "Juli" })).toContainText("No aporta");

    // Paso 3: recomendación + elección manual.
    await page.getByRole("button", { name: "Cómo repartir" }).click();
    // Sin sugerencia ni "por familia": se elige cuánto cuenta cada menor.
    await expect(page.getByRole("heading", { level: 1, name: "¿Cómo pagan los menores?" })).toBeVisible();
    await expect(page.getByRole("radio", { name: /Igual que un adulto \(100%\)/ })).toBeChecked();
    await page.getByRole("button", { name: "Ver resultado" }).click();

    // Paso 4: 4 adultos + 2 menores = 6 personas → $2.000 c/u. Pérez debía 8.000 y puso 12.000.
    const ticket = page.getByRole("article", { name: /Ticket de Cumple de Juli/ });
    await expect(ticket.getByTestId("ticket-total")).toHaveText(money("12.000"));
    await expect(ticket).toContainText("Reparto por persona, menores al 100%");
    await expect(ticket.getByTestId("ticket-steps")).toContainText("4 adultos + 2 menores = 6 personas");
    await expect(ticket.getByTestId("ticket-transfer")).toHaveCount(1);
    await expect(ticket.getByTestId("ticket-transfer")).toContainText("Los Gómez");
    await expect(ticket.getByTestId("ticket-transfer")).toContainText(money("4.000"));
    // Todo queda expuesto: cada cosa que puso Los Pérez con su monto.
    const perezItems = ticket.getByTestId("ticket-balance").filter({ hasText: "Los Pérez" }).getByTestId("ticket-items");
    await expect(perezItems.getByRole("listitem")).toHaveText([/Torta.*8\.000/, /Bebidas.*3\.500/, /Hielo.*500/]);

    // WhatsApp: el texto llega al portapapeles.
    await page.getByRole("button", { name: "Copiar resumen para WhatsApp" }).click();
    await expect(page.getByText("¡Copiado! Pegalo en el grupo")).toBeVisible();
    if (browserName === "chromium") {
      const clipboard = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboard).toContain("Cumple de Juli");
      expect(clipboard).toMatch(/Los Gómez le transfiere \$\s?4\.000 a Los Pérez/);
      expect(clipboard).toContain("Lo que puso cada uno:");
      expect(clipboard).toMatch(/· Torta: \$\s?8\.000/);
      expect(clipboard).toMatch(/· Hielo: \$\s?500/);
    }

    // PDF: se descarga un archivo PDF real, generado en el navegador.
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Descargar ticket PDF" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^quien-puso-que-cumple-de-juli-\d{4}-\d{2}-\d{2}\.pdf$/);
    const pdf = await readFile(await download.path());
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.toString("latin1")).toContain("Torta");

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
    // Trae el desglose cargado: Carne 6.500 + Carbón 1.500.
    await expect(editForm.getByLabel("Qué puso (ítem 2)")).toHaveValue("Carbón");
    await editForm.getByRole("button", { name: "Sumar otra cosa" }).click();
    await expect(editForm.getByLabel("Qué puso (ítem 3)")).toBeFocused();
    await fillContributions(editForm, [["Carne", "6500"], ["Carbón", "1500"], ["Chorizos", "2000"]]);
    await expect(editForm.getByTestId("family-form-total")).toHaveText(money("10.000"));
    await editForm.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.getByTestId("families-total")).toHaveText(money("18.000"));
    await expect(garcia.getByTestId("family-items")).toContainText("Chorizos");

    // Quitar una cosa recalcula el total de la familia.
    await garcia.getByRole("button", { name: /Editar/ }).click();
    await editForm.getByRole("button", { name: "Quitar ítem 3" }).click();
    await editForm.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.getByTestId("families-total")).toHaveText(money("16.000"));

    const lopez = page.getByTestId("family-card").filter({ hasText: "Los López" });
    await lopez.getByRole("button", { name: /Eliminar/ }).click();
    await page.getByRole("button", { name: "Sí, sacar" }).click();
    await expect(page.getByTestId("family-card")).toHaveCount(4);
  });

  test("el criterio se elige con teclado (radios nativos)", async ({ page }) => {
    await page.goto("/calcular?demo=1");
    await waitForCalculator(page);
    await page.getByRole("button", { name: "Cómo repartir" }).click();

    const full = page.getByRole("radio", { name: /Igual que un adulto/ });
    const half = page.getByRole("radio", { name: /La mitad/ });
    await expect(full).toBeChecked();

    await full.focus();
    await page.keyboard.press("ArrowDown");
    await expect(half).toBeChecked();
    await expect(half).toBeFocused();
  });

  test("un menor solo carga monto solo si va a pagar su parte", async ({ page }) => {
    await page.goto("/calcular");
    await waitForCalculator(page);
    await page.getByLabel("Nombre del evento").fill("Asado");
    await page.getByRole("button", { name: "Cargar familias" }).click();

    const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Agregar familia" }) });
    await setPeople(form, "adultos", 0);
    await setPeople(form, "menores", 1);

    // Invitado: no paga su parte y el monto queda en $0.
    const paysOwnShare = form.getByRole("checkbox", { name: /Va a pagar su parte/ });
    await expect(paysOwnShare).not.toBeChecked();
    await expect(page.getByLabel("Monto pagado")).toBeDisabled();
    await expect(page.getByLabel("Monto pagado")).toHaveValue("0");

    // Si paga su parte (a través de su tutor), puede cargar lo que puso.
    await paysOwnShare.check();
    await expect(form.getByLabel("Cuánto salió (ítem 1)")).toBeEditable();

    // Con un adulto ya no se pregunta.
    await setPeople(form, "adultos", 1);
    await expect(paysOwnShare).toHaveCount(0);
  });

  test("la foto opcional se recorta al formato del ticket", async ({ page }) => {
    await page.goto("/calcular?demo=1");
    await waitForCalculator(page);
    await page.getByRole("button", { name: "Cómo repartir" }).click();
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

test.describe("menores al 50%, por porciones", () => {
  test("el ticket y el WhatsApp muestran las porciones y al tutor del menor solo", async ({ page, context, browserName }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/calcular");
    await waitForCalculator(page);
    await page.getByLabel("Nombre del evento").fill("Asado");
    await page.getByRole("button", { name: "Cargar familias" }).click();

    // 5 adultos, 3 menores con su familia y Juli, que vino sola y paga su parte. $ 12.000.
    await addFamily(page, { name: "Los Pérez", adults: 2, items: [["Carne", "7000"], ["Carbón", "2000"]] });
    await addFamily(page, { name: "Ana", adults: 1, minors: 1 });
    await addFamily(page, { name: "Los Gómez", adults: 2, minors: 2, items: [["Bebidas", "3000"]] });
    await addFamily(page, { name: "Juli", adults: 0, minors: 1, paysOwnShare: true });
    await expect(page.getByTestId("families-total")).toHaveText(money("12.000"));
    await expect(page.getByTestId("family-card").filter({ hasText: "Juli" })).toContainText("Paga su tutor");

    await page.getByRole("button", { name: "Cómo repartir" }).click();
    await expect(page.getByTestId("solo-minor")).toContainText("paga su parte a través de su padre, madre o tutor");
    const half = page.getByRole("radio", { name: /La mitad \(50%\)/ });
    // Cada respuesta muestra cuánto pagaría un adulto y un menor.
    await expect(page.locator("label").filter({ has: half })).toContainText(
      /\$\s?1\.714,29 c\/ adulto · \$\s?857,15 c\/ menor/
    );
    await page.getByText("La mitad (50%)", { exact: true }).click();
    await expect(half).toBeChecked();
    // La tabla compara las tres respuestas para Ana (1 adulto y 1 menor).
    await expect(page.getByRole("row", { name: /Ana/ })).toContainText(/\$\s?2\.571,44/);
    await page.getByRole("button", { name: "Ver resultado" }).click();

    const ticket = page.getByRole("article", { name: /Ticket de Asado/ });
    await expect(ticket).toContainText("Reparto por persona, menores al 50%");
    await expect(ticket.getByTestId("ticket-steps").getByRole("listitem")).toHaveText([
      "5 adultos × 1 + 4 menores × ½ = 7 porciones",
      "1 de los menores vino solo y paga su parte (a través de su padre, madre o tutor)",
      /\$\s?12\.000 ÷ 7 porciones = \$\s?1\.714,29 por porción: lo que paga cada adulto/,
      /Cada menor paga media porción: \$\s?1\.714,29 ÷ 2 = \$\s?857,15/,
    ]);
    const ana = ticket.getByTestId("ticket-balance").filter({ hasText: "Ana" });
    await expect(ana).toContainText("1 adulto y 1 menor");
    await expect(ana.getByTestId("ticket-share-formula")).toHaveText(
      /1 adulto × \$\s?1\.714,29 \+ 1 menor × \$\s?857,15/
    );
    await expect(ana).toContainText(/le tocaba \$\s?2\.571,44/);

    // El menor solo queda marcado y transfiere su padre, madre o tutor.
    const juli = ticket.getByTestId("ticket-balance").filter({ hasText: "Juli" });
    await expect(juli).toContainText("Menor · paga su parte a través de su padre, madre o tutor");
    await expect(ticket.getByTestId("ticket-transfer").filter({ hasText: "Juli" })).toContainText(
      "Padre/madre o tutor encargado de Juli"
    );

    await page.getByRole("button", { name: "Copiar resumen para WhatsApp" }).click();
    if (browserName === "chromium") {
      const clipboard = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboard).toContain("Criterio usado: por persona, menores al 50%");
      expect(clipboard).toMatch(/Cómo se calculó:\n- 5 adultos × 1 \+ 4 menores × ½ = 7 porciones/);
      expect(clipboard).toMatch(/- Ana: 1 adulto × \$\s?1\.714,29 \+ 1 menor × \$\s?857,15 = \$\s?2\.571,44/);
      expect(clipboard).toMatch(/- Padre\/madre o tutor encargado de Juli le transfiere \$\s?857 a Los Pérez/);
      expect(clipboard).not.toMatch(/- Juli le transfiere/);
    }
  });
});

test.describe("exportar e importar", () => {
  test("baja el cálculo a un archivo y lo retoma desde el paso 1", async ({ page }) => {
    await page.goto("/calcular?demo=1");
    await waitForCalculator(page);

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Exportar cálculo" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^quien-puso-que-asado-del-sabado-\d{4}-\d{2}-\d{2}\.json$/);
    const exported = JSON.parse(await readFile(await download.path(), "utf8"));
    expect(exported.format).toBe("quien-puso-que/calculo");
    expect(exported.event.families).toHaveLength(5);
    expect(exported.event.families[0].items).toEqual([
      { description: "Carne", amount: 6500 },
      { description: "Carbón", amount: 1500 },
    ]);

    // Cuenta nueva desde cero.
    await page.getByRole("button", { name: "Volver" }).click();
    await page.getByRole("button", { name: "Empezar de nuevo" }).click();
    await expect(page.getByLabel("Nombre del evento")).toHaveValue("");

    // Un archivo cualquiera no rompe nada.
    const fileInput = page.getByLabel("Seleccionar archivo de cálculo para importar");
    await fileInput.setInputFiles({ name: "lista.json", mimeType: "application/json", buffer: Buffer.from('{"hola":1}') });
    await expect(page.getByRole("alert").filter({ hasText: "no es un cálculo" })).toBeVisible();

    // El archivo exportado retoma todo, con el desglose.
    await fileInput.setInputFiles(await download.path());
    await expect(page.getByRole("heading", { level: 1, name: "Asado del sábado" })).toBeVisible();
    await expect(page.getByTestId("family-card")).toHaveCount(5);
    await expect(page.getByTestId("families-total")).toHaveText(money("16.000"));
    await expect(
      page.getByTestId("family-card").filter({ hasText: "Los Fernández" }).getByTestId("family-items")
    ).toContainText("Hielo");
  });

  test("pide confirmación antes de pisar una cuenta en curso", async ({ page }) => {
    await page.goto("/calcular?demo=1");
    await waitForCalculator(page);
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Exportar cálculo" }).click();
    const file = await (await downloadPromise).path();

    await page.getByRole("button", { name: "Volver" }).click();
    await page.getByLabel("Nombre del evento").fill("Otra juntada");
    await page.getByLabel("Seleccionar archivo de cálculo para importar").setInputFiles(file);
    await expect(page.getByText("¿Reemplazamos la cuenta en curso?")).toBeVisible();
    await page.getByRole("button", { name: "Mejor no" }).click();
    await expect(page.getByLabel("Nombre del evento")).toHaveValue("Otra juntada");

    await page.getByLabel("Seleccionar archivo de cálculo para importar").setInputFiles(file);
    await page.getByRole("button", { name: "Sí, importar" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Asado del sábado" })).toBeVisible();
  });
});

test.describe("borrador", () => {
  test("retoma la cuenta en el paso donde quedó, sin pasar por el paso 1", async ({ page }) => {
    await page.goto("/calcular?demo=1");
    await waitForCalculator(page);
    await page.getByRole("button", { name: "Cómo repartir" }).click();
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
