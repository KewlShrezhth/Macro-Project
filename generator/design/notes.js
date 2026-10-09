/* Denomination configs and the front/back layouts shared by every note. */
const DENOMS = {
  1: { v: 1, word1: "ONE", words: "ONE DOLLAR", theme: "Liberty",
       plate: "#232a27", primary: "#4f6b55", secondary: "#3b403e", tint1: "#d5e2d2", tint2: "#e3e7dc", paper: "#f4f3ec",
       pattern: "lattice", patternOpts: { gap: 6 }, ovi: ["#6a3f1a", "#b98a4e", "#7d8f55", "#2f5e45"],
       sealInk: "#1d1f1e", district: 2, letter: "B", city: "NEW YORK", serial: "SB 04718263 A", plateNo: "A 12", check: "B 4",
       thread: 556, dots: 1, front: { scene: "one-front", caption: "GEORGE WASHINGTON" }, back: { scene: "one-back", caption: "WASHINGTON CROSSING THE DELAWARE \u00b7 1776" } },
  5: { v: 5, word1: "FIVE", words: "FIVE DOLLARS", theme: "The Land",
       plate: "#2a2633", primary: "#66588a", secondary: "#4d5563", tint1: "#e0daea", tint2: "#e3e5ea", paper: "#f4f3f2",
       pattern: "rings", patternOpts: { gap: 5.5, centers: [[420, 330], [1180, 300]] }, ovi: ["#6a3f1a", "#b98a4e", "#7d8f55", "#2f5e45"],
       sealInk: "#1e1d22", district: 10, letter: "J", city: "KANSAS CITY", serial: "SJ 25930417 B", plateNo: "C 7", check: "J 2",
       thread: 1012, dots: 2, front: { scene: "five-front", caption: "EFRAIM DIVEROLI \u00b7 WAR DOGS" }, back: { scene: "five-back", caption: "WAR DOGS \u00b7 2016" } },
  10: { v: 10, word1: "TEN", words: "TEN DOLLARS", theme: "Innovation",
       plate: "#33231a", primary: "#a05f34", secondary: "#c06a2b", tint1: "#f1dcc6", tint2: "#efe2d2", paper: "#f6f2ea",
       pattern: "sunburst", patternOpts: { center: [780, 380] }, ovi: ["#5a3a14", "#c4954d", "#7f9a5a", "#2f6248"],
       sealInk: "#1f1a17", district: 7, letter: "G", city: "CHICAGO", serial: "SG 61842095 C", plateNo: "D 3", check: "G 9",
       thread: 572, dots: 3, front: { scene: "ten-front", caption: "STEVE JOBS" }, back: { scene: "ten-back", caption: "APPLE PARK \u00b7 CUPERTINO" } },
  20: { v: 20, word1: "TWENTY", words: "TWENTY DOLLARS", theme: "Wild America",
       plate: "#132b29", primary: "#1d5753", secondary: "#2e5b3b", tint1: "#cfe2dd", tint2: "#dbe6d1", paper: "#f4f3eb",
       pattern: "hexweave", patternOpts: { gap: 7 }, ovi: ["#6a3f1a", "#bf8e50", "#6f9a63", "#215a49"],
       sealInk: "#161c1b", district: 12, letter: "L", city: "SAN FRANCISCO", serial: "SL 39027584 D", plateNo: "F 8", check: "L 5",
       thread: 1028, dots: 4, front: { scene: "twenty-front", caption: "HARVEY SPECTER \u00b7 SUITS" }, back: { scene: "twenty-back", caption: "SUITS \u00b7 HARVEY & MIKE" } },
  50: { v: 50, word1: "FIFTY", words: "FIFTY DOLLARS", theme: "Democracy",
       plate: "#2e1519", primary: "#6e2232", secondary: "#a88645", tint1: "#ecd7d6", tint2: "#efe5cf", paper: "#f6f2ea",
       pattern: "chevron", patternOpts: { gap: 5.5 }, serialInk: "#7e5f25", sealColor: "#8f6f30", ovi: ["#6a2a1f", "#b7874a", "#8c9a55", "#2f5e45"],
       sealInk: "#1f1718", district: 5, letter: "E", city: "RICHMOND", serial: "SE 70365128 E", plateNo: "B 11", check: "E 6",
       thread: 588, dots: 5, front: { scene: "fifty-front", caption: "DRAKE" }, back: { scene: "fifty-back", caption: "TAKE CARE \u00b7 2011"} },
  100: { v: 100, word1: "ONE HUNDRED", words: "ONE HUNDRED DOLLARS", theme: "Unity",
       plate: "#141b30", primary: "#23345f", secondary: "#8e99a8", tint1: "#d7dceb", tint2: "#e4e7ec", paper: "#f3f3f1",
       pattern: "flow", patternOpts: { gap: 5 }, serialInk: "#2f4a78", sealColor: "#5d6878", ovi: ["#5e3a1c", "#b88c52", "#6e8f86", "#26505f"],
       sealInk: "#15171d", district: 11, letter: "K", city: "DALLAS", serial: "SK 85219406 F", plateNo: "E 2", check: "K 8",
       thread: 1044, dots: 6, front: { scene: "hundred-front", caption: "JORDAN BELFORT \u00b7 THE WOLF OF WALL STREET" }, back: { scene: "hundred-back", caption: "THE WOLF OF WALL STREET \u00b7 2013" } },
};
const SIGS = [["Eleanor Whitcombe", "Treasurer of the United States"], ["James T. Okafor", "Secretary of the Treasury"]];

// Shared grid. Fronts follow the classic U.S. arrangement: tall corner counters, a heavy shaded headline,
// a central portrait oval and the denomination banner on the bottom border.
const G = {
  oval: { cx: 780, cy: 352, rx: 146, ry: 180 },
  mem: { cx: 392, cy: 318, r: 86 },
  wm: { cx: 1168, cy: 280, rx: 74, ry: 92 },
  reg: { cx: 1168, cy: 412, r: 17 },
  vig: { x0: 500, y0: 162, x1: 1084, y1: 538, ys: 222 },   // back scene window
  head: 128,
};
const mx = x => W - x;
// Lengths follow the Australian scheme cited in Part 1: 156 mm for $1, then +7 mm per step (191 mm for $100).
const ORDER = [1, 5, 10, 20, 50, 100];
const noteWidth = v => BASE_W + 70 * ORDER.indexOf(v);
// Extra length is shared out between the open spaces: centre items move by half of it, right-hand items by all of it.
const shift = (k, inner) => k ? `<g transform="translate(${f(k)} 0)">${inner}</g>` : inner;
const frontThread = n => n.thread + (W - BASE_W) * (n.thread < 780 ? .25 : .75);
const svgOpen = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`;
function headline(n, id) { return slabText(n, id, "THE UNITED STATES OF AMERICA", W / 2, G.head, 46, 1010, { depth: 3 }); }

function front(n, img, memImg) {
  const id = "f" + n.v, s = String(n.v), d = W - BASE_W;
  let o = svgOpen() + defs(n, id);
  o += paperLayer(n, id);
  o += backgroundLayer(n, id, [{ type: "ellipse", ...G.wm, cx: G.wm.cx + d }]);
  o += securityThread(n, frontThread(n), false);
  o += border(n, id, "FEDERAL RESERVE NOTE", null);
  o += headline(n, id);
  o += plainText("THIS NOTE IS LEGAL TENDER", G.mem.cx, 162, `700 9px ${FONT.small}`, n.plate, { ls: 1.8 });
  o += plainText("FOR ALL DEBTS, PUBLIC AND PRIVATE", G.mem.cx, 174, `700 9px ${FONT.small}`, n.plate, { ls: 1.8 });
  o += memorial(n, id, G.mem.cx, G.mem.cy, G.mem.r, memImg);
  o += shift(d / 2, portraitOval(n, id, G.oval.cx, G.oval.cy, G.oval.rx, G.oval.ry, img, n.front.caption));
  o += signature(n, G.mem.cx, 518, ...SIGS[0]);
  o += shift(d, plainText("SERIES", 1036, 506, `700 8px ${FONT.small}`, n.plate, { ls: 1.5 }) + plainText("2026", 1036, 517, `700 10px ${FONT.small}`, n.plate, { ls: 1.5 }) + signature(n, G.wm.cx, 518, ...SIGS[1]));
  o += tactileStrip(n, id, 80, 330, 470);
  o += shift(d, watermarkSurround(n, G.wm.cx, G.wm.cy, G.wm.rx, G.wm.ry) + watermarkWindow(n, id, G.wm.cx, G.wm.cy, G.wm.rx, G.wm.ry, img, false) + register(n, G.reg.cx, G.reg.cy, G.reg.r, false));
  o += plainText(n.check, 214, 210, `700 11px ${FONT.small}`, n.plate, { anchor: "start" });
  o += shift(d, plainText(n.plateNo, 1346, 210, `700 11px ${FONT.small}`, n.plate, { anchor: "end" }));
  o += tallCounter(n, id, 70, 66, 124, 228, false) + tallCounter(n, id, W - 194, 66, 124, 228, true);
  o += roundCounter(n, id, 128, H - 128, 50, false);
  o += fillers(n, [[272, 560, 18]]) + shift(d / 4, fillers(n, [[562, 232, 34], [562, 470, 30]]));
  o += shift(d * .75, fillers(n, [[998, 232, 34], [998, 470, 30]])) + shift(d, fillers(n, [[1318, 470, 46]]));
  o += shift(d, oviNumeral(n, id, 1488, 600, s.length === 3 ? 92 : 118));
  o += banner(n, id, n.words);
  o += shift(d, specimen(n, G.wm.cx, 576));
  return o + "</svg>";
}

function back(n, img, frontImg, memImg) {
  const id = "b" + n.v, s = String(n.v), d = W - BASE_W;
  const v = G.vig;
  const panel = { x: 1132, y: 150, w: 200, h: 290 };
  const wmx = BASE_W - G.wm.cx;   // the front's watermark (moved right by d) lands here, seen through the paper
  let o = svgOpen() + defs(n, id);
  o += paperLayer(n, id);
  o += backgroundLayer(n, id, [{ type: "ellipse", ...G.wm, cx: wmx }, { type: "rect", x: panel.x - 20 + d, y: panel.y - 10, w: panel.w + 40, h: panel.h }]);
  o += securityThread(n, mx(frontThread(n)), true);
  o += border(n, id, "E PLURIBUS UNUM", null);
  o += headline(n, id);
  o += shift(d / 2, vignetteFrame(n, id, v, img, n.back.caption, n.back.overlay ? n.back.overlay(n, v) : "")
    + spray(n, id, [v.x0 - 10, v.y1 - 10], 150, 60, 3, 32, 12, true) + spray(n, id, [v.x1 + 10, v.y1 - 10], 30, 60, 3, 32, 12)
    + knot(n, v.x0 - 9, v.ys + 2, 15) + knot(n, v.x1 + 9, v.ys + 2, 15));
  o += watermarkSurround(n, wmx, G.wm.cy, G.wm.rx, G.wm.ry);
  o += watermarkWindow(n, id, wmx, G.wm.cy, G.wm.rx, G.wm.ry, frontImg, true);
  o += register(n, wmx, G.reg.cy, G.reg.r, true);
  o += fillers(n, [[262, 440, 32], [262, 272, 22], [1232, 590, 0]].filter(p => p[2]));
  o += fedSeal(n, id, wmx, 532, 44);
  o += tallCounter(n, id, 70, 66, 124, 228, false) + tallCounter(n, id, W - 194, 66, 124, 228, true);
  o += shift(d, numeralPanel(n, id, panel, s, n.word1) + treasurySeal(n, id, panel.x + panel.w / 2, 518, 42)
    + plainText(n.serial, panel.x + panel.w / 2, 588, `600 17px ${FONT.mono}`, n.serialInk || n.secondary, { ls: 1.5 }));
  o += tactileStrip(n, id, mx(80), 330, 470);
  o += plainText(n.serial, 214, 172, `600 17px ${FONT.mono}`, n.serialInk || n.secondary, { anchor: "start", ls: 1.5 });
  o += roundCounter(n, id, 128, H - 128, 50, false) + roundCounter(n, id, W - 128, H - 128, 50, true);
  o += banner(n, id, n.words);
  o += specimen(n, wmx, 458);
  return o + "</svg>";
}

/* Annotated sheet: the note with labelled call-outs in a margin. Feature names are placeholders until the Part 1 answers are supplied. */
const FEATURES = {
  // label: [x in note units, "top" | "bottom"]; desc is the one-line explanation under the name
  front: n => [
    { code: "A1", title: "Accessibility feature 1", name: "Large high-contrast numerals", desc: "Big numbers in several places", at: [132, 180], label: [200, "top"] },
    { code: "\u2605", title: "Extra feature", name: "Twin Towers & One WTC memorial", desc: "Shared design on every note", at: [392, 300], label: [560, "top"] },
    { code: "S2", title: "Security feature 2", name: "Security thread", desc: "Woven in, reads \"USA 1\", moves by value", at: [frontThread(n), 330], label: [900, "top"], exact: true },
    { code: "S3", title: "Security feature 3", name: "Watermark window", desc: "Portrait appears when held to light", at: [1168, 240], label: [1360, "top"] },
    { code: "A2", title: "Accessibility feature 2", name: "Tactile raised dots", desc: "1 dot = $1, up to 6 dots = $100", at: [80, 400], label: [200, "bottom"] },
    { code: "+", title: "Extra feature", name: "Microprinting", desc: "Tiny border text that blurs if copied", at: [600, 600], label: [590, "bottom"], exact: true },
    { code: "+", title: "Extra feature", name: "Different length per value", desc: "$1 is 156 mm, +7 mm per step", at: [1000, 640], label: [1000, "bottom"], exact: true },
    { code: "S1", title: "Security feature 1", name: "Color-shifting numeral", desc: "Copper to green when tilted", at: [1450, 570], label: [1380, "bottom"] },
  ],
  back: n => [
    { code: "SN", title: "Serial numbers", name: "Top left and lower right", desc: "Unique number on every note", at: [300, 166], label: [200, "top"] },
    { code: "S3", title: "Security feature 3", name: "Watermark (seen from back)", desc: "Visible from both sides", at: [392, 240], label: [560, "top"] },
    { code: "S2", title: "Security feature 2", name: "Thread (seen from back)", desc: "Same thread, through the paper", at: [mx(frontThread(n)), 330], label: [900, "top"], exact: true },
    { code: "A1", title: "Accessibility feature 1", name: "Large high-contrast numeral", desc: "Dark number on a light panel", at: [1232, 260], label: [1300, "top"] },
    { code: "FR", title: "Federal Reserve seal", name: `District ${n.district}, ${n.city.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}`, desc: "Issuing Federal Reserve Bank", at: [366, 532], label: [200, "bottom"] },
    { code: "+", title: "Extra security feature", name: "See-through register", desc: "Front and back marks line up in light", at: [412, 412], label: [560, "bottom"] },
    { code: "TS", title: "Treasury seal", name: "Department of the Treasury", desc: "Same spot on every note", at: [1232, 518], label: [1080, "bottom"] },
    { code: "A2", title: "Accessibility feature 2", name: "Tactile raised dots", desc: "Felt through from the front", at: [1480, 400], label: [1420, "bottom"] },
  ],
};
function annotated(n, side, noteSvg) {
  const M = { x: 110, y: 130 }, WW = W + 2 * M.x, HH = H + 2 * M.y;
  const inner = noteSvg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
  let o = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WW} ${HH}" width="${WW}" height="${HH}">
    <rect width="${WW}" height="${HH}" fill="#ffffff"/>
    <g transform="translate(${M.x} ${M.y})">${inner}</g>`;
  const d = W - BASE_W, X = x => x < 470 ? x : x > 1090 ? x + d : x + d / 2;
  for (const raw of FEATURES[side](n)) {
    const ft = { ...raw, at: [raw.exact ? raw.at[0] : X(raw.at[0]), raw.at[1]], label: [X(raw.label[0]), raw.label[1]] };
    const top = ft.label[1] === "top";
    const [ax, ay] = [ft.at[0] + M.x, ft.at[1] + M.y], lx = ft.label[0] + M.x, ly = top ? 52 : HH - 66;
    const ey = top ? ly + 44 : ly - 24;
    o += `<path d="M${ax} ${ay}L${ax} ${ey}L${lx} ${ey}" fill="none" stroke="#b3212b" stroke-width="1.2"/>
      <circle cx="${ax}" cy="${ay}" r="5" fill="#ffffff" stroke="#b3212b" stroke-width="2"/><circle cx="${ax}" cy="${ay}" r="1.8" fill="#b3212b"/>`;
    const tx = lx, ty = ly;
    o += `<g transform="translate(${tx} ${ty})">
      <text x="0" y="0" text-anchor="middle" style="font:700 15px 'IBM Plex Mono', monospace" fill="#b3212b">${ft.code} · ${esc(ft.title)}</text>
      <text x="0" y="19" text-anchor="middle" style="font:700 15px 'Old Standard TT', serif" fill="#1d1f24">${esc(ft.name)}</text>
      ${ft.desc ? `<text x="0" y="36" text-anchor="middle" style="font:italic 12.5px 'Old Standard TT', serif" fill="#4d525c">${esc(ft.desc)}</text>` : ""}
    </g>`;
  }
  return o + "</svg>";
}
