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
    {
      // memorial roundel, engraved in this note's plate ink
      const out = path.join(VOUT, `memorial-${v}.png`);
      const shader = path.join(__dirname, "vignettes", "memorial.glsl");
      const stale = !fs.existsSync(out) || [shader, path.join(__dirname, "vignettes", "main2d.glsl")].some(f => fs.statSync(f).mtimeMs > fs.statSync(out).mtimeMs);
      if (force || stale) await renderVignette(browser, { scene: "memorial", w: 172 * SCALE, h: 172 * SCALE, lpx: LINE * SCALE * .85, ink: INK[v], out });
      imgs.memorial = "data:image/png;base64," + fs.readFileSync(out).toString("base64");
    }
    for (const side of ["front", "back"]) {
      const scene = `${SLUG[v]}-${side}`;
      // a prepared photo in generator/portraits/<scene>.png is engraved with the portrait shader instead of a scene shader
      const photo = path.join(__dirname, "portraits", scene + ".png");
      const usePhoto = fs.existsSync(photo);
      const shaderName = usePhoto ? "portrait" : scene;
      const shader = path.join(__dirname, "vignettes", shaderName + ".glsl");
      const out = path.join(VOUT, scene + ".png");
      if (!fs.existsSync(shader)) { console.log("missing shader", scene); continue; }
      const inputs = [shader, ...(usePhoto ? [photo] : []), ...["common.glsl", "main.glsl", "main2d.glsl"].map(f => path.join(__dirname, "vignettes", f))];
      const stale = !fs.existsSync(out) || inputs.some(f => fs.statSync(f).mtimeMs > fs.statSync(out).mtimeMs);
      const size = usePhoto && side === "front" ? { w: 296, h: 370 } : VIG;
      if (force || stale) await renderVignette(browser, { scene: shaderName, w: size.w * SCALE, h: size.h * SCALE, lpx: LINE * SCALE * (usePhoto && side === "front" ? .8 : 1), ink: INK[v], out, image: usePhoto ? photo : undefined });
      imgs[side] = "data:image/png;base64," + fs.readFileSync(out).toString("base64");
    }
    if (!imgs.front || !imgs.back) continue;
    const ctx = await browser.newContext({ viewport: { width: 1560, height: 660 }, deviceScaleFactor: SCALE });
    const page = await ctx.newPage();
    page.on("pageerror", e => console.error("page error:", e.message));
    await page.goto("file://" + path.join(__dirname, "note.html"));
    for (const side of ["front", "back"]) {
      await page.evaluate(({ v, side, imgs }) => window.compose(v, side, imgs, false), { v, side, imgs });
      const file = path.join(OUT, `${v}-dollar-${side}.png`);
      await page.locator("#stage svg").screenshot({ path: file });
      console.log("wrote", path.relative(ROOT, file));
      await page.setViewportSize({ width: 1780, height: 920 });
      await page.evaluate(({ v, side, imgs }) => window.compose(v, side, imgs, true), { v, side, imgs });
      const afile = path.join(OUT, "annotated", `${v}-dollar-${side}-annotated.png`);
      fs.mkdirSync(path.dirname(afile), { recursive: true });
      await page.locator("#stage svg").screenshot({ path: afile, scale: "css" });
      await page.setViewportSize({ width: 1560, height: 660 });
      console.log("wrote", path.relative(ROOT, afile));
    }
    await ctx.close();
  }
  await browser.close();
})();
