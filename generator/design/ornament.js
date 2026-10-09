/* Engraved ornament in the manner of U.S. intaglio notes: acanthus leaves, shaded headline lettering,
   the denomination banner, tall corner counters, the portrait oval and the memorial roundel. */

/* ---------- acanthus leaf ----------
   A curling, lobed leaf grown along a quadratic spine from p0 through p1 to p2.
   Shaded with plate-ink hatching; the side away from the light gets cross-hatching. */
function leaf(n, id, p0, p1, p2, width, { lobes = 4, flip = false } = {}) {
  const N = 90, L = [], R = [], spine = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, u = 1 - t;
    const x = u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0];
    const y = u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1];
    const dx = 2 * u * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
    const dy = 2 * u * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
    const l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    const lobe = .62 + .38 * Math.abs(Math.sin(t * Math.PI * lobes + .3));
    const w = width * Math.pow(Math.sin(Math.min(t * 1.08, 1) * Math.PI), .75) * (1 - .3 * t) * lobe;
    spine.push([x, y]);
    L.push([x + nx * w, y + ny * w]);
    R.push([x - nx * w * .82, y - ny * w * .82]);
  }
  const outline = poly([...L, ...R.reverse()], true);
  const half = poly([...L, ...spine.slice().reverse()], true);
  const shadeHalf = flip ? poly([...spine, ...R.slice().reverse()].reverse(), true) : half;
  let veins = "";
  for (let k = 1; k < lobes * 2; k++) {
    const i = Math.round(k / (lobes * 2) * N), s = spine[i];
    veins += `M${f(s[0])} ${f(s[1])}L${f(L[i][0] * .7 + s[0] * .3)} ${f(L[i][1] * .7 + s[1] * .3)}`;
    const r = R[R.length - 1 - i] || R[0];
    veins += `M${f(s[0])} ${f(s[1])}L${f(r[0] * .7 + s[0] * .3)} ${f(r[1] * .7 + s[1] * .3)}`;
  }
  return `<path d="${outline}" fill="${n.paper}"/>
    <path d="${outline}" fill="url(#${id}-leafhatch)"/>
    <path d="${shadeHalf}" fill="url(#${id}-xhatch)" opacity=".85"/>
    <path d="${veins}" stroke="${n.plate}" stroke-width=".55" fill="none"/>
    <path d="${poly(spine)}" stroke="${n.plate}" stroke-width=".9" fill="none"/>
    <path d="${outline}" fill="none" stroke="${n.plate}" stroke-width=".9"/>`;
}
/* a spray of leaves fanning from a root point */
function spray(n, id, root, dirDeg, len, count, spread, width, mirror = false) {
  let o = "";
  for (let i = 0; i < count; i++) {
    const a = (dirDeg + (i - (count - 1) / 2) * spread) * Math.PI / 180;
    const l = len * (1 - .12 * Math.abs(i - (count - 1) / 2));
    const curl = (mirror ? -1 : 1) * (.45 + .1 * i);
    const p2 = [root[0] + Math.cos(a) * l, root[1] + Math.sin(a) * l];
    const p1 = [root[0] + Math.cos(a - curl) * l * .62, root[1] + Math.sin(a - curl) * l * .62];
    o += leaf(n, id, root, p1, p2, width * (1 - .1 * Math.abs(i - (count - 1) / 2)), { lobes: 3 + (i % 2), flip: mirror });
  }
  return o;
}

/* ---------- shaded headline: extruded shadow, paper face, ruled fill, outline ---------- */
function slabText(n, id, text, cx, y, size, width, { depth = 3.2, family = FONT.num, weight = 900, ls = 0 } = {}) {
  const st = `font-family:${family};font-weight:${weight};font-size:${size}px;letter-spacing:${ls}px`;
  const fit = width ? ` textLength="${width}" lengthAdjust="spacingAndGlyphs"` : "";
  let o = "";
  for (let k = depth; k > 0; k -= .5) o += `<text x="${f(cx + k)}" y="${f(y + k)}" text-anchor="middle" style="${st}"${fit} fill="${n.plate}">${esc(text)}</text>`;
  o += `<text x="${cx}" y="${y}" text-anchor="middle" style="${st}"${fit} fill="${n.paper}">${esc(text)}</text>`;
  o += `<text x="${cx}" y="${y}" text-anchor="middle" style="${st}"${fit} fill="url(#${id}-hatch)" opacity=".9">${esc(text)}</text>`;
  o += `<text x="${cx}" y="${y}" text-anchor="middle" style="${st}"${fit} fill="none" stroke="${n.plate}" stroke-width="${f(size * .022)}">${esc(text)}</text>`;
  return o;
}
/* hollow lettering (like ONE DOLLAR): paper face, heavy outline, hatched inner shadow */
function hollowText(n, id, text, cx, y, size, width) {
  const st = `font-family:${FONT.num};font-weight:900;font-size:${size}px`;
  const fit = width ? ` textLength="${width}" lengthAdjust="spacingAndGlyphs"` : "";
  return `<text x="${cx + 2.4}" y="${y + 2.4}" text-anchor="middle" style="${st}"${fit} fill="${n.plate}">${esc(text)}</text>
    <text x="${cx}" y="${y}" text-anchor="middle" style="${st}"${fit} fill="${n.paper}" stroke="${n.plate}" stroke-width="2.2">${esc(text)}</text>
    <text x="${cx}" y="${y}" text-anchor="middle" style="${st}"${fit} fill="url(#${id}-hatch)" opacity=".45">${esc(text)}</text>`;
}

/* ---------- the denomination banner straddling the bottom border ---------- */
function banner(n, id, word) {
  const cx = W / 2, cy = H - 40, size = 40;
  const tw = Math.min(560, measure(word, `900 ${size}px ${FONT.num}`) * 1.05);
  const x0 = cx - tw / 2 - 40, x1 = cx + tw / 2 + 40, h = 26;
  const shape = `M${f(x0)} ${cy - h}H${f(x1)}Q${f(x1 + 18)} ${cy} ${f(x1)} ${cy + h}H${f(x0)}Q${f(x0 - 18)} ${cy} ${f(x0)} ${cy - h}Z`;
  let o = `<path d="${shape}" fill="${n.paper}"/>`;
  o += `<path d="${shape}" fill="url(#${id}-iris)" opacity=".5"/>`;
  o += `<path d="${shape}" fill="none" stroke="${n.plate}" stroke-width="1.4"/>`;
  o += `<path d="M${f(x0 + 6)} ${cy - h + 4}H${f(x1 - 6)}M${f(x0 + 6)} ${cy + h - 4}H${f(x1 - 6)}" stroke="${n.plate}" stroke-width=".5"/>`;
  // scroll ends
  o += spray(n, id, [x0 - 6, cy], 180, 46, 3, 34, 9, true) + spray(n, id, [x1 + 6, cy], 0, 46, 3, 34, 9);
  o += hollowText(n, id, word, cx, cy + size * .34, size, tw);
  return o;
}

/* ---------- tall corner counter with a large numeral and acanthus ---------- */
function tallCounter(n, id, x0, y0, w, h, right) {
  const s = String(n.v), cx = x0 + w / 2;
  const shape = `M${x0} ${y0 + h}V${y0 + 26}Q${x0} ${y0} ${x0 + 26} ${y0}H${x0 + w - 26}Q${x0 + w} ${y0} ${x0 + w} ${y0 + 26}V${y0 + h}Z`;
  let o = "";
  // leaves behind the panel, reaching outward and down
  const side = right ? -1 : 1;
  o += spray(n, id, [right ? x0 : x0 + w, y0 + h - 30], right ? 160 : 20, 92, 4, 30, 17, right);
  o += spray(n, id, [right ? x0 + 10 : x0 + w - 10, y0 + 40], right ? 200 : -20, 70, 3, 30, 14, right);
  o += spray(n, id, [cx, y0 + h + 2], 90, 60, 3, 42, 14, right);
  o += `<path d="${shape}" fill="${n.plate}"/>`;
  o += `<g clip-path="url(#${id}-ctr${right ? "r" : "l"})"><rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="url(#${id}-paperhatch)"/>${rosetteRing(cx, y0 + h / 2, w * .44, w * .62, { lobes: 26, count: 6, stroke: n.paper, sw: .34 })}</g>`;
  o += `<clipPath id="${id}-ctr${right ? "r" : "l"}"><path d="${shape}"/></clipPath>`;
  o += `<path d="${shape}" fill="none" stroke="${n.paper}" stroke-width=".8" transform="translate(${cx} ${y0 + h / 2}) scale(.93 .96) translate(${-cx} ${-(y0 + h / 2)})"/>`;
  o += `<path d="${shape}" fill="none" stroke="${n.plate}" stroke-width="1.4"/>`;
  const fs = s.length === 1 ? h * .9 : s.length === 2 ? w * .82 : w * .56;
  const fw = s.length === 1 ? null : w * .86;
  o += slabText(n, id, s, cx, y0 + h / 2 + fs * .34, fs, fw, { depth: 3 });
  return o;
}
/* small round counter for the lower corners */
function roundCounter(n, id, cx, cy, r, right) {
  let o = spray(n, id, [cx, cy], right ? 200 : -20, r * 1.35, 3, 40, r * .3, right);
  o += cornerMedallion(n, cx, cy, r);
  return o;
}

/* ---------- portrait oval with beaded frame and leafy base ---------- */
function portraitOval(n, id, cx, cy, rx, ry, img, caption) {
  const inner = ellipsePts(cx, cy, rx, ry, 480);
  let o = "";
  o += spray(n, id, [cx - rx * .5, cy + ry * .88], 165, 96, 4, 26, 17, true);
  o += spray(n, id, [cx + rx * .5, cy + ry * .88], 15, 96, 4, 26, 17, false);
  o += `<ellipse cx="${cx}" cy="${cy}" rx="${rx + 22}" ry="${ry + 22}" fill="${n.paper}"/>`;
  o += `<path d="${poly(offsetPts(inner, 16), true)}${poly(offsetPts(inner, 3), true)}" fill="${n.plate}" fill-rule="evenodd"/>`;
  o += latheBand(offsetPts(inner, 9.5), { w: 12, wave: 10, count: 6, stroke: n.paper, sw: .36 });
  o += beadsAlong(offsetPts(inner, 19), 5, 1.1, n.plate);
  o += `<path d="${poly(offsetPts(inner, 22), true)}" fill="none" stroke="${n.plate}" stroke-width=".8"/>`;
  o += `<clipPath id="${id}-oval"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/></clipPath>`;
  o += `<g clip-path="url(#${id}-oval)"><rect x="${cx - rx}" y="${cy - ry}" width="${2 * rx}" height="${2 * ry}" fill="${n.paper}"/>
        <image href="${img}" x="${cx - rx}" y="${cy - ry}" width="${2 * rx}" height="${2 * ry}" preserveAspectRatio="xMidYMid slice"/></g>`;
  o += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${n.plate}" stroke-width="1.3"/>`;
  // name tablet on the lower frame
  const font = `700 9.5px ${FONT.caps}`, w = measure(caption, font, 2.6) + 30, ty = cy + ry + 9;
  o += `<path d="M${f(cx - w / 2)} ${ty - 9}H${f(cx + w / 2)}L${f(cx + w / 2 + 8)} ${ty}L${f(cx + w / 2)} ${ty + 9}H${f(cx - w / 2)}L${f(cx - w / 2 - 8)} ${ty}Z" fill="${n.paper}" stroke="${n.plate}" stroke-width=".9"/>`;
  o += plainText(caption, cx, ty + 3.4, font, n.plate, { ls: 2.6 });
  return o;
}

/* ---------- memorial roundel: Twin Towers and One World Trade Center ---------- */
function memorial(n, id, cx, cy, r, img) {
  let o = `<circle cx="${cx}" cy="${cy}" r="${r + 18}" fill="${n.paper}"/>`;
  o += `<circle cx="${cx}" cy="${cy}" r="${r + 15}" fill="${n.plate}"/>`;
  o += rosetteRing(cx, cy, r + 2, r + 14, { lobes: 44, count: 7, stroke: n.paper, sw: .36 });
  o += `<path id="${id}-mem" d="M${cx - r - 8.5} ${cy}A${r + 8.5} ${r + 8.5} 0 0 1 ${cx + r + 8.5} ${cy}" fill="none"/>`;
  o += `<circle cx="${cx}" cy="${cy - r - 8.5}" r="0" />`;
  o += `<clipPath id="${id}-memc"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>`;
  o += `<g clip-path="url(#${id}-memc)"><rect x="${cx - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}" fill="${n.paper}"/>
        <image href="${img}" x="${cx - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}"/></g>`;
  o += rings(cx, cy, [r, r + 18], n.plate, 1);
  // inscription arcs
  o += `<path id="${id}-memt" d="M${cx - r - 30} ${cy}A${r + 30} ${r + 30} 0 0 1 ${cx + r + 30} ${cy}" fill="none"/>
    <text style="font:700 10px ${FONT.caps};letter-spacing:3.4px" fill="${n.plate}" text-anchor="middle"><textPath href="#${id}-memt" startOffset="50%">WE REMEMBER • WE REBUILD</textPath></text>`;
  o += `<path id="${id}-memb" d="M${cx - r - 38} ${cy}A${r + 38} ${r + 38} 0 0 0 ${cx + r + 38} ${cy}" fill="none"/>
    <text style="font:700 10px ${FONT.caps};letter-spacing:3.4px" fill="${n.plate}" text-anchor="middle"><textPath href="#${id}-memb" startOffset="50%">SEPTEMBER 11, 2001</textPath></text>`;
  return o;
}
