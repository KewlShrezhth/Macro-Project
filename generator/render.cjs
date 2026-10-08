// Builds the note series.
//   node generator/render.cjs [denominations...] [--force]   e.g. node generator/render.cjs 20
// Engraved vignettes are cached in png/vignettes and re-rendered when their shader changes.
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
const renderVignette = require("./vignette.cjs");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "png"), VOUT = path.join(OUT, "vignettes");
const SCALE = 3;                       // output px per note unit
const VIG = { w: 584, h: 418 };        // arched window, note units
const LINE = 1.75;                     // engraving line period, note units
const SLUG = { 1: "one", 5: "five", 10: "ten", 20: "twenty", 50: "fifty", 100: "hundred" };
const INK = { 1: "#232a27", 5: "#2a2633", 10: "#33231a", 20: "#132b29", 50: "#2e1519", 100: "#141b30" };

(async () => {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const list = args.filter(a => /^\d+$/.test(a)).map(Number);
  const denoms = list.length ? list : [1, 5, 10, 20, 50, 100];
  const browser = await chromium.launch();
  fs.mkdirSync(VOUT, { recursive: true });
  for (const v of denoms) {
    const imgs = {};
    for (const side of ["front", "back"]) {
      const scene = `${SLUG[v]}-${side}`;
      const shader = path.join(__dirname, "vignettes", scene + ".glsl");
      const out = path.join(VOUT, scene + ".png");
      if (!fs.existsSync(shader)) { console.log("missing shader", scene); continue; }
      const stale = !fs.existsSync(out) || [shader, ...["common.glsl", "main.glsl", "main2d.glsl"].map(f => path.join(__dirname, "vignettes", f))]
        .some(f => fs.statSync(f).mtimeMs > fs.statSync(out).mtimeMs);
      if (force || stale) await renderVignette(browser, { scene, w: VIG.w * SCALE, h: VIG.h * SCALE, lpx: LINE * SCALE, ink: INK[v], out });
      imgs[side] = "data:image/png;base64," + fs.readFileSync(out).toString("base64");
    }
    if (!imgs.front || !imgs.back) continue;
    const ctx = await browser.newContext({ viewport: { width: 1560, height: 660 }, deviceScaleFactor: SCALE });
    const page = await ctx.newPage();
    page.on("pageerror", e => console.error("page error:", e.message));
    await page.goto("file://" + path.join(__dirname, "note.html"));
    for (const side of ["front", "back"]) {
      await page.evaluate(({ v, side, imgs }) => window.compose(v, side, imgs), { v, side, imgs });
      const file = path.join(OUT, `${v}-dollar-${side}.png`);
      await page.locator("#stage svg").screenshot({ path: file });
      console.log("wrote", path.relative(ROOT, file));
    }
    await ctx.close();
  }
  await browser.close();
})();
