/* Denomination configs and the front/back layouts shared by every note. */
const DENOMS = {
  1: { v: 1, word1: "ONE", words: "ONE DOLLAR", theme: "Liberty",
       plate: "#232a27", primary: "#4f6b55", secondary: "#3b403e", tint1: "#d5e2d2", tint2: "#e3e7dc", paper: "#f4f3ec",
       pattern: "lattice", patternOpts: { gap: 6 }, ovi: ["#6a3f1a", "#b98a4e", "#7d8f55", "#2f5e45"],
       sealInk: "#1d1f1e", district: 2, letter: "B", city: "NEW YORK", serial: "SB 04718263 A", plateNo: "A 12", check: "B 4",
       thread: 1118, dots: 1, front: { scene: "one-front", caption: "GEORGE WASHINGTON" }, back: { scene: "one-back", caption: "WASHINGTON CROSSING THE DELAWARE \u00b7 1776" } },
  5: { v: 5, word1: "FIVE", words: "FIVE DOLLARS", theme: "The Land",
       plate: "#2a2633", primary: "#66588a", secondary: "#4d5563", tint1: "#e0daea", tint2: "#e3e5ea", paper: "#f4f3f2",
       pattern: "rings", patternOpts: { gap: 5.5, centers: [[420, 330], [1180, 300]] }, ovi: ["#6a3f1a", "#b98a4e", "#7d8f55", "#2f5e45"],
       sealInk: "#1e1d22", district: 10, letter: "J", city: "KANSAS CITY", serial: "SJ 25930417 B", plateNo: "C 7", check: "J 2",
       thread: 444, dots: 2, front: { scene: "five-front", caption: "EFRAIM DIVEROLI \u00b7 WAR DOGS" }, back: { scene: "five-back", caption: "THE COLORADO RIVER" } },
  10: { v: 10, word1: "TEN", words: "TEN DOLLARS", theme: "Innovation",
       plate: "#33231a", primary: "#a05f34", secondary: "#c06a2b", tint1: "#f1dcc6", tint2: "#efe2d2", paper: "#f6f2ea",
       pattern: "sunburst", patternOpts: { center: [780, 380] }, ovi: ["#5a3a14", "#c4954d", "#7f9a5a", "#2f6248"],
       sealInk: "#1f1a17", district: 7, letter: "G", city: "CHICAGO", serial: "SG 61842095 C", plateNo: "D 3", check: "G 9",
       thread: 1124, dots: 3, front: { scene: "ten-front", caption: "STEVE JOBS" }, back: { scene: "ten-back", caption: "APPLE PARK \u00b7 CUPERTINO" } },
  20: { v: 20, word1: "TWENTY", words: "TWENTY DOLLARS", theme: "Wild America",
       plate: "#132b29", primary: "#1d5753", secondary: "#2e5b3b", tint1: "#cfe2dd", tint2: "#dbe6d1", paper: "#f4f3eb",
       pattern: "hexweave", patternOpts: { gap: 7 }, ovi: ["#6a3f1a", "#bf8e50", "#6f9a63", "#215a49"],
       sealInk: "#161c1b", district: 12, letter: "L", city: "SAN FRANCISCO", serial: "SL 39027584 D", plateNo: "F 8", check: "L 5",
       thread: 446, dots: 4, front: { scene: "twenty-front", caption: "THE HIGH SIERRA" }, back: { scene: "twenty-back", caption: "THE GIANT SEQUOIA GROVE" } },
  50: { v: 50, word1: "FIFTY", words: "FIFTY DOLLARS", theme: "Democracy",
       plate: "#2e1519", primary: "#6e2232", secondary: "#a88645", tint1: "#ecd7d6", tint2: "#efe5cf", paper: "#f6f2ea",
       pattern: "chevron", patternOpts: { gap: 5.5 }, serialInk: "#7e5f25", sealColor: "#8f6f30", ovi: ["#6a2a1f", "#b7874a", "#8c9a55", "#2f5e45"],
       sealInk: "#1f1718", district: 5, letter: "E", city: "RICHMOND", serial: "SE 70365128 E", plateNo: "B 11", check: "E 6",
       thread: 1130, dots: 5, front: { scene: "fifty-front", caption: "DRAKE" }, back: { scene: "fifty-back", caption: "THE HALL OF THE PEOPLE", overlay: (n, v) => plainText("WE THE PEOPLE", v.x0 + .7 * (v.y1 - v.y0), v.y0 + .2905 * (v.y1 - v.y0), `700 14px ${FONT.caps}`, n.plate, { ls: 9 }) } },
  100: { v: 100, word1: "ONE HUNDRED", words: "ONE HUNDRED DOLLARS", theme: "Unity",
       plate: "#141b30", primary: "#23345f", secondary: "#8e99a8", tint1: "#d7dceb", tint2: "#e4e7ec", paper: "#f3f3f1",
       pattern: "flow", patternOpts: { gap: 5 }, serialInk: "#2f4a78", sealColor: "#5d6878", ovi: ["#5e3a1c", "#b88c52", "#6e8f86", "#26505f"],
       sealInk: "#15171d", district: 11, letter: "K", city: "DALLAS", serial: "SK 85219406 F", plateNo: "E 2", check: "K 8",
       thread: 452, dots: 6, front: { scene: "hundred-front", caption: "THE GOLDEN GATE" }, back: { scene: "hundred-back", caption: "ACROSS THE STRAIT" } },
};
const SIGS = [["Eleanor Whitcombe", "Treasurer of the United States"], ["James T. Okafor", "Secretary of the Treasury"]];

// Shared grid
const G = {
  vig: { x0: 488, y0: 150, x1: 1072, y1: 568, ys: 214 },   // inner image area of the arched window
  big: { cx: 265, cy: 292, R: 150 },
  wm: { cx: 1296, cy: 254, rx: 90, ry: 106 },
  reg: { cx: 1296, cy: 408, r: 19 },
  corner: 40,
  head: 117,
};
const mx = x => W - x;

function front(n, img) {
  const id = "f" + n.v, s = String(n.v);
  const v = G.vig;
  let o = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${defs(n, id)}`;
  o += paperLayer(n, id);
  o += backgroundLayer(n, id, [{ type: "ellipse", ...G.wm }]);
  o += securityThread(n, n.thread, false);
  o += border(n, id, "FEDERAL RESERVE NOTE", n.words);
  o += engravedText(n, id, "UNITED STATES OF AMERICA", W / 2, G.head, 33, { ls: 6 });
  o += vignetteFrame(n, id, v, img, n.front.caption);
  o += knot(n, v.x0 - 9, v.ys + 2, 15) + knot(n, v.x1 + 9, v.ys + 2, 15);
  o += bigMedallion(n, id, G.big.cx, G.big.cy, G.big.R);
  // series, signatures, legal tender
  o += plainText("SERIES 2026", G.big.cx, 470, `700 10px ${FONT.small}`, n.plate, { ls: 4 });
  o += `<path d="M${G.big.cx - 98} 466.5h40M${G.big.cx + 58} 466.5h40" stroke="${n.plate}" stroke-width=".5"/>`;
  o += signature(n, 196, 523, ...SIGS[0]) + signature(n, 336, 523, ...SIGS[1]);
  o += plainText("THIS NOTE IS LEGAL TENDER", 266, 563, `700 6.6px ${FONT.small}`, n.plate, { ls: 1.6 });
  o += plainText("FOR ALL DEBTS, PUBLIC AND PRIVATE", 266, 573, `700 6.6px ${FONT.small}`, n.plate, { ls: 1.6 });
  o += tactileStrip(n, id, 80, 196, 404);
  // right panel
  o += watermarkSurround(n, G.wm.cx, G.wm.cy, G.wm.rx, G.wm.ry);
  o += watermarkWindow(n, id, G.wm.cx, G.wm.cy, G.wm.rx, G.wm.ry, img, false);
  o += register(n, G.reg.cx, G.reg.cy, G.reg.r, false);
  o += oviNumeral(n, id, 1440, 580, s.length === 3 ? 108 : 130);
  o += plainText(n.check, 150, 166, `700 10px ${FONT.small}`, n.plate, { anchor: "start" });
  o += plainText(n.plateNo, 1470, 162, `700 9px ${FONT.small}`, n.plate, { anchor: "end" });
  // corners
  o += cornerMedallion(n, 100, 100, G.corner) + cornerMedallion(n, mx(100), 100, G.corner) + cornerMedallion(n, 100, H - 100, G.corner);
  o += specimen(n, 1296, 455);
  return o + "</svg>";
}

function back(n, img, frontImg) {
  const id = "b" + n.v, s = String(n.v);
  const v = G.vig;
  const panel = { x: 1150, y: 158, w: 262, h: 282 };
  let o = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${defs(n, id)}`;
  o += paperLayer(n, id);
  o += backgroundLayer(n, id, [{ type: "ellipse", ...G.wm, cx: mx(G.wm.cx) }, { type: "rect", x: panel.x - 12, y: panel.y - 12, w: panel.w + 24, h: panel.h + 24 }]);
  o += securityThread(n, mx(n.thread), true);
  o += border(n, id, "E PLURIBUS UNUM", n.words);
  o += engravedText(n, id, "UNITED STATES OF AMERICA", W / 2, G.head, 33, { ls: 6 });
  o += vignetteFrame(n, id, v, img, n.back.caption, n.back.overlay ? n.back.overlay(n, v) : "");
  o += knot(n, v.x0 - 9, v.ys + 2, 15) + knot(n, v.x1 + 9, v.ys + 2, 15);
  // left: watermark seen from the back, register, Federal Reserve seal
  o += watermarkSurround(n, mx(G.wm.cx), G.wm.cy, G.wm.rx, G.wm.ry);
  o += watermarkWindow(n, id, mx(G.wm.cx), G.wm.cy, G.wm.rx, G.wm.ry, frontImg, true);
  o += register(n, mx(G.reg.cx), G.reg.cy, G.reg.r, true);
  o += fedSeal(n, id, mx(G.wm.cx), 520, 46);
  // right: high-contrast numeral panel and Treasury seal
  o += numeralPanel(n, id, panel, s, n.word1);
  o += treasurySeal(n, id, G.wm.cx, 520, 46);
  o += tactileStrip(n, id, mx(80), 196, 404);
  // serial numbers
  o += plainText(n.serial, 152, 140, `600 17px ${FONT.mono}`, n.serialInk || n.secondary, { anchor: "start", ls: 1.5 });
  o += plainText(n.serial, 1408, 592, `600 17px ${FONT.mono}`, n.serialInk || n.secondary, { anchor: "end", ls: 1.5 });
  o += plainText(n.plateNo, 1470, 162, `700 9px ${FONT.small}`, n.plate, { anchor: "end" });
  o += cornerMedallion(n, 100, 100, G.corner) + cornerMedallion(n, mx(100), 100, G.corner) + cornerMedallion(n, 100, H - 100, G.corner) + cornerMedallion(n, mx(100), H - 100, G.corner);
  o += specimen(n, 264, 455);
  return o + "</svg>";
}

/* Annotated sheet: the note with labelled call-outs in a margin. Feature names are placeholders until the Part 1 answers are supplied. */
const FEATURES = {
  // label: [x in note units, "top" | "bottom"]
  front: n => [
    { code: "A1", title: "Accessibility feature 1", name: "Large high-contrast numeral", at: [210, 270], label: [200, "top"] },
    { code: "S2", title: "Security feature 2", name: "Security thread", at: [n.thread, 330], label: [n.thread < 780 ? 540 : 1010, "top"] },
    { code: "S3", title: "Security feature 3", name: "Watermark window", at: [1296, 200], label: [1360, "top"] },
    { code: "A2", title: "Accessibility feature 2", name: "Tactile raised dots", at: [80, 300], label: [200, "bottom"] },
    { code: "\u2014", title: "Marking", name: "SPECIMEN \u00b7 class project", at: [1296, 455], label: [1010, "bottom"], fixed: true },
    { code: "S1", title: "Security feature 1", name: "Colour-shifting numeral", at: [1372, 535], label: [1360, "bottom"] },
  ],
  back: n => [
    { code: "SN", title: "Serial numbers", name: "Top left and bottom right", at: [310, 134], label: [200, "top"], fixed: true },
    { code: "S3", title: "Security feature 3", name: "Watermark (seen from back)", at: [250, 250], label: [540, "top"] },
    { code: "S2", title: "Security feature 2", name: "Thread (seen from back)", at: [mx(n.thread), 330], label: [mx(n.thread) < 780 ? 880 : 1040, "top"] },
    { code: "A1", title: "Accessibility feature 1", name: "Large high-contrast numeral", at: [1281, 300], label: [1380, "top"] },
    { code: "FR", title: "Federal Reserve seal", name: `District ${n.district}, ${n.city.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}`, at: [282, 520], label: [200, "bottom"], fixed: true },
    { code: "S4", title: "Additional security feature", name: "See-through register", at: [246, 408], label: [540, "bottom"] },
    { code: "TS", title: "Treasury seal", name: "Lower right, every note", at: [1296, 520], label: [1110, "bottom"], fixed: true },
    { code: "A2", title: "Accessibility feature 2", name: "Tactile raised dots", at: [1480, 300], label: [1420, "bottom"] },
  ],
};
function annotated(n, side, noteSvg) {
  const M = { x: 110, y: 130 }, WW = W + 2 * M.x, HH = H + 2 * M.y;
  const inner = noteSvg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
  let o = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WW} ${HH}" width="${WW}" height="${HH}">
    <rect width="${WW}" height="${HH}" fill="#ffffff"/>
    <g transform="translate(${M.x} ${M.y})">${inner}</g>`;
  for (const ft of FEATURES[side](n)) {
    const top = ft.label[1] === "top";
    const [ax, ay] = [ft.at[0] + M.x, ft.at[1] + M.y], lx = ft.label[0] + M.x, ly = top ? 52 : HH - 66;
    const ey = top ? ly + 44 : ly - 24;
    o += `<path d="M${ax} ${ay}L${ax} ${ey}L${lx} ${ey}" fill="none" stroke="#b3212b" stroke-width="1.2"/>
      <circle cx="${ax}" cy="${ay}" r="5" fill="#ffffff" stroke="#b3212b" stroke-width="2"/><circle cx="${ax}" cy="${ay}" r="1.8" fill="#b3212b"/>`;
    const tx = lx, ty = ly;
    o += `<g transform="translate(${tx} ${ty})">
      <text x="0" y="0" text-anchor="middle" style="font:700 15px 'IBM Plex Mono', monospace" fill="#b3212b">${ft.code} · ${esc(ft.title)}</text>
      <text x="0" y="19" text-anchor="middle" style="font:700 15px 'Old Standard TT', serif" fill="#1d1f24">${esc(ft.name)}</text>
      ${ft.fixed ? "" : `<text x="0" y="36" text-anchor="middle" style="font:italic 12.5px 'Old Standard TT', serif" fill="#6a6f78">Placeholder: replace with Part 1 answer</text>`}
    </g>`;
  }
  o += `<text x="${WW / 2}" y="${HH - 16}" text-anchor="middle" style="font:700 13px 'IBM Plex Mono', monospace" fill="#6a6f78">$${n.v} · ${side.toUpperCase()} · ${esc(n.theme.toUpperCase())}</text>`;
  return o + "</svg>";
}
