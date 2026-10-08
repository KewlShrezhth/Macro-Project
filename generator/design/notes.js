/* Denomination configs and the front/back layouts shared by every note. */
const DENOMS = {
  1: { v: 1, word1: "ONE", words: "ONE DOLLAR", theme: "Liberty",
       plate: "#232a27", primary: "#4f6b55", secondary: "#3b403e", tint1: "#d5e2d2", tint2: "#e3e7dc", paper: "#f4f3ec",
       pattern: "lattice", patternOpts: { gap: 6 }, ovi: ["#6a3f1a", "#b98a4e", "#7d8f55", "#2f5e45"],
       sealInk: "#1d1f1e", district: 2, letter: "B", city: "NEW YORK", serial: "SB 04718263 A", plateNo: "A 12", check: "B 4",
       thread: 1118, dots: 1, front: { scene: "one-front", caption: "THE LIBERTY BELL" }, back: { scene: "one-back", caption: "INDEPENDENCE HALL" } },
  5: { v: 5, word1: "FIVE", words: "FIVE DOLLARS", theme: "The Land",
       plate: "#2a2633", primary: "#66588a", secondary: "#4d5563", tint1: "#e0daea", tint2: "#e3e5ea", paper: "#f4f3f2",
       pattern: "rings", patternOpts: { gap: 5.5, centers: [[420, 330], [1180, 300]] }, ovi: ["#6a3f1a", "#b98a4e", "#7d8f55", "#2f5e45"],
       sealInk: "#1e1d22", district: 10, letter: "J", city: "KANSAS CITY", serial: "SJ 25930417 B", plateNo: "C 7", check: "J 2",
       thread: 444, dots: 2, front: { scene: "five-front", caption: "MONUMENT BUTTES" }, back: { scene: "five-back", caption: "THE COLORADO RIVER" } },
  10: { v: 10, word1: "TEN", words: "TEN DOLLARS", theme: "Discovery",
       plate: "#33231a", primary: "#a05f34", secondary: "#c06a2b", tint1: "#f1dcc6", tint2: "#efe2d2", paper: "#f6f2ea",
       pattern: "sunburst", patternOpts: { center: [780, 380] }, ovi: ["#5a3a14", "#c4954d", "#7f9a5a", "#2f6248"],
       sealInk: "#1f1a17", district: 7, letter: "G", city: "CHICAGO", serial: "SG 61842095 C", plateNo: "D 3", check: "G 9",
       thread: 1124, dots: 3, front: { scene: "ten-front", caption: "THE LAUNCH" }, back: { scene: "ten-back", caption: "EARTHRISE" } },
  20: { v: 20, word1: "TWENTY", words: "TWENTY DOLLARS", theme: "Wild America",
       plate: "#132b29", primary: "#1d5753", secondary: "#2e5b3b", tint1: "#cfe2dd", tint2: "#dbe6d1", paper: "#f4f3eb",
       pattern: "hexweave", patternOpts: { gap: 7 }, ovi: ["#6a3f1a", "#bf8e50", "#6f9a63", "#215a49"],
       sealInk: "#161c1b", district: 12, letter: "L", city: "SAN FRANCISCO", serial: "SL 39027584 D", plateNo: "F 8", check: "L 5",
       thread: 446, dots: 4, front: { scene: "twenty-front", caption: "THE HIGH SIERRA" }, back: { scene: "twenty-back", caption: "THE GIANT SEQUOIA GROVE" } },
  50: { v: 50, word1: "FIFTY", words: "FIFTY DOLLARS", theme: "Democracy",
       plate: "#2e1519", primary: "#6e2232", secondary: "#a88645", tint1: "#ecd7d6", tint2: "#efe5cf", paper: "#f6f2ea",
       pattern: "chevron", patternOpts: { gap: 5.5 }, ovi: ["#6a2a1f", "#b7874a", "#8c9a55", "#2f5e45"],
       sealInk: "#1f1718", district: 5, letter: "E", city: "RICHMOND", serial: "SE 70365128 E", plateNo: "B 11", check: "E 6",
       thread: 1130, dots: 5, front: { scene: "fifty-front", caption: "THE CAPITOL DOME" }, back: { scene: "fifty-back", caption: "THE HALL OF THE PEOPLE" } },
  100: { v: 100, word1: "ONE HUNDRED", words: "ONE HUNDRED DOLLARS", theme: "Unity",
       plate: "#141b30", primary: "#23345f", secondary: "#8e99a8", tint1: "#d7dceb", tint2: "#e4e7ec", paper: "#f3f3f1",
       pattern: "flow", patternOpts: { gap: 5 }, ovi: ["#5e3a1c", "#b88c52", "#6e8f86", "#26505f"],
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
  o += vignetteFrame(n, id, v, img, n.back.caption);
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
  o += plainText(n.serial, 152, 140, `600 17px ${FONT.mono}`, n.secondary, { anchor: "start", ls: 1.5 });
  o += plainText(n.serial, 1408, 592, `600 17px ${FONT.mono}`, n.secondary, { anchor: "end", ls: 1.5 });
  o += plainText(n.plateNo, 1470, 162, `700 9px ${FONT.small}`, n.plate, { anchor: "end" });
  o += cornerMedallion(n, 100, 100, G.corner) + cornerMedallion(n, mx(100), 100, G.corner) + cornerMedallion(n, 100, H - 100, G.corner) + cornerMedallion(n, mx(100), H - 100, G.corner);
  o += specimen(n, 264, 455);
  return o + "</svg>";
}
