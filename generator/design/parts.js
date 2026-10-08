/* Note components. Each takes the denomination config `n` (colours, words) and returns SVG markup. */
const W = 1560, H = 660;
const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const FONT = {
  caps: "Cinzel, serif",
  small: "'Old Standard TT', serif",
  num: "'Playfair Display', serif",
  script: "'Pinyon Script', cursive",
  mono: "'IBM Plex Mono', monospace",
};

function defs(n, id) {
  return `<defs>
    <pattern id="${id}-hatch" width="6" height="1.45" patternUnits="userSpaceOnUse"><rect width="6" height=".78" fill="${n.plate}"/></pattern>
    <pattern id="${id}-hatch2" width="6" height="1.2" patternUnits="userSpaceOnUse"><rect width="6" height=".55" fill="${n.primary}"/></pattern>
    <pattern id="${id}-ovitex" width="2.2" height="2.2" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><rect width="2.2" height=".7" fill="rgba(255,240,215,.35)"/></pattern>
    <linearGradient id="${id}-iris" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${n.tint1}"/><stop offset=".3" stop-color="${n.tint1}" stop-opacity=".55"/><stop offset=".5" stop-color="${n.paper}"/><stop offset=".72" stop-color="${n.tint2}"/><stop offset="1" stop-color="${n.tint2}"/>
    </linearGradient>
    <linearGradient id="${id}-vfade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${n.primary}" stop-opacity=".07"/><stop offset=".45" stop-color="${n.primary}" stop-opacity="0"/><stop offset="1" stop-color="${n.secondary}" stop-opacity=".08"/></linearGradient>
    <radialGradient id="${id}-glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${n.paper}" stop-opacity=".9"/><stop offset="1" stop-color="${n.paper}" stop-opacity="0"/></radialGradient>
    <linearGradient id="${id}-ovi" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${n.ovi[0]}"/><stop offset=".45" stop-color="${n.ovi[1]}"/><stop offset=".7" stop-color="${n.ovi[2]}"/><stop offset="1" stop-color="${n.ovi[3]}"/>
    </linearGradient>
    <radialGradient id="${id}-wmfade" cx=".5" cy=".5" r=".5"><stop offset=".72" stop-color="#000"/><stop offset="1" stop-color="#fff"/></radialGradient>
    <filter id="${id}-paper" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="2" seed="${n.v}"/>
      <feColorMatrix values="0 0 0 0 .35  0 0 0 0 .33  0 0 0 0 .28  0 0 0 -1.1 .62"/>
    </filter>
    <filter id="${id}-ghost" x="-10%" y="-10%" width="120%" height="120%">
      <feColorMatrix type="saturate" values="0"/><feGaussianBlur stdDeviation="1.6"/>
    </filter>
    <filter id="${id}-emboss" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="1.2" result="b"/>
      <feSpecularLighting in="b" surfaceScale="3" specularConstant=".9" specularExponent="18" lighting-color="#fff" result="s"><feDistantLight azimuth="225" elevation="40"/></feSpecularLighting>
      <feComposite in="s" in2="SourceAlpha" operator="in"/>
    </filter>
  </defs>`;
}

function paperLayer(n, id) {
  const r = lcg(n.v * 97 + 5);
  let fib = "";
  for (let i = 0; i < 160; i++) {
    const x = r() * W, y = r() * H, a = r() * TAU, l = 5 + r() * 9;
    fib += `<path d="M${f(x)} ${f(y)}q${f(Math.cos(a + .7) * l * .6)} ${f(Math.sin(a + .7) * l * .6)} ${f(Math.cos(a) * l)} ${f(Math.sin(a) * l)}" stroke="${r() > .5 ? "#b33a44" : "#3a5aa8"}"/>`;
  }
  return `<rect width="${W}" height="${H}" fill="${n.paper}"/>
    <rect width="${W}" height="${H}" filter="url(#${id}-paper)" opacity=".55"/>
    <g fill="none" stroke-width=".4" opacity=".5">${fib}</g>`;
}

/* offset-printed tints and the denomination's fine-line security field, kept out of clear areas */
function backgroundLayer(n, id, clearAreas) {
  const pat = PATTERNS[n.pattern](60, 60, W - 60, H - 60, { stroke: n.secondary, sw: .3, ...n.patternOpts });
  const holes = clearAreas.map(a => a.type === "ellipse"
    ? `<ellipse cx="${a.cx}" cy="${a.cy}" rx="${a.rx * 1.18}" ry="${a.ry * 1.18}" fill="url(#${id}-wmfade)"/>`
    : `<rect x="${a.x}" y="${a.y}" width="${a.w}" height="${a.h}" rx="6" fill="#000"/>`).join("");
  return `<mask id="${id}-bgmask"><rect width="${W}" height="${H}" fill="#fff"/>${holes}</mask>
    <g mask="url(#${id}-bgmask)">
      <rect x="18" y="18" width="${W - 36}" height="${H - 36}" fill="url(#${id}-iris)"/>
      <rect x="18" y="18" width="${W - 36}" height="${H - 36}" fill="url(#${id}-vfade)"/>
      <g opacity=".42">${pat}</g>
    </g>`;
}

function border(n, id, topWord, bottomWord) {
  const band = rectPts(34, 34, W - 34, H - 34, 10);
  const micro = `UNITED STATES OF AMERICA • ${n.words} • `.repeat(30);
  let o = `<rect x="18" y="18" width="${W - 36}" height="${H - 36}" rx="3" fill="none" stroke="${n.plate}" stroke-width="1.3"/>`;
  o += `<path d="${poly(rectPts(19, 19, W - 19, H - 19, 3), true)}M50 50H${W - 50}V${H - 50}H50Z" fill="${n.paper}" fill-rule="evenodd"/>`;
  o += `<path d="${poly(rectPts(19, 19, W - 19, H - 19, 3), true)}M50 50H${W - 50}V${H - 50}H50Z" fill="${n.tint1}" fill-rule="evenodd" opacity=".5"/>`;
  o += latheBand(band, { w: 25, wave: 15, count: 7, stroke: n.primary, sw: .26 });
  o += latheBand(band, { w: 25, wave: 46, count: 2, stroke: n.secondary, sw: .45 });
  o += `<path d="${poly(rectPts(22.5, 22.5, W - 22.5, H - 22.5, 1), true)}M46.5 46.5H${W - 46.5}V${H - 46.5}H46.5Z" fill="none" stroke="${n.plate}" stroke-width=".3"/>`;
  o += `<rect x="50" y="50" width="${W - 100}" height="${H - 100}" fill="none" stroke="${n.plate}" stroke-width="1"/>`;
  o += `<rect x="53.6" y="53.6" width="${W - 107.2}" height="${H - 107.2}" fill="none" stroke="${n.plate}" stroke-width=".35"/>`;
  o += `<path id="${id}-mp" d="M58 58H${W - 58}V${H - 58}H58Z" fill="none"/>
    <text font-family="${FONT.small}" font-size="3.4" font-weight="700" fill="${n.plate}" letter-spacing=".2"><textPath href="#${id}-mp" textLength="${2 * (W - 116) + 2 * (H - 116) - 4}" lengthAdjust="spacingAndGlyphs">${micro.slice(0, 1180)}</textPath></text>`;
  // corner blocks
  for (const [x, y] of [[18, 18], [W - 50, 18], [18, H - 50], [W - 50, H - 50]]) {
    o += `<rect x="${x}" y="${y}" width="32" height="32" fill="${n.paper}" stroke="${n.plate}" stroke-width=".9"/>`;
    o += rosetteRing(x + 16, y + 16, 4, 14, { lobes: 12, count: 8, stroke: n.primary, sw: .28 });
    o += rings(x + 16, y + 16, [14.5, 3.6], n.plate, .5);
  }
  o += cartouche(n, W / 2, 34, topWord, `600 11.5px ${FONT.caps}`, 4.5, 15);
  o += cartouche(n, W / 2, H - 34, bottomWord, `700 15px ${FONT.caps}`, 4.5, 17);
  return o;
}
function cartouche(n, cx, cy, text, font, ls, h) {
  const w = measure(text, font, ls) + 64;
  const x0 = cx - w / 2, x1 = cx + w / 2;
  const shape = `M${f(x0)} ${cy}L${f(x0 + 14)} ${cy - h}H${f(x1 - 14)}L${f(x1)} ${cy}L${f(x1 - 14)} ${cy + h}H${f(x0 + 14)}Z`;
  const inner = `M${f(x0 + 6)} ${cy}L${f(x0 + 17)} ${cy - h + 3.5}H${f(x1 - 17)}L${f(x1 - 6)} ${cy}L${f(x1 - 17)} ${cy + h - 3.5}H${f(x0 + 17)}Z`;
  return `<path d="${shape}" fill="${n.paper}" stroke="${n.plate}" stroke-width="1.1"/>
    <path d="${inner}" fill="none" stroke="${n.plate}" stroke-width=".4"/>
    ${beads(x0 + 8.5, cy, 0, 1, 1.6, n.plate)}${beads(x1 - 8.5, cy, 0, 1, 1.6, n.plate)}
    <text x="${cx}" y="${cy + parseFloat(font.match(/(\d+(\.\d+)?)px/)[1]) * .36}" text-anchor="middle" style="font:${font};letter-spacing:${ls}px" fill="${n.plate}">${esc(text)}</text>`;
}

/* shaded engraved lettering: line-hatched fill, hairline outline, offset shadow */
function engravedText(n, id, text, x, y, size, opts = {}) {
  const { family = FONT.caps, weight = 700, ls = 0, anchor = "middle", shadow = true } = opts;
  const st = `font-family:${family};font-weight:${weight};font-size:${size}px;letter-spacing:${ls}px`;
  return (shadow ? `<text x="${x + size * .03}" y="${y + size * .03}" text-anchor="${anchor}" style="${st}" fill="${n.secondary}" opacity=".45">${esc(text)}</text>` : "") +
    `<text x="${x}" y="${y}" text-anchor="${anchor}" style="${st}" fill="url(#${id}-hatch)" stroke="${n.plate}" stroke-width="${(size * .012).toFixed(2)}">${esc(text)}</text>`;
}
function plainText(text, x, y, font, fill, opts = {}) {
  const { anchor = "middle", ls = 0, extra = "" } = opts;
  return `<text x="${f(x)}" y="${f(y)}" text-anchor="${anchor}" style="font:${font};letter-spacing:${ls}px" fill="${fill}" ${extra}>${esc(text)}</text>`;
}
let _ctx;
function measure(text, font, ls = 0) {
  _ctx = _ctx || document.createElement("canvas").getContext("2d");
  _ctx.font = font; return _ctx.measureText(text).width + ls * text.length;
}
function numeralSize(s, box) { return s.length === 1 ? box * 1.25 : s.length === 2 ? box * .95 : box * .68; }

function cornerMedallion(n, cx, cy, r) {
  const s = String(n.v);
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${n.paper}"/>
    ${rosetteRing(cx, cy, r * .62, r * .95, { lobes: 22, count: 8, stroke: n.primary, sw: .24 })}
    ${beads(cx, cy, r - 1.4, 72, .55, n.plate)}
    ${rings(cx, cy, [r, r * .97], n.plate, .5)}${rings(cx, cy, [r * .6], n.plate, .9)}
    <circle cx="${cx}" cy="${cy}" r="${r * .58}" fill="${n.paper}"/>
    ${rings(cx, cy, [r * .53], n.plate, .35)}
    ${plainText(s, cx, cy + numeralSize(s, r * .6) * .35, `900 ${f(numeralSize(s, r * .6))}px ${FONT.num}`, n.plate)}`;
}

/* the front's large high-contrast numeral (placeholder A1), set in a layered lathe medallion */
function bigMedallion(n, id, cx, cy, R) {
  const s = String(n.v);
  const disc = R * .55;
  let o = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${n.paper}" opacity=".7"/>`;
  o += beads(cx, cy, R - 1.5, 150, .9, n.plate);
  o += rosetteRing(cx, cy, R * .82, R * .985, { lobes: 54, count: 14, stroke: n.primary, sw: .28 });
  o += rings(cx, cy, [R * .815, R * .8], n.plate, .45);
  o += rosetteRing(cx, cy, disc + 2, R * .79, { lobes: 30, count: 22, stroke: n.secondary, sw: .26 });
  o += rosetteRing(cx, cy, disc + 6, R * .7, { lobes: 15, count: 10, stroke: n.primary, sw: .3, families: 1 });
  o += `<circle cx="${cx}" cy="${cy}" r="${disc}" fill="${n.paper}"/>`;
  o += rings(cx, cy, [disc, disc - 3], n.plate, 1) + rings(cx, cy, [disc - 5], n.plate, .3);
  const fs = s.length === 1 ? disc * 1.55 : s.length === 2 ? disc * 1.2 : disc * .86;
  o += plainText(s, cx, cy + fs * .28, `900 ${f(fs)}px ${FONT.num}`, n.plate);
  o += `<path id="${id}-mw" d="M${cx - disc + 11} ${cy} A${disc - 11} ${disc - 11} 0 0 0 ${cx + disc - 11} ${cy}" fill="none"/>
    <text style="font:700 8.5px ${FONT.caps};letter-spacing:3px" fill="${n.plate}" text-anchor="middle"><textPath href="#${id}-mw" startOffset="50%">${n.word1}</textPath></text>`;
  return o;
}

/* arched vignette window with a triple frame */
function vignetteFrame(n, id, box, img, caption, overlay = "") {
  const { x0, y0, x1, y1, ys } = box;
  const inner = archPts(x0, y0, x1, y1, ys, 4);
  const mid = offsetPts(inner, 9), outer = offsetPts(inner, 18);
  let o = `<clipPath id="${id}-arch"><path d="${poly(inner, true)}"/></clipPath>`;
  o += `<path d="${poly(outer, true)}" fill="${n.paper}"/>`;
  o += `<g clip-path="url(#${id}-arch)"><rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="${n.paper}"/>
        <rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="${n.tint1}" opacity=".35"/>
        <image href="${img}" x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" preserveAspectRatio="none"/>${overlay}</g>`;
  o += `<path d="${poly(offsetPts(inner, 15.4), true)}${poly(offsetPts(inner, 2.6), true).replace("M", "M")}" fill="${n.tint1}" fill-rule="evenodd" opacity=".6"/>`;
  o += latheBand(mid, { w: 11.5, wave: 12, count: 6, stroke: n.primary, sw: .3 });
  o += latheBand(mid, { w: 11.5, wave: 40, count: 2, stroke: n.secondary, sw: .45 });
  o += `<path d="${poly(inner, true)}" fill="none" stroke="${n.plate}" stroke-width="1.4"/>`;
  o += `<path d="${poly(offsetPts(inner, 2.6), true)}" fill="none" stroke="${n.plate}" stroke-width=".35"/>`;
  o += `<path d="${poly(offsetPts(inner, 15.4), true)}" fill="none" stroke="${n.plate}" stroke-width=".35"/>`;
  o += `<path d="${poly(outer, true)}" fill="none" stroke="${n.plate}" stroke-width="1.1"/>`;
  // caption tablet across the bottom of the frame
  const font = `700 9px ${FONT.caps}`, w = measure(caption, font, 3) + 40, cx = (x0 + x1) / 2, cy = y1 + 9;
  o += `<rect x="${f(cx - w / 2)}" y="${cy - 9}" width="${f(w)}" height="18" fill="${n.paper}" stroke="${n.plate}" stroke-width=".9"/>
        <rect x="${f(cx - w / 2 + 3)}" y="${cy - 6}" width="${f(w - 6)}" height="12" fill="none" stroke="${n.plate}" stroke-width=".3"/>`;
  o += plainText(caption, cx, cy + 3.2, font, n.plate, { ls: 3 });
  return o;
}

function securityThread(n, x, mirrored) {
  const txt = `USA ${n.v}  `.repeat(60);
  return `<g opacity=".9">
    <rect x="${x - 4.5}" y="18" width="9" height="${H - 36}" fill="${n.plate}" opacity=".1"/>
    <line x1="${x - 4.5}" y1="18" x2="${x - 4.5}" y2="${H - 18}" stroke="${n.plate}" stroke-width=".25" opacity=".4"/>
    <line x1="${x + 4.5}" y1="18" x2="${x + 4.5}" y2="${H - 18}" stroke="${n.plate}" stroke-width=".25" opacity=".4"/>
    <text transform="translate(${x - 2.2} 22) rotate(90)${mirrored ? " scale(1 -1) translate(0 -4.4)" : ""}" style="font:700 5px ${FONT.small};letter-spacing:.4px" fill="${n.plate}" opacity=".55" textLength="${H - 44}" lengthAdjust="spacingAndGlyphs">${txt.slice(0, 150)}</text>
  </g>`;
}
function tactileStrip(n, id, x, y0, y1) {
  let dots = "";
  const gap = 30, start = (y0 + y1) / 2 - (n.dots - 1) * gap / 2;
  for (let i = 0; i < n.dots; i++) dots += `<circle cx="${x}" cy="${start + i * gap}" r="7.5"/>`;
  let frames = "";
  for (let i = 0; i < n.dots; i++) {
    const cy = start + i * gap;
    frames += `<circle cx="${x}" cy="${cy}" r="11.5" fill="${n.paper}"/>` + rosetteRing(x, cy, 8.4, 11.5, { lobes: 16, count: 4, stroke: n.primary, sw: .22 }) + rings(x, cy, [11.8, 8.2], n.plate, .4);
  }
  return `<path d="M${x} ${y0}V${y1}" stroke="${n.plate}" stroke-width=".35" stroke-dasharray="1 2"/>${frames}
    <g fill="${n.tint1}" stroke="${n.plate}" stroke-width=".35">${dots.replace(/r="7.5"/g, 'r="6.6"')}</g>
    <g filter="url(#${id}-emboss)" fill="#000">${dots.replace(/r="7.5"/g, 'r="6.6"')}</g>`;
}
function watermarkWindow(n, id, cx, cy, rx, ry, img, mirrored) {
  return `<clipPath id="${id}-wm"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/></clipPath>
    <g clip-path="url(#${id}-wm)" opacity=".2" filter="url(#${id}-ghost)">
      <image href="${img}" x="${cx - ry * 1.45}" y="${cy - ry}" width="${ry * 2.9}" height="${ry * 2}" preserveAspectRatio="xMidYMid slice"${mirrored ? ` transform="translate(${2 * cx} 0) scale(-1 1)"` : ""}/>
    </g>`;
}
function oviNumeral(n, id, xr, yb, size) {
  const s = String(n.v), font = `900 ${size}px ${FONT.num}`;
  return `<text x="${xr}" y="${yb}" text-anchor="end" style="font:${font}" fill="url(#${id}-ovi)">${s}</text>
    <text x="${xr}" y="${yb}" text-anchor="end" style="font:${font}" fill="url(#${id}-ovitex)">${s}</text>
    <text x="${xr}" y="${yb}" text-anchor="end" style="font:${font}" fill="none" stroke="${n.plate}" stroke-width=".7">${s}</text>`;
}
// see-through register: each side prints alternate segments of a star rosette; held to light they complete it
function register(n, cx, cy, r, back) {
  let o = `<circle cx="${cx}" cy="${cy}" r="${r + 3}" fill="none" stroke="${n.plate}" stroke-width=".4"/>`;
  const seg = 16;
  for (let i = 0; i < seg; i++) {
    if ((i % 2 === 0) === back) continue;
    let a0 = i / seg * TAU - Math.PI / 2, a1 = (i + 1) / seg * TAU - Math.PI / 2;
    if (back) { const m0 = Math.PI - a1, m1 = Math.PI - a0; a0 = m0; a1 = m1; }
    const am = (a0 + a1) / 2, ri = r * .3;
    const P = (a, rr) => `${f(cx + rr * Math.cos(a))} ${f(cy + rr * Math.sin(a))}`;
    o += `<path d="M${P(a0, ri)}L${P(am, r)}L${P(a1, ri)}Z" fill="${n.primary}"/>`;
    o += `<path d="M${P(am, ri)}L${P(am, r * .92)}" stroke="${n.paper}" stroke-width=".45"/>`;
  }
  o += rosetteRing(cx, cy, r + 4, r + 11, { lobes: 24, count: 5, stroke: n.primary, sw: .25 });
  return o + rings(cx, cy, [r + 11.5, r * .28], n.plate, .5);
}
/* small rosette used where frames meet */
function knot(n, cx, cy, r) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${n.paper}"/>` +
    rosetteRing(cx, cy, r * .35, r * .97, { lobes: 14, count: 7, stroke: n.primary, sw: .25 }) +
    rings(cx, cy, [r, r * .35], n.plate, .6) + `<circle cx="${cx}" cy="${cy}" r="${r * .16}" fill="${n.plate}"/>`;
}
/* faint lathe field printed behind a panel to give it depth */
function panelField(n, cx, cy, R) {
  return `<g opacity=".3">${rosetteRing(cx, cy, R * .74, R, { lobes: 64, count: 10, stroke: n.primary, sw: .2 })}</g>`;
}
function watermarkSurround(n, cx, cy, rx, ry) {
  const pts = ellipsePts(cx, cy, rx + 9, ry + 9, 400);
  return `<g opacity=".7">${latheBand(pts, { w: 8, wave: 9, count: 5, stroke: n.primary, sw: .24 })}</g>`;
}

function fedSeal(n, id, cx, cy, r) {
  const ink = n.sealInk;
  let o = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${n.paper}"/>`;
  o += beads(cx, cy, r - 1.6, 96, .75, ink);
  o += rings(cx, cy, [r - 3.6, r * .66], ink, .6);
  o += `<path id="${id}-fs" d="M${cx - r * .79} ${cy} A${r * .79} ${r * .79} 0 1 1 ${cx + r * .79} ${cy} A${r * .79} ${r * .79} 0 1 1 ${cx - r * .79} ${cy}" fill="none"/>
    <text style="font:700 ${f(r * .15)}px ${FONT.small};letter-spacing:.6px" fill="${ink}"><textPath href="#${id}-fs" textLength="${f(TAU * r * .79 * .97)}" lengthAdjust="spacingAndGlyphs">FEDERAL RESERVE BANK OF ${n.city} • DISTRICT ${n.district} • </textPath></text>`;
  o += rosetteRing(cx, cy, r * .38, r * .64, { lobes: 18, count: 5, stroke: ink, sw: .22 });
  o += `<circle cx="${cx}" cy="${cy}" r="${r * .36}" fill="${n.paper}"/>` + rings(cx, cy, [r * .36], ink, .8);
  o += plainText(n.letter, cx, cy + r * .19, `900 ${f(r * .52)}px ${FONT.caps}`, ink);
  return o;
}
function treasurySeal(n, id, cx, cy, r) {
  const ink = n.sealColor || n.secondary;
  let teeth = "";
  for (let i = 0; i < 160; i++) { const a = i / 160 * TAU, rr = i % 2 ? r * .93 : r; teeth += (i ? "L" : "M") + f(cx + rr * Math.cos(a)) + " " + f(cy + rr * Math.sin(a)); }
  let o = `<path d="${teeth}Z" fill="${ink}"/><circle cx="${cx}" cy="${cy}" r="${r * .9}" fill="${n.paper}"/>`;
  o += rings(cx, cy, [r * .86, r * .62], ink, .6);
  o += `<path id="${id}-ts" d="M${cx - r * .74} ${cy} A${r * .74} ${r * .74} 0 1 1 ${cx + r * .74} ${cy} A${r * .74} ${r * .74} 0 1 1 ${cx - r * .74} ${cy}" fill="none"/>
    <text style="font:700 ${f(r * .15)}px ${FONT.small};letter-spacing:.6px" fill="${ink}"><textPath href="#${id}-ts" textLength="${f(TAU * r * .74 * .97)}" lengthAdjust="spacingAndGlyphs">THE DEPARTMENT OF THE TREASURY • 1789 • </textPath></text>`;
  const k = r * .5;
  const shield = `M${f(cx - k * .78)} ${f(cy - k * .78)}H${f(cx + k * .78)}V${f(cy)}Q${f(cx + k * .78)} ${f(cy + k * .72)} ${cx} ${f(cy + k)}Q${f(cx - k * .78)} ${f(cy + k * .72)} ${f(cx - k * .78)} ${f(cy)}Z`;
  o += `<clipPath id="${id}-sh"><path d="${shield}"/></clipPath>`;
  o += `<path d="${shield}" fill="${n.paper}"/>`;
  o += `<g clip-path="url(#${id}-sh)">
      <rect x="${cx - k}" y="${f(cy - k * .78)}" width="${2 * k}" height="${f(k * .5)}" fill="${ink}"/>
      ${Array.from({ length: 14 }, (_, i) => `<line x1="${f(cx - k + i * k / 7)}" y1="${f(cy - k * .28)}" x2="${f(cx - k + i * k / 7)}" y2="${f(cy + k)}" stroke="${ink}" stroke-width=".35"/>`).join("")}
    </g>`;
  o += `<path d="M${f(cx - k * .6)} ${f(cy - k * .58)}H${f(cx + k * .6)}M${cx} ${f(cy - k * .7)}V${f(cy - k * .46)}" stroke="${n.paper}" stroke-width=".9"/>
    <path d="M${f(cx - k * .7)} ${f(cy - k * .5)}a${f(k * .12)} ${f(k * .12)} 0 0 0 ${f(k * .24)} 0M${f(cx + k * .46)} ${f(cy - k * .5)}a${f(k * .12)} ${f(k * .12)} 0 0 0 ${f(k * .24)} 0" fill="none" stroke="${n.paper}" stroke-width=".8"/>`;
  o += `<path d="M${f(cx - k * .78)} ${f(cy + k * .16)}L${cx} ${f(cy - k * .2)}L${f(cx + k * .78)} ${f(cy + k * .16)}" fill="none" stroke="${n.paper}" stroke-width="${f(k * .26)}" clip-path="url(#${id}-sh)"/>
    <path d="M${f(cx - k * .78)} ${f(cy + k * .16)}L${cx} ${f(cy - k * .2)}L${f(cx + k * .78)} ${f(cy + k * .16)}" fill="none" stroke="${ink}" stroke-width="${f(k * .16)}" clip-path="url(#${id}-sh)"/>`;
  o += `<circle cx="${f(cx - k * .2)}" cy="${f(cy + k * .5)}" r="${f(k * .1)}" fill="none" stroke="${ink}" stroke-width=".9"/>
    <path d="M${f(cx - k * .1)} ${f(cy + k * .5)}H${f(cx + k * .32)}V${f(cy + k * .62)}" fill="none" stroke="${ink}" stroke-width=".9"/>`;
  o += `<path d="${shield}" fill="none" stroke="${ink}" stroke-width=".9"/>`;
  return o;
}
function signature(n, cx, y, name, title) {
  return plainText(name, cx, y, `28px ${FONT.script}`, "#16181d", { extra: `textLength="${Math.min(118, measure(name, `28px ${FONT.script}`))}" lengthAdjust="spacingAndGlyphs"` }) +
    `<line x1="${cx - 62}" y1="${y + 6}" x2="${cx + 62}" y2="${y + 6}" stroke="${n.plate}" stroke-width=".5"/>` +
    plainText(title, cx, y + 17, `italic 7.6px ${FONT.small}`, n.plate);
}
function specimen(n, x, y) {
  return `<g opacity=".88">${plainText("SPECIMEN", x, y, `700 21px ${FONT.small}`, "#a3212b", { ls: 7 })}
    ${plainText("CLASS PROJECT • NOT LEGAL TENDER", x, y + 11, `700 6.6px ${FONT.small}`, "#a3212b", { ls: 2.4 })}</g>`;
}

function numeralPanel(n, id, p, s, word) {
  const pts = rectPts(p.x, p.y, p.x + p.w, p.y + p.h, 6);
  let o = `<rect x="${p.x - 8}" y="${p.y - 8}" width="${p.w + 16}" height="${p.h + 16}" rx="10" fill="${n.paper}"/>`;
  o += latheBand(offsetPts(pts, 6), { w: 8, wave: 11, count: 5, stroke: n.primary, sw: .26 });
  o += `<path d="${poly(pts, true)}" fill="${n.paper}" stroke="${n.plate}" stroke-width="1"/>`;
  o += `<path d="${poly(offsetPts(pts, 11), true)}" fill="none" stroke="${n.plate}" stroke-width=".6"/>`;
  o += `<path d="${poly(offsetPts(pts, -3), true)}" fill="none" stroke="${n.plate}" stroke-width=".3"/>`;
  for (const [x, y] of [[p.x, p.y], [p.x + p.w, p.y], [p.x, p.y + p.h], [p.x + p.w, p.y + p.h]]) o += knot(n, x, y, 9);
  const fs = s.length === 1 ? 250 : s.length === 2 ? 186 : 128;
  const cx = p.x + p.w / 2;
  o += plainText(s, cx + 2.5, p.y + 212, `900 ${fs}px ${FONT.num}`, n.tint1);
  o += plainText(s, cx, p.y + 209, `900 ${fs}px ${FONT.num}`, n.plate);
  o += `<path d="M${cx - 92} ${p.y + 232}H${cx + 92}" stroke="${n.plate}" stroke-width=".4"/>`;
  o += plainText(word, cx, p.y + 262, `700 21px ${FONT.caps}`, n.plate, { ls: 6 });
  return o;
}
