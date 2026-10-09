const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
const S = process.argv[2], OUT = process.argv[3];
const notes = [
  [1, "One Dollar", "George Washington", "Washington Crossing the Delaware, 1776"],
  [5, "Five Dollars", "Jonah Hill as Efraim Diveroli (War Dogs)", "Scene from War Dogs"],
  [10, "Ten Dollars", "Steve Jobs", "Apple Park, Cupertino"],
  [20, "Twenty Dollars", "Harvey Specter (Suits)", "Harvey & Mike from Suits"],
  [50, "Fifty Dollars", "Drake", "Take Care album scene"],
  [100, "One Hundred Dollars", "Leonardo DiCaprio as Jordan Belfort (The Wolf of Wall Street)", "Scene from The Wolf of Wall Street"],
];
const img = f => "data:image/jpeg;base64," + fs.readFileSync(path.join(S, f)).toString("base64");
const pages = notes.map(([v, word, front, back], i) => {
  const mm = 156 + 7 * i;
  return `<section class="page">
    <h1>$${v} <span>· ${word}</span></h1>
    <p class="who">Front: <b>${front}</b></p>
    <div class="label">Front</div><img style="width:${mm}mm" src="${img(v + "-front.jpg")}">
    <div class="label">Back · ${back}</div><img style="width:${mm}mm" src="${img(v + "-back.jpg")}">
    <p class="foot">New American Note Series 2026 · Shown at actual size: ${mm} × 66 mm · Specimen, class project</p>
  </section>`;
}).join("");
// $1 only: labelled security, accessibility and extra features, front and back
const featurePage = side => `<section class="page wide">
    <h1>$1 <span>· ${side === "front" ? "Front" : "Back"} Features</span></h1>
    <p class="who">Security features (S1–S3), accessibility features (A1–A2) and extra features, labelled on the ${side}</p>
    <img class="ann" src="${img("1-" + side + "-ann.jpg")}">
    <p class="foot">New American Note Series 2026 · Specimen, class project</p>
  </section>`;
const firstEnd = pages.indexOf("</section>") + "</section>".length;
const doc = (body, size) => `<!doctype html><html><head><meta charset="utf-8"><style>
@page { size: ${size}; margin: 0; }
.page.wide { width: 279.4mm; height: 215.9mm; padding: 14mm 10mm 10mm; }
body { margin: 0; font-family: Georgia, 'Times New Roman', serif; color: #1c1f26; }
.page { width: 215.9mm; height: 279.4mm; box-sizing: border-box; padding: 18mm 12mm 12mm; page-break-after: always; display: flex; flex-direction: column; align-items: center; }
.page:last-child { page-break-after: auto; }
h1 { font-size: 30pt; margin: 0 0 2mm; letter-spacing: .5pt; }
h1 span { font-weight: normal; color: #555; font-size: 22pt; }
.who { font-size: 13pt; margin: 0 0 9mm; text-align: center; }
.label { align-self: center; font: 600 9pt Helvetica, Arial, sans-serif; letter-spacing: 1.5pt; text-transform: uppercase; color: #666; margin: 0 0 2mm; }
img { display: block; margin: 0 0 10mm; box-shadow: 0 0 0 .3mm #ccc; }
.ann { width: 100%; margin: 4mm 0 0; box-shadow: none; }
.foot { margin-top: auto; font: 8.5pt Helvetica, Arial, sans-serif; color: #888; }
</style></head><body>${body}</body></html>`;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  const parts = [
    [pages.slice(0, firstEnd), "215.9mm 279.4mm"],
    [featurePage("front") + featurePage("back"), "279.4mm 215.9mm"],
    [pages.slice(firstEnd), "215.9mm 279.4mm"],
  ].map(([body, size], i) => ({ body, size, file: OUT + ".part" + i + ".pdf" }));
  for (const part of parts) {
    await p.setContent(doc(part.body, part.size), { waitUntil: "load" });
    await p.pdf({ path: part.file, preferCSSPageSize: true, printBackground: true, margin: { top: 0, bottom: 0, left: 0, right: 0 } });
  }
  await b.close();
  require("child_process").execFileSync("pdfunite", [...parts.map(x => x.file), OUT]);
  parts.forEach(x => fs.unlinkSync(x.file));
  console.log("ok");
})();
