/* Geometry and guilloché generators. Everything returns SVG markup in note units (1560 x 660). */
const TAU = Math.PI * 2;
const f = n => (Math.round(n * 10) / 10).toString();
function poly(pts, closed) {
  let d = "M" + f(pts[0][0]) + " " + f(pts[0][1]);
  for (let i = 1; i < pts.length; i++) d += "L" + f(pts[i][0]) + " " + f(pts[i][1]);
  return closed ? d + "Z" : d;
}
function lcg(seed) { let s = seed >>> 0 || 1; return () => (s = s * 16807 % 2147483647) / 2147483647; }

/* ---------- shapes sampled by arc length: returns [{x,y,nx,ny}] with outward normals ---------- */
function sampleShape(pts, closed, step = 1) {
  // pts: dense polyline; resample at constant step and compute smoothed normals
  const segs = []; let total = 0;
  const n = pts.length, lim = closed ? n : n - 1;
  for (let i = 0; i < lim; i++) {
    const a = pts[i], b = pts[(i + 1) % n], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    segs.push([a, b, l, total]); total += l;
  }
  const out = [], count = Math.max(2, Math.round(total / step));
  let si = 0;
  for (let k = 0; k <= count; k++) {
    if (closed && k === count) break;
    const s = k / count * total;
    while (si < segs.length - 1 && segs[si][3] + segs[si][2] < s) si++;
    const [a, b, l, s0] = segs[si], t = l ? (s - s0) / l : 0;
    out.push({ x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t });
  }
  const m = out.length, w = 4;
  for (let i = 0; i < m; i++) {
    const p = out[closed ? (i - w + m) % m : Math.max(0, i - w)], q = out[closed ? (i + w) % m : Math.min(m - 1, i + w)];
    let tx = q.x - p.x, ty = q.y - p.y; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    out[i].nx = ty; out[i].ny = -tx;   // outward for clockwise screen-space shapes
  }
  out.total = total;
  return out;
}
function rectPts(x0, y0, x1, y1, r = 0) {
  const pts = [];
  const corner = (cx, cy, a0) => { for (let i = 0; i <= 12; i++) { const a = a0 + i / 12 * Math.PI / 2; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } };
  corner(x1 - r, y0 + r, -Math.PI / 2); corner(x1 - r, y1 - r, 0); corner(x0 + r, y1 - r, Math.PI / 2); corner(x0 + r, y0 + r, Math.PI);
  return pts;
}
// rectangle whose top edge is a circular segment (springing at ys, apex at y0)
function archPts(x0, y0, x1, y1, ys, r = 6) {
  const W = x1 - x0, h = ys - y0, R = (W * W / 4 + h * h) / (2 * h), cx = (x0 + x1) / 2, cy = y0 + R;
  const a0 = Math.atan2(ys - cy, x0 - cx), a1 = Math.atan2(ys - cy, x1 - cx);
  const pts = [];
  for (let i = 0; i <= 160; i++) { const a = a0 + (a1 - a0) * i / 160; pts.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]); }
  pts.push([x1, ys + 1]);
  for (let i = 0; i <= 8; i++) { const a = i / 8 * Math.PI / 2; pts.push([x1 - r + r * Math.cos(a), y1 - r + r * Math.sin(a)]); }
  for (let i = 0; i <= 8; i++) { const a = Math.PI / 2 + i / 8 * Math.PI / 2; pts.push([x0 + r + r * Math.cos(a), y1 - r + r * Math.sin(a)]); }
  pts.push([x0, ys + 1]);
  return pts;
}
function archPath(x0, y0, x1, y1, ys) { return poly(archPts(x0, y0, x1, y1, ys, 6), true); }
function ellipsePts(cx, cy, rx, ry, n = 360) { const p = []; for (let i = 0; i < n; i++) { const a = i / n * TAU - Math.PI / 2; p.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return p; }
function offsetPts(pts, d) {
  const s = sampleShape(pts, true, 1.5);
  return s.map(p => [p.x + p.nx * d, p.y + p.ny * d]);
}

/* ---------- lathe band that follows any closed shape ----------
   Two interlaced families of phase-shifted waves inside a band of width w centred on the shape. */
function latheBand(pts, { w, wave = 22, count = 9, families = 2, stroke = "#000", sw = .3, mod = 0, closed = true }) {
  const s = sampleShape(pts, closed, 1.1);
  const L = s.total, k = Math.max(1, Math.round(L / wave));
  let d = "";
  for (let fam = 0; fam < families; fam++) {
    for (let j = 0; j < count; j++) {
      const ph = j / count * TAU;
      const line = s.map((p, i) => {
        const u = i / s.length * TAU;
        let o = Math.sin(k * u + ph);
        if (mod) o *= .72 + .28 * Math.cos(mod * u + ph * .5);
        o *= (fam % 2 ? -1 : 1) * w / 2 * .94;
        return [p.x + p.nx * o, p.y + p.ny * o];
      });
      d += poly(line, closed);
    }
  }
  return `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${sw}"/>`;
}
/* Straight band between two points (for short runs). */
function ropeLine(x0, y0, x1, y1, { w, wave = 20, count = 8, stroke, sw = .3 }) {
  const pts = []; const n = Math.round(Math.hypot(x1 - x0, y1 - y0));
  for (let i = 0; i <= n; i++) pts.push([x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n]);
  return latheBand(pts, { w, wave, count, stroke, sw, closed: false });
}

/* ---------- rosettes ---------- */
// radial-wave ring between r0 and r1: interlocking families of lobed curves
function rosetteRing(cx, cy, r0, r1, { lobes = 36, count = 20, stroke, sw = .28, families = 2, squash = 1, twist = 0 }) {
  const mid = (r0 + r1) / 2, amp = (r1 - r0) / 2 * .96;
  let d = "";
  const N = Math.max(360, lobes * 24);
  for (let fam = 0; fam < families; fam++) {
    for (let j = 0; j < count; j++) {
      const sh = j / count * TAU / lobes;
      const pts = [];
      for (let i = 0; i < N; i++) {
        const t = i / N * TAU;
        const a = fam === 0 ? Math.sin(lobes * (t - sh)) : Math.sin(lobes * (t + sh) + Math.PI);
        const r = mid + amp * (fam === 0 ? a : a * .999) * (twist ? Math.cos(twist * t) * .3 + .7 : 1);
        pts.push([cx + r * Math.cos(t), cy + r * Math.sin(t) * squash]);
      }
      d += poly(pts, true);
    }
  }
  return `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${sw}"/>`;
}
// spirograph (epitrochoid/hypotrochoid) flower, rotated copies
function trochoid(cx, cy, { R, r, dd, scale, copies = 1, stroke, sw = .28, hypo = false }) {
  let d = "";
  const k = hypo ? (R - r) / r : (R + r) / r;
  // number of turns for closure
  let turns = 1; for (; turns < 60; turns++) if (Math.abs(turns * r / R - Math.round(turns * r / R)) < 1e-6 || Math.abs((turns * R / r) % 1) < 1e-6) break;
  const T = TAU * (r / gcd(R, r)), N = Math.round(T / TAU * 720);
  for (let c = 0; c < copies; c++) {
    const rot = c / copies * TAU / Math.max(1, Math.round(R / gcd(R, r)));
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N * T;
      let x, y;
      if (hypo) { x = (R - r) * Math.cos(t) + dd * Math.cos(k * t); y = (R - r) * Math.sin(t) - dd * Math.sin(k * t); }
      else { x = (R + r) * Math.cos(t) - dd * Math.cos(k * t); y = (R + r) * Math.sin(t) - dd * Math.sin(k * t); }
      const cr = Math.cos(rot), sr = Math.sin(rot);
      pts.push([cx + (x * cr - y * sr) * scale, cy + (x * sr + y * cr) * scale]);
    }
    d += poly(pts, false);
  }
  return `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${sw}"/>`;
}
function gcd(a, b) { a = Math.round(a); b = Math.round(b); while (b) [a, b] = [b, a % b]; return a; }
function rings(cx, cy, radii, stroke, sw) { return radii.map(r => `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="none" stroke="${stroke}" stroke-width="${sw}"/>`).join(""); }
function beads(cx, cy, r, n, rad, fill) { let s = ""; for (let i = 0; i < n; i++) { const a = i / n * TAU; s += `<circle cx="${f(cx + r * Math.cos(a))}" cy="${f(cy + r * Math.sin(a))}" r="${rad}" fill="${fill}"/>`; } return s; }
function beadsAlong(pts, gap, rad, fill) {
  const s = sampleShape(pts, true, gap); let o = "";
  for (const p of s) o += `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="${rad}"/>`;
  return `<g fill="${fill}">${o}</g>`;
}

/* ---------- background security patterns (fill a rectangle) ---------- */
const PATTERNS = {
  // two diagonal families of gently waving lines: a diamond lattice
  lattice(x0, y0, x1, y1, { gap = 6, stroke, sw = .3 }) {
    let d = ""; const W = x1 - x0, H = y1 - y0;
    for (const dir of [1, -1]) for (let c = -H; c < W + H; c += gap) {
      const pts = [];
      for (let t = 0; t <= H; t += 3) { const x = x0 + c + dir * t * .9, y = y0 + t; pts.push([x + 1.6 * Math.sin(t * .09 + c * .05), y]); }
      d += poly(pts);
    }
    return `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${sw}"/>`;
  },
  // concentric rings from two centres, producing moiré
  rings(x0, y0, x1, y1, { gap = 5.5, stroke, sw = .3, centers }) {
    let d = ""; const R = Math.hypot(x1 - x0, y1 - y0);
    for (const [cx, cy] of centers) for (let r = gap; r < R; r += gap) {
      const pts = []; const n = Math.max(48, Math.round(r * .8));
      for (let i = 0; i < n; i++) { const a = i / n * TAU, rr = r + 1.2 * Math.sin(a * 18 + r * .05); pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]); }
      d += poly(pts, true);
    }
    return `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${sw}"/>`;
  },
  // sunburst spokes with a wave, plus wide rings
  sunburst(x0, y0, x1, y1, { stroke, sw = .3, center, spokes = 540 }) {
    let d = ""; const [cx, cy] = center, R = Math.hypot(x1 - x0, y1 - y0);
    for (let i = 0; i < spokes; i++) {
      const a = i / spokes * TAU, pts = [];
      for (let r = 20; r < R; r += 6) { const aa = a + .012 * Math.sin(r * .045); pts.push([cx + r * Math.cos(aa), cy + r * Math.sin(aa)]); }
      d += poly(pts);
    }
    return `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${sw}"/>`;
  },
  // three families of waves at 60 degrees: a woven hexagonal field
  hexweave(x0, y0, x1, y1, { gap = 7, stroke, sw = .3 }) {
    let d = ""; const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.hypot(x1 - x0, y1 - y0) / 2;
    for (const ang of [0, Math.PI / 3, 2 * Math.PI / 3]) {
      const ux = Math.cos(ang), uy = Math.sin(ang), vx = -uy, vy = ux;
      for (let c = -R; c < R; c += gap) {
        const pts = [];
        for (let t = -R; t <= R; t += 3) { const o = c + 1.5 * Math.sin(t * .11); pts.push([cx + ux * t + vx * o, cy + uy * t + vy * o]); }
        d += poly(pts);
      }
    }
    return `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${sw}"/>`;
  },
  // zig-zag chevron bands
  chevron(x0, y0, x1, y1, { gap = 5.5, stroke, sw = .3 }) {
    let d = "";
    for (let y = y0 - 40; y < y1 + 40; y += gap) {
      const pts = [];
      for (let x = x0; x <= x1; x += 2) { const ph = ((x - x0) / 28) % 2; const z = ph < 1 ? ph : 2 - ph; pts.push([x, y + z * 14 + 1.2 * Math.sin(x * .05)]); }
      d += poly(pts);
    }
    return `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${sw}"/>`;
  },
  // flowing ribbons: superposed sines whose phase drifts line to line
  flow(x0, y0, x1, y1, { gap = 5, stroke, sw = .3 }) {
    let d = "";
    for (let y = y0 - 60; y < y1 + 60; y += gap) {
      const pts = [];
      for (let x = x0; x <= x1; x += 3) pts.push([x, y + 14 * Math.sin(x * .011 + y * .021) + 7 * Math.sin(x * .027 - y * .013 + 1.3)]);
      d += poly(pts);
    }
    return `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${sw}"/>`;
  },
};
