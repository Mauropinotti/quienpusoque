// Mide bytes transferidos por ruta con CDP, separando la carga inicial
// (pedidos antes del evento load) del prefetch posterior.
// Uso: node scripts/perf/network.mjs http://localhost:3000 / /calcular /ayuda
import { chromium } from "@playwright/test";

const [base, ...paths] = process.argv.slice(2);

const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH });
const results = [];
const kb = (n) => +(n / 1024).toFixed(1);

for (const path of paths) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Page.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });

  const reqs = new Map();
  let loadAt = Infinity;
  cdp.on("Network.requestWillBeSent", (e) => {
    reqs.set(e.requestId, { url: e.request.url, at: e.timestamp, type: e.type, size: 0 });
  });
  cdp.on("Network.responseReceived", (e) => {
    const r = reqs.get(e.requestId);
    if (r) r.type = e.type;
  });
  cdp.on("Network.loadingFinished", (e) => {
    const r = reqs.get(e.requestId);
    if (r) r.size = e.encodedDataLength;
  });
  cdp.on("Page.loadEventFired", (e) => {
    loadAt = Math.min(loadAt, e.timestamp);
  });

  await page.goto(base + path, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  const sum = (filter) =>
    [...reqs.values()].filter(filter).reduce((acc, r) => acc + r.size, 0);
  const initial = (r) => r.at <= loadAt;

  results.push({
    path,
    "JS inicial KB": kb(sum((r) => initial(r) && r.type === "Script")),
    "JS después del load KB": kb(sum((r) => !initial(r) && r.type === "Script")),
    "RSC prefetch KB": kb(sum((r) => r.type === "Fetch" && r.url.includes("_rsc"))),
    "CSS KB": kb(sum((r) => r.type === "Stylesheet")),
    "Fuentes KB": kb(sum((r) => r.type === "Font")),
    "Total inicial KB": kb(sum(initial)),
    requests: reqs.size,
  });
  if (process.env.VERBOSE) {
    for (const r of reqs.values())
      console.log(path, initial(r) ? "INI" : "POST", r.type, kb(r.size) + "KB", r.url.replace(base, ""));
  }
  await context.close();
}

console.table(results);
await browser.close();
