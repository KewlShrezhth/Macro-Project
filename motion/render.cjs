// Renders motion/pitch.html to an MP4, frame by frame.
//   node motion/render.cjs [--stills 5,12,26,...] [--fps 30]
const { chromium } = require("playwright");
const { spawn } = require("child_process");
const path = require("path"), fs = require("fs");
const args = process.argv.slice(2);
const stillsArg = args.includes("--stills") ? args[args.indexOf("--stills") + 1] : null;
const FPS = args.includes("--fps") ? +args[args.indexOf("--fps") + 1] : 30;
// --length 150 plays the whole timeline faster so the video runs 150 s
const LENGTH = args.includes("--length") ? +args[args.indexOf("--length") + 1] : null;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on("pageerror", e => console.error("page error:", e.message));
  await p.goto("file://" + path.join(__dirname, "pitch.html"));
  await p.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(i => i.decode().catch(() => {}))); });
  if (stillsArg) {
    fs.mkdirSync(path.join(__dirname, "stills"), { recursive: true });
    for (const s of stillsArg.split(",").map(Number)) {
      await p.evaluate(t => window.render(t), s);
      await p.waitForTimeout(150);
      await p.screenshot({ path: path.join(__dirname, "stills", `t${s}.jpg`), type: "jpeg", quality: 80 });
      console.log("still", s);
    }
    return b.close();
  }
  const dur = await p.evaluate(() => window.DURATION);
  const len = LENGTH || dur, k = dur / len;
  const out = path.join(__dirname, "..", "video", LENGTH ? `currency-pitch-${LENGTH}s.mp4` : "currency-pitch-animation.mp4");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-",
    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out], { stdio: ["pipe", "inherit", "inherit"] });
  const N = Math.round(len * FPS), t0 = Date.now();
  for (let i = 0; i < N; i++) {
    await p.evaluate(t => window.render(t), (i / FPS) * k);
    const buf = await p.screenshot({ type: "jpeg", quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once("drain", r));
    if (i % 300 === 0) console.log(`frame ${i}/${N}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on("close", r));
  await b.close();
  console.log("wrote", out);
})();
