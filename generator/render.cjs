// Renders all twelve note sides to ../png. Run: NODE_PATH=$(npm root -g) node generator/render.cjs
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on("console", m => console.log("page:", m.text()));
  page.on("pageerror", e => console.error("page error:", e.message));
  await page.goto("file://" + path.join(__dirname, "render.html"));
  await page.waitForFunction(() => window.renderJob);
  const out = path.join(__dirname, "..", "png");
  fs.mkdirSync(out, { recursive: true });
  const only = process.argv[2];
  for (const job of await page.evaluate(() => window.jobs())) {
    if (only && `${job.v}-${job.side}` !== only) continue;
    const data = await page.evaluate(j => window.renderJob(j), job);
    const file = `${job.v}-dollar-${job.side}.png`;
    fs.writeFileSync(path.join(out, file), Buffer.from(data.split(",")[1], "base64"));
    console.log("wrote", file);
  }
  await browser.close();
})();
