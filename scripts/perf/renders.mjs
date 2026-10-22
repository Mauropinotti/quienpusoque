// Cuenta renders de componentes React por interacción usando el hook de DevTools.
// Uso (contra `next dev`, que conserva los nombres): node scripts/perf/renders.mjs http://localhost:3000/calcular
import { chromium } from "@playwright/test";

const [url] = process.argv.slice(2);

const hookScript = () => {
  const counts = {};
  let commits = 0;
  const FN_TAGS = new Set([0, 1, 11, 14, 15]); // function, class, forwardRef, memo, simpleMemo
  function nameOf(fiber) {
    const t = fiber.type;
    if (!t) return null;
    if (typeof t === "function") return t.displayName || t.name || null;
    if (typeof t === "object") return t.displayName || t.render?.name || t.type?.name || null;
    return null;
  }
  // Solo descendemos a subárboles que React procesó en este commit: si
  // fiber.child === fiber.alternate.child, los hijos se reutilizaron sin tocar
  // y sus flags son del commit anterior.
  function walk(fiber) {
    while (fiber) {
      if (FN_TAGS.has(fiber.tag) && (fiber.flags & 1) === 1) {
        const n = nameOf(fiber);
        if (n && /^[A-Z]/.test(n) && !/Icon$|^LoadableComponent$/.test(n) && !/^(Inner|Outer|Router|Layout|Hot|App|Error|Redirect|Http|Loading|Scroll|Render|Head|Server|Segment|Not|Dev|Root|Meta|Analytics|Suspense|Handle|Lazy|Boundary|ClientPage|ClientSegment|Bailout|Static|Viewport|Icon|Async|Forbidden|Unauthorized|Template|Fallback|Link|Image|Pending|Reactive|Navigation|Global|Replay|Use|Mark|Out|In)/.test(n)) {
          counts[n] = (counts[n] || 0) + 1;
        }
      }
      const childrenProcessed = !fiber.alternate || fiber.child !== fiber.alternate.child;
      if (fiber.child && childrenProcessed) walk(fiber.child);
      fiber = fiber.sibling;
    }
  }
  window.__RENDERS__ = { counts, get commits() { return commits; }, reset() { for (const k in counts) delete counts[k]; commits = 0; } };
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    supportsFiber: true,
    renderers: new Map(),
    inject(r) { const id = this.renderers.size + 1; this.renderers.set(id, r); return id; },
    onCommitFiberRoot(_id, root) {
      commits++;
      const r = root.current;
      if (!r.alternate || r.child !== r.alternate.child) walk(r.child);
    },
    onCommitFiberUnmount() {},
    onPostCommitFiberRoot() {},
    checkDCE() {},
    isDisabled: false,
  };
};

const storageHook = () => {
  const ops = { get: 0, set: 0, remove: 0, bytesWritten: 0 };
  window.__STORAGE__ = { ops, reset() { ops.get = ops.set = ops.remove = ops.bytesWritten = 0; } };
  const proto = Storage.prototype;
  const { getItem, setItem, removeItem } = proto;
  proto.getItem = function (k) { ops.get++; return getItem.call(this, k); };
  proto.setItem = function (k, v) { ops.set++; ops.bytesWritten += String(v).length; return setItem.call(this, k, v); };
  proto.removeItem = function (k) { ops.remove++; return removeItem.call(this, k); };
};

const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
await page.addInitScript(hookScript);
await page.addInitScript(storageHook);
await page.goto(url, { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(500);

const summary = [];
async function measure(label, fn) {
  await page.evaluate(() => { window.__RENDERS__.reset(); window.__STORAGE__.reset(); });
  await fn();
  await page.waitForTimeout(700);
  const r = await page.evaluate(() => ({ counts: { ...window.__RENDERS__.counts }, commits: window.__RENDERS__.commits, storage: { ...window.__STORAGE__.ops } }));
  const total = Object.values(r.counts).reduce((a, b) => a + b, 0);
  summary.push({ escenario: label, commits: r.commits, renders: total, "LS get": r.storage.get, "LS set": r.storage.set, "LS remove": r.storage.remove, "LS KB escritos": +(r.storage.bytesWritten / 1024).toFixed(1) });
  if (process.env.VERBOSE) {
    console.log(`\n## ${label}`);
    console.log(Object.entries(r.counts).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join("  "));
  }
}

await measure("Tipear nombre del evento (16 teclas)", async () => {
  await page.getByLabel(/Nombre del evento/i).click();
  await page.keyboard.type("Asado del sábado", { delay: 25 });
});

await measure("Cargar demo (5 familias)", async () => {
  await page.locator("text=/datos de ejemplo|Probar con/i").first().click();
});

await measure("Tipear nombre de familia (9 teclas)", async () => {
  await page.getByLabel(/^Nombre$|Nombre de la familia/i).first().click();
  await page.keyboard.type("Los Pérez", { delay: 25 });
});

await measure("Tipear monto (4 teclas)", async () => {
  await page.getByLabel(/Monto pagado|Cuánto puso/i).first().click();
  await page.keyboard.type("2500", { delay: 25 });
});

await measure("Agregar familia", async () => {
  await page.getByRole("button", { name: /^Agregar familia$|^Sumar familia/i }).first().click();
});

await measure("Ir a recomendación", async () => {
  await page.getByRole("button", { name: /Ver recomendación/i }).click();
});

await measure("Cambiar criterio", async () => {
  const radio = page.getByRole("radio", { name: /Por persona/i });
  if (await radio.count()) await page.locator("label", { has: radio }).click();
  else await page.getByRole("button", { name: /Por persona/i }).first().click();
});

await measure("Ver resultado", async () => {
  await page.getByRole("button", { name: /Ver resultado/i }).click();
});

await measure("Guardar evento cerrado", async () => {
  await page.getByRole("button", { name: /Guardar (evento cerrado|en (el )?historial)/i }).click();
});

console.table(summary);
await browser.close();
