/* Draws each note side on a canvas in banknote style and returns a PNG data URL.
   Units are note units (1560 x 660, the 2.61 : 1 proportion of a U.S. note); the canvas is S times that. */
const S = 2, W = 1560, H = 660;
const PAPER = "#f3f1e8";

const NOTES = [
  { v: 1, word: "ONE DOLLAR", theme: "LIBERTY", key: "liberty", front: "The Torch of Liberty", back: "New York Harbor at Sunrise",
    ink: "#1b2a20", acc: "#45664c", wash: "#c3d5bd", dots: 1, thread: 150, district: "B", city: "NEW YORK", serial: "SB 04718263 A", plate: "C 14", check: "B4" },
  { v: 5, word: "FIVE DOLLARS", theme: "THE LAND", key: "canyon", front: "The Grand Canyon", back: "The Colorado River",
    ink: "#271f36", acc: "#62528a", wash: "#d6cde6", dots: 2, thread: 175, district: "J", city: "KANSAS CITY", serial: "SJ 25930417 B", plate: "D 22", check: "J7" },
  { v: 10, word: "TEN DOLLARS", theme: "DISCOVERY", key: "space", front: "Moon Rocket Launch", back: "Earthrise from the Moon",
    ink: "#36230f", acc: "#9c632a", wash: "#ecd5b4", dots: 3, thread: 200, district: "G", city: "CHICAGO", serial: "SG 61842095 C", plate: "A 31", check: "G2" },
  { v: 20, word: "TWENTY DOLLARS", theme: "WILD AMERICA", key: "forest", front: "Coast Redwoods", back: "Half Dome and a Mountain Lake",
    ink: "#112c35", acc: "#33697a", wash: "#c3dbe2", dots: 4, thread: 225, district: "L", city: "SAN FRANCISCO", serial: "SL 39027584 D", plate: "F 08", check: "L5" },
  { v: 50, word: "FIFTY DOLLARS", theme: "DEMOCRACY", key: "capitol", front: "The Capitol Dome", back: "We the People",
    ink: "#351318", acc: "#8f3740", wash: "#eacdd0", dots: 5, thread: 250, district: "E", city: "RICHMOND", serial: "SE 70365128 E", plate: "B 17", check: "E9" },
  { v: 100, word: "ONE HUNDRED DOLLARS", theme: "UNITY", key: "bridge", front: "The Golden Gate Bridge", back: "Fifty Stars, One Nation",
    ink: "#141a30", acc: "#394a7e", wash: "#ced5ea", dots: 6, thread: 275, district: "K", city: "DALLAS", serial: "SK 85219406 F", plate: "E 26", check: "K3" },
];
const SIGS = [["Eleanor Whitcombe", "Treasurer of the United States"], ["James T. Okafor", "Secretary of the Treasury"]];
const GRAY = { ink: "#111111", mid: "#6c6c6c", tint: "#d2d2d2", light: "#f7f7f7" };

/* ---------- helpers ---------- */
function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}
function lcg(seed) { let s = seed; return () => (s = s * 16807 % 2147483647) / 2147483647; }
function ellipsePath(ctx, cx, cy, rx, ry) { ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); }
function text(ctx, str, x, y, font, color, align = "center", spacing = 0, maxW) {
  ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.letterSpacing = spacing + "px";
  if (maxW) ctx.fillText(str, x, y, maxW); else ctx.fillText(str, x, y);
  ctx.letterSpacing = "0px";
}

function svgImage(markup, w, h, vb) {
  return new Promise(res => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => { console.log("svg load failed"); res(null); };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${vb}" preserveAspectRatio="xMidYMid slice">${markup}</svg>`);
  });
}

/* Renders a scene in grays, softens and lights it, and returns a darkness map for engraving. */
async function tone(markup, vb, pw, ph) {
  const img = await svgImage(markup, pw, ph, vb);
  const c = document.createElement("canvas"); c.width = pw; c.height = ph;
  const x = c.getContext("2d");
  x.fillStyle = "#fff"; x.fillRect(0, 0, pw, ph);
  x.filter = "blur(1.4px)"; x.drawImage(img, 0, 0, pw, ph); x.filter = "none";
  const g = x.createRadialGradient(pw * .45, ph * .38, Math.min(pw, ph) * .15, pw / 2, ph / 2, Math.max(pw, ph) * .72);
  g.addColorStop(0, "rgba(255,255,255,0.18)"); g.addColorStop(1, "rgba(0,0,0,0.3)");
  x.fillStyle = g; x.fillRect(0, 0, pw, ph);
  const d = x.getImageData(0, 0, pw, ph).data, lum = new Float32Array(pw * ph);
  for (let i = 0; i < pw * ph; i++) {
    const L = (0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]) / 255;
    lum[i] = Math.pow(1 - L, .9);
  }
  return { lum, canvas: c, pw, ph };
}

/* Line-screen engraving: parallel wavy lines whose width follows the darkness of the source. Device-pixel space. */
function engravePass(ctx, t, ox, oy, color, o) {
  const { lum, pw: w, ph: h } = t;
  const ca = Math.cos(o.angle), sa = Math.sin(o.angle);
  const cx = w / 2, cy = h / 2, R = Math.hypot(w, h) / 2;
  ctx.fillStyle = color;
  const top = [], bot = [];
  const flush = () => {
    if (top.length > 1) {
      ctx.beginPath(); ctx.moveTo(top[0][0], top[0][1]);
      for (let i = 1; i < top.length; i++) ctx.lineTo(top[i][0], top[i][1]);
      for (let i = bot.length - 1; i >= 0; i--) ctx.lineTo(bot[i][0], bot[i][1]);
      ctx.closePath(); ctx.fill();
    }
    top.length = 0; bot.length = 0;
  };
  for (let k = -R; k <= R; k += o.spacing) {
    for (let s = -R; s <= R; s += 1.5) {
      const off = k + o.wave * Math.sin(s * o.freq + k * .11);
      const x = cx + s * ca - off * sa, y = cy + s * sa + off * ca;
      if (x < 0 || y < 0 || x >= w || y >= h) { flush(); continue; }
      const d = lum[(y | 0) * w + (x | 0)];
      if (d < .07) { flush(); continue; }
      let tt = (d - o.thr) / (1 - o.thr);
      if (tt <= 0) { flush(); continue; }
      tt = Math.max(o.min, tt * o.spacing * o.weight);
      top.push([ox + x + sa * tt / 2, oy + y - ca * tt / 2]);
      bot.push([ox + x - sa * tt / 2, oy + y + ca * tt / 2]);
    }
    flush();
  }
}
function engrave(ctx, t, ox, oy, color) {
  engravePass(ctx, t, ox, oy, color, { angle: 0, spacing: 4.4, wave: 1.6, freq: .028, thr: 0, weight: .92, min: .55 });
  engravePass(ctx, t, ox, oy, color, { angle: -.85, spacing: 5.2, wave: 1, freq: .02, thr: .52, weight: .7, min: .4 });
  engravePass(ctx, t, ox, oy, color, { angle: .85, spacing: 5.6, wave: 1, freq: .02, thr: .78, weight: .6, min: .4 });
}

/* ---------- guilloche work ---------- */
function rosette(ctx, cx, cy, r0, r1, color, petals = 24, count = 10, lw = .35) {
  const mid = (r0 + r1) / 2, amp = (r1 - r0) / 2 * .92;
  ctx.strokeStyle = color; ctx.lineWidth = lw;
  for (let fam = 0; fam < 2; fam++) {
    for (let j = 0; j < count; j++) {
      ctx.beginPath();
      for (let i = 0; i <= 720; i++) {
        const t = i / 720 * Math.PI * 2;
        const r = fam === 0 ? mid + amp * Math.sin(petals * t + j * 2 * Math.PI / count)
                            : mid + amp * .62 * Math.sin((petals + 3) * t - j * 2 * Math.PI / count);
        const x = cx + r * Math.cos(t), y = cy + r * Math.sin(t);
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
  }
}
function ellipseBand(ctx, cx, cy, rx, ry, width, color, petals = 64, count = 12) {
  const amp = width / 2 * .92;
  ctx.strokeStyle = color; ctx.lineWidth = .35;
  for (let fam = 0; fam < 2; fam++) {
    for (let j = 0; j < count; j++) {
      ctx.beginPath();
      for (let i = 0; i <= 1440; i++) {
        const t = i / 1440 * Math.PI * 2;
        const off = width / 2 + (fam ? -1 : 1) * amp * Math.sin(petals * t + j * 2 * Math.PI / count) * (fam ? .7 : 1);
        const x = cx + (rx + off) * Math.cos(t), y = cy + (ry + off) * Math.sin(t);
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
  }
}
function rope(ctx, horizontal, a0, a1, c, hh, color, n = 7, f = .085) {
  ctx.strokeStyle = color; ctx.lineWidth = .35;
  for (let j = 0; j < n; j++) {
    ctx.beginPath();
    for (let a = a0; a <= a1; a += 1) {
      const o = hh * Math.sin(a * f + j * Math.PI / n) * (.6 + .4 * Math.cos(a * f * .23 + j));
      const x = horizontal ? a : c + o, y = horizontal ? c + o : a;
      a === a0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}
function fineLines(ctx, color, x0, y0, x1, y1, gap = 3.2) {
  ctx.strokeStyle = color; ctx.lineWidth = .3;
  for (let y = y0; y < y1; y += gap) {
    ctx.beginPath();
    for (let x = x0; x <= x1; x += 4) {
      const yy = y + 1.4 * Math.sin(x * .022 + y * .09);
      x === x0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
}
function arcText(ctx, str, cx, cy, r, family, color, fill = .9) {
  ctx.font = `700 10px ${family}`;
  const total = [...str].reduce((a, ch) => a + ctx.measureText(ch).width, 0);
  const size = 10 * (2 * Math.PI * r * fill / total);
  ctx.font = `700 ${size}px ${family}`; ctx.fillStyle = color; ctx.textAlign = "center";
  const ws = [...str].map(ch => ctx.measureText(ch).width);
  const sum = ws.reduce((a, b) => a + b, 0);
  let a = -Math.PI / 2 - sum / r / 2;
  [...str].forEach((ch, i) => {
    a += ws[i] / 2 / r;
    ctx.save(); ctx.translate(cx + r * Math.cos(a), cy + r * Math.sin(a)); ctx.rotate(a + Math.PI / 2);
    ctx.fillText(ch, 0, size * .35); ctx.restore();
    a += ws[i] / 2 / r;
  });
}

/* ---------- note parts ---------- */
function paper(ctx, n, seed) {
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  const r = lcg(seed);
  for (let i = 0; i < 260; i++) {
    const x = r() * W, y = r() * H, rad = 20 + r() * 90;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, r() > .5 ? "rgba(120,110,80,0.035)" : "rgba(255,255,255,0.05)"); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
}
function fibers(ctx, seed) {
  const r = lcg(seed);
  for (let i = 0; i < 240; i++) {
    const x = r() * W, y = r() * H, a = r() * Math.PI * 2, len = 6 + r() * 12;
    ctx.strokeStyle = r() > .5 ? "rgba(178,40,52,0.45)" : "rgba(40,70,160,0.45)";
    ctx.lineWidth = .45;
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + Math.cos(a + .6) * len * .6, y + Math.sin(a + .6) * len * .6, x + Math.cos(a) * len, y + Math.sin(a) * len);
    ctx.stroke();
  }
}
function washes(ctx, n, spots) {
  ctx.fillStyle = rgba(n.wash, .28); ctx.fillRect(18, 18, W - 36, H - 36);
  for (const [x, y, r, a] of spots) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(n.wash, a)); g.addColorStop(1, rgba(n.wash, 0));
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
}
function border(ctx, n) {
  // printed frame between 18 and 56; a white margin stays outside it, as on real notes
  ctx.save();
  ctx.beginPath(); ctx.rect(18, 18, W - 36, H - 36); ctx.rect(56, 56, W - 112, H - 112); ctx.clip("evenodd");
  ctx.fillStyle = rgba(n.wash, .75); ctx.fillRect(18, 18, W - 36, H - 36);
  const col = rgba(n.ink, .8);
  rope(ctx, true, 18, W - 18, 28, 7, col); rope(ctx, true, 18, W - 18, 46, 7, col);
  rope(ctx, true, 18, W - 18, H - 28, 7, col); rope(ctx, true, 18, W - 18, H - 46, 7, col);
  rope(ctx, false, 18, H - 18, 28, 7, col); rope(ctx, false, 18, H - 18, 46, 7, col);
  rope(ctx, false, 18, H - 18, W - 28, 7, col); rope(ctx, false, 18, H - 18, W - 46, 7, col);
  ctx.restore();
  ctx.strokeStyle = n.ink;
  ctx.lineWidth = 1.6; ctx.strokeRect(18, 18, W - 36, H - 36);
  ctx.lineWidth = .6; ctx.strokeRect(37, 37, W - 74, H - 74);
  ctx.lineWidth = 1.2; ctx.strokeRect(56, 56, W - 112, H - 112);
  ctx.lineWidth = .5; ctx.strokeRect(60, 60, W - 120, H - 120);
  // microprint inside the inner rule
  const m = `THE UNITED STATES OF AMERICA ${n.word} `.repeat(14);
  ctx.font = `700 4.6px "Old Standard TT"`; ctx.fillStyle = n.ink; ctx.textAlign = "left";
  ctx.fillText(m, 64, 66, W - 128); ctx.fillText(m, 64, H - 62, W - 128);
  // corner blocks
  for (const [x, y] of [[18, 18], [W - 56, 18], [18, H - 56], [W - 56, H - 56]]) {
    ctx.fillStyle = PAPER; ctx.fillRect(x, y, 38, 38);
    ctx.strokeStyle = n.ink; ctx.lineWidth = 1; ctx.strokeRect(x + 3, y + 3, 32, 32);
    rosette(ctx, x + 19, y + 19, 4, 15, rgba(n.acc, .9), 12, 6);
  }
}
function cartouche(ctx, n, str, cy, font, spacing) {
  ctx.font = font; ctx.letterSpacing = spacing + "px";
  const w = ctx.measureText(str).width + 70; ctx.letterSpacing = "0px";
  const x0 = W / 2 - w / 2, x1 = W / 2 + w / 2, h = 24;
  ctx.beginPath();
  ctx.moveTo(x0, cy); ctx.lineTo(x0 + 16, cy - h); ctx.lineTo(x1 - 16, cy - h); ctx.lineTo(x1, cy); ctx.lineTo(x1 - 16, cy + h); ctx.lineTo(x0 + 16, cy + h); ctx.closePath();
  ctx.fillStyle = PAPER; ctx.fill();
  ctx.fillStyle = rgba(n.wash, .35); ctx.fill();
  ctx.strokeStyle = n.ink; ctx.lineWidth = 1.4; ctx.stroke();
  ctx.save(); ctx.translate(W / 2, cy); ctx.scale(.9, .78); ctx.translate(-W / 2, -cy); ctx.lineWidth = .6; ctx.stroke(); ctx.restore();
  text(ctx, str, W / 2, cy + 8, font, n.ink, "center", spacing);
}
function medallion(ctx, n, cx, cy, r) {
  const s = String(n.v);
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = PAPER; ctx.fill();
  ctx.fillStyle = rgba(n.wash, .6); ctx.fill();
  rosette(ctx, cx, cy, r * .6, r * .97, rgba(n.ink, .75), 28, 9);
  ctx.strokeStyle = n.ink; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = .6; ctx.beginPath(); ctx.arc(cx, cy, r - 4, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, r * .6, 0, Math.PI * 2); ctx.fillStyle = PAPER; ctx.fill();
  ctx.lineWidth = 1.2; ctx.stroke();
  const size = r * (s.length === 1 ? 1.0 : s.length === 2 ? .78 : .56);
  text(ctx, s, cx, cy + size * .36, `900 ${size}px "Playfair Display"`, n.ink);
}
function threadDraw(ctx, n, T) {
  ctx.fillStyle = rgba(n.ink, .09); ctx.fillRect(T - 6, 0, 12, H);
  ctx.strokeStyle = rgba(n.ink, .18); ctx.lineWidth = .4;
  ctx.beginPath(); ctx.moveTo(T - 6, 0); ctx.lineTo(T - 6, H); ctx.moveTo(T + 6, 0); ctx.lineTo(T + 6, H); ctx.stroke();
  ctx.save(); ctx.translate(T - 3.2, 6); ctx.rotate(Math.PI / 2);
  ctx.font = `700 6.5px "Old Standard TT"`; ctx.fillStyle = rgba(n.ink, .42); ctx.textAlign = "left";
  ctx.fillText(`USA ${n.v}   `.repeat(70), 0, 0, H - 12);
  ctx.restore();
}
function dotsDraw(ctx, n, x) {
  for (let i = 0; i < n.dots; i++) {
    const cy = 330 - (n.dots - 1) * 20 + i * 40;
    const g = ctx.createRadialGradient(x - 4, cy - 4, 1, x, cy, 12);
    g.addColorStop(0, "rgba(255,255,255,0.95)"); g.addColorStop(.55, "rgba(255,255,255,0.25)"); g.addColorStop(1, "rgba(0,0,0,0.32)");
    ctx.beginPath(); ctx.arc(x, cy, 11, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.3)"; ctx.lineWidth = .7; ctx.stroke();
  }
}
function watermarkDraw(ctx, t, cx, cy, rx, ry, mirror) {
  ctx.save(); ellipsePath(ctx, cx, cy, rx, ry); ctx.clip();
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
  g.addColorStop(0, rgba(PAPER, .95)); g.addColorStop(.75, rgba(PAPER, .85)); g.addColorStop(1, rgba(PAPER, 0));
  ctx.fillStyle = g; ctx.fillRect(cx - rx, cy - ry, rx * 2, ry * 2);
  ctx.globalAlpha = .13; ctx.filter = "grayscale(1) blur(2px)";
  const sc = Math.max(rx * 2 / t.pw, ry * 2 / t.ph), dw = t.pw * sc, dh = t.ph * sc;
  ctx.translate(cx, cy); if (mirror) ctx.scale(-1, 1);
  ctx.drawImage(t.canvas, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();
}
function osNumeral(ctx, n, xr, yb, size) {
  const off = document.createElement("canvas"); off.width = W * S; off.height = H * S;
  const o = off.getContext("2d"); o.scale(S, S);
  const s = String(n.v);
  o.font = `900 ${size}px "Playfair Display"`; o.textAlign = "right";
  const w = o.measureText(s).width, x0 = xr - w, y0 = yb - size * .74;
  const g = o.createLinearGradient(x0, y0, xr, yb);
  g.addColorStop(0, "#5e2f10"); g.addColorStop(.35, "#b8773a"); g.addColorStop(.55, "#e0aa6a"); g.addColorStop(.78, "#8f5a2c"); g.addColorStop(1, "#2f6a4a");
  o.fillStyle = g; o.fillText(s, xr, yb);
  o.globalCompositeOperation = "source-atop";
  o.lineWidth = .7;
  for (let k = x0 - 220; k < xr + 20; k += 2.6) {
    o.strokeStyle = (Math.round(k / 2.6) % 2) ? "rgba(255,236,200,0.35)" : "rgba(40,20,5,0.25)";
    o.beginPath(); o.moveTo(k, yb + 10); o.lineTo(k + 220, y0 - 10); o.stroke();
  }
  ctx.drawImage(off, 0, 0, W, H);
  ctx.font = `900 ${size}px "Playfair Display"`; ctx.textAlign = "right";
  ctx.strokeStyle = rgba(n.ink, .85); ctx.lineWidth = 1; ctx.strokeText(s, xr, yb);
}
function fedSeal(ctx, n, cx, cy, r) {
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = PAPER; ctx.fill();
  ctx.strokeStyle = "#151515"; ctx.lineWidth = 2.4; ctx.stroke();
  ctx.lineWidth = .7; ctx.beginPath(); ctx.arc(cx, cy, r - 4, 0, Math.PI * 2); ctx.stroke();
  arcText(ctx, `FEDERAL RESERVE BANK OF ${n.city} • `, cx, cy, r * .8, `"Old Standard TT"`, "#151515");
  ctx.lineWidth = 1.1; ctx.beginPath(); ctx.arc(cx, cy, r * .66, 0, Math.PI * 2); ctx.stroke();
  rosette(ctx, cx, cy, r * .4, r * .64, "rgba(20,20,20,0.6)", 20, 7);
  ctx.beginPath(); ctx.arc(cx, cy, r * .4, 0, Math.PI * 2); ctx.fillStyle = PAPER; ctx.fill(); ctx.lineWidth = 1; ctx.stroke();
  text(ctx, n.district, cx, cy + r * .2, `900 ${r * .56}px Cinzel`, "#151515");
}
function treasurySeal(ctx, n, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i <= 144; i++) { const a = i / 144 * Math.PI * 2, rr = i % 2 ? r * .94 : r; ctx.lineTo(cx + rr * Math.cos(a), cy + rr * Math.sin(a)); }
  ctx.fillStyle = n.acc; ctx.fill();
  ctx.beginPath(); ctx.arc(cx, cy, r * .9, 0, Math.PI * 2); ctx.fillStyle = PAPER; ctx.fill();
  ctx.strokeStyle = n.acc; ctx.lineWidth = .8; ctx.beginPath(); ctx.arc(cx, cy, r * .86, 0, Math.PI * 2); ctx.stroke();
  arcText(ctx, `THE DEPARTMENT OF THE TREASURY • 1789 • `, cx, cy, r * .73, `"Old Standard TT"`, n.acc);
  ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, r * .6, 0, Math.PI * 2); ctx.stroke();
  const k = r * .42;
  ctx.save(); ctx.translate(cx, cy + 2);
  ctx.beginPath(); ctx.moveTo(-k * .8, -k * .8); ctx.lineTo(k * .8, -k * .8); ctx.lineTo(k * .8, 0); ctx.quadraticCurveTo(k * .8, k * .75, 0, k * 1.05); ctx.quadraticCurveTo(-k * .8, k * .75, -k * .8, 0); ctx.closePath();
  ctx.fillStyle = rgba(n.wash, .8); ctx.fill(); ctx.strokeStyle = n.acc; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.save(); ctx.clip();
  ctx.fillStyle = n.acc; ctx.fillRect(-k, -k * .8, k * 2, k * .5);
  ctx.strokeStyle = PAPER; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-k * .4, -k * .62); ctx.lineTo(k * .4, -k * .62); ctx.stroke();
  ctx.beginPath(); ctx.arc(-k * .4, -k * .5, k * .13, 0, Math.PI); ctx.arc(k * .4, -k * .5, k * .13, 0, Math.PI); ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = n.acc; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-k * .8, k * .2); ctx.lineTo(0, -k * .2); ctx.lineTo(k * .8, k * .2); ctx.stroke();
  ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(-k * .25, k * .55, k * .12, 0, Math.PI * 2); ctx.moveTo(-k * .13, k * .55); ctx.lineTo(k * .35, k * .55); ctx.lineTo(k * .35, k * .68); ctx.stroke();
  ctx.restore();
}
function ribbon(ctx, n, cx, cy, label) {
  ctx.font = `700 15px Cinzel`; ctx.letterSpacing = "5px";
  const w = ctx.measureText(label).width + 60; ctx.letterSpacing = "0px";
  const x0 = cx - w / 2, x1 = cx + w / 2, h = 15;
  ctx.fillStyle = rgba(n.wash, 1); ctx.strokeStyle = n.ink; ctx.lineWidth = 1;
  for (const [a, d] of [[x0, -1], [x1, 1]]) {
    ctx.beginPath(); ctx.moveTo(a, cy - h + 8); ctx.lineTo(a + d * 30, cy - h + 8); ctx.lineTo(a + d * 20, cy + 4); ctx.lineTo(a + d * 30, cy + h + 8); ctx.lineTo(a, cy + h + 8); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  ctx.beginPath(); ctx.rect(x0, cy - h, w, h * 2); ctx.fillStyle = PAPER; ctx.fill(); ctx.fillStyle = rgba(n.wash, .45); ctx.fill(); ctx.stroke();
  text(ctx, label, cx, cy + 5.5, `700 15px Cinzel`, n.ink, "center", 5);
}
function signature(ctx, n, cx, y, [name, title]) {
  text(ctx, name, cx, y, `30px "Pinyon Script"`, "#14161c", "center", 0, 138);
  ctx.strokeStyle = rgba(n.ink, .8); ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(cx - 70, y + 8); ctx.lineTo(cx + 70, y + 8); ctx.stroke();
  text(ctx, title, cx, y + 22, `italic 9px "Old Standard TT"`, n.ink);
}
function specimen(ctx) {
  ctx.save(); ctx.translate(W / 2, H / 2 + 10); ctx.rotate(-.1);
  text(ctx, "SPECIMEN", 0, 22, `700 64px "Old Standard TT"`, "rgba(178,30,40,0.36)", "center", 22);
  ctx.restore();
}

/* ---------- full sides ---------- */
async function front(n) {
  const c = document.createElement("canvas"); c.width = W * S; c.height = H * S;
  const ctx = c.getContext("2d"); ctx.scale(S, S);
  const s = String(n.v);
  const OX = 560, OY = 352, RX = 232, RY = 172;
  const t = await tone(SCENES[n.key].front(GRAY, GRAY.ink, "e" + n.v), "0 0 400 300", RX * 2 * S, RY * 2 * S);

  paper(ctx, n, 11 + n.v);
  washes(ctx, n, [[OX, OY, 330, .55], [990, 330, 260, .5], [1300, 520, 220, .35]]);
  fineLines(ctx, rgba(n.acc, .3), 60, 60, W - 60, H - 60);
  threadDraw(ctx, n, n.thread);
  text(ctx, s, 985, 470, `900 300px "Playfair Display"`, rgba(n.acc, .08));
  border(ctx, n);
  cartouche(ctx, n, "FEDERAL RESERVE NOTE", 37, `700 16px Cinzel`, 5);
  cartouche(ctx, n, n.word, H - 37, `900 20px Cinzel`, 5);
  text(ctx, "THE UNITED STATES OF AMERICA", W / 2, 122, `900 42px Cinzel`, n.ink, "center", 3);

  // portrait-style vignette
  ellipseBand(ctx, OX, OY, RX, RY, 30, rgba(n.ink, .7));
  ctx.strokeStyle = n.ink; ctx.lineWidth = .7; ellipsePath(ctx, OX, OY, RX + 30, RY + 30); ctx.stroke();
  ctx.lineWidth = .5; ellipsePath(ctx, OX, OY, RX + 34, RY + 34); ctx.stroke();
  ctx.save(); ellipsePath(ctx, OX, OY, RX, RY); ctx.clip();
  ctx.fillStyle = PAPER; ctx.fill(); ctx.fillStyle = rgba(n.wash, .4); ctx.fill();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  engrave(ctx, t, (OX - RX) * S, (OY - RY) * S, n.ink);
  ctx.restore();
  ctx.strokeStyle = n.ink; ctx.lineWidth = 2; ellipsePath(ctx, OX, OY, RX, RY); ctx.stroke();
  ctx.lineWidth = .6; ellipsePath(ctx, OX, OY, RX - 5, RY - 5); ctx.stroke();
  ribbon(ctx, n, OX, 566, n.theme);

  // centre panel
  text(ctx, "SERIES", 985, 192, `700 11px "Old Standard TT"`, n.ink, "center", 4);
  text(ctx, "2026", 985, 220, `700 24px Cinzel`, n.ink, "center", 3);
  text(ctx, n.front, 985, 258, `italic 20px "Old Standard TT"`, n.acc);
  text(ctx, "THIS NOTE IS LEGAL TENDER", 985, 292, `700 10.5px "Old Standard TT"`, n.ink, "center", 1.5);
  text(ctx, "FOR ALL DEBTS, PUBLIC AND PRIVATE", 985, 308, `700 10.5px "Old Standard TT"`, n.ink, "center", 1.5);
  ctx.beginPath(); ctx.arc(985, 392, 50, 0, Math.PI * 2); ctx.fillStyle = PAPER; ctx.fill();
  rosette(ctx, 985, 392, 26, 50, rgba(n.acc, .9), 18, 8);
  ctx.strokeStyle = n.ink; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(985, 392, 26, 0, Math.PI * 2); ctx.stroke();
  text(ctx, s, 985, 403, `900 ${s.length > 2 ? 22 : 30}px "Playfair Display"`, n.ink);
  signature(ctx, n, 905, 500, SIGS[0]);
  signature(ctx, n, 1075, 500, SIGS[1]);
  text(ctx, n.plate, 178, 186, `700 14px "Old Standard TT"`, n.ink, "left");
  text(ctx, n.check, 1372, 196, `700 14px "Old Standard TT"`, n.ink, "left");

  watermarkDraw(ctx, t, 1250, 300, 100, 128, false);
  medallion(ctx, n, 104, 104, 58);
  medallion(ctx, n, W - 104, 104, 58);
  medallion(ctx, n, 104, H - 104, 58);
  osNumeral(ctx, n, 1488, 592, s.length === 3 ? 180 : 210);
  dotsDraw(ctx, n, 37);
  fibers(ctx, 97 + n.v);
  specimen(ctx);
  return c.toDataURL("image/png");
}

async function back(n) {
  const c = document.createElement("canvas"); c.width = W * S; c.height = H * S;
  const ctx = c.getContext("2d"); ctx.scale(S, S);
  const s = String(n.v);
  const VX = 420, VY = 162, VW = 660, VH = 280;
  const t = await tone(SCENES[n.key].back(GRAY, GRAY.ink, "b" + n.v), "0 0 660 280", VW * S, VH * S);
  const wmTone = await tone(SCENES[n.key].front(GRAY, GRAY.ink, "w" + n.v), "0 0 400 300", 400, 512);

  paper(ctx, n, 31 + n.v);
  washes(ctx, n, [[750, 300, 380, .5], [1255, 360, 200, .3], [300, 520, 200, .3]]);
  fineLines(ctx, rgba(n.acc, .3), 60, 60, W - 60, H - 60);
  border(ctx, n);
  cartouche(ctx, n, "E PLURIBUS UNUM", 37, `700 16px Cinzel`, 6);
  cartouche(ctx, n, n.word, H - 37, `900 20px Cinzel`, 5);
  text(ctx, "THE UNITED STATES OF AMERICA", W / 2, 122, `900 40px Cinzel`, n.ink, "center", 3);

  // engraved scene with a lathe-work frame
  ctx.save(); ctx.beginPath(); ctx.rect(VX - 14, VY - 14, VW + 28, VH + 28); ctx.rect(VX, VY, VW, VH); ctx.clip("evenodd");
  ctx.fillStyle = PAPER; ctx.fillRect(VX - 14, VY - 14, VW + 28, VH + 28); ctx.fillStyle = rgba(n.wash, .6); ctx.fillRect(VX - 14, VY - 14, VW + 28, VH + 28);
  const col = rgba(n.ink, .7);
  rope(ctx, true, VX - 14, VX + VW + 14, VY - 7, 6, col); rope(ctx, true, VX - 14, VX + VW + 14, VY + VH + 7, 6, col);
  rope(ctx, false, VY - 14, VY + VH + 14, VX - 7, 6, col); rope(ctx, false, VY - 14, VY + VH + 14, VX + VW + 7, 6, col);
  ctx.restore();
  ctx.strokeStyle = n.ink; ctx.lineWidth = .8; ctx.strokeRect(VX - 14, VY - 14, VW + 28, VH + 28);
  ctx.save(); ctx.beginPath(); ctx.rect(VX, VY, VW, VH); ctx.clip();
  ctx.fillStyle = PAPER; ctx.fillRect(VX, VY, VW, VH); ctx.fillStyle = rgba(n.wash, .4); ctx.fillRect(VX, VY, VW, VH);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  engrave(ctx, t, VX * S, VY * S, n.ink);
  ctx.restore();
  ctx.strokeStyle = n.ink; ctx.lineWidth = 2; ctx.strokeRect(VX, VY, VW, VH);
  text(ctx, n.back, VX + VW / 2, 478, `italic 17px "Old Standard TT"`, n.ink);

  fedSeal(ctx, n, 520, 532, 50);
  treasurySeal(ctx, n, 980, 532, 50);
  text(ctx, n.theme, 750, 540, `700 20px Cinzel`, n.acc, "center", 5);

  // clear panel with the high-contrast numeral
  ctx.fillStyle = PAPER; ctx.fillRect(1120, 160, 270, 410);
  ctx.strokeStyle = rgba(n.ink, .45); ctx.lineWidth = .6; ctx.strokeRect(1124, 164, 262, 402);
  const big = s.length === 1 ? 400 : s.length === 2 ? 300 : 230;
  ctx.font = `900 ${big}px "Playfair Display"`;
  const desc = ctx.measureText(s).actualBoundingBoxDescent;
  text(ctx, s, 1255, 505 - desc, `900 ${big}px "Playfair Display"`, n.ink, "center", 0, 248);
  text(ctx, n.v === 1 ? "DOLLAR" : "DOLLARS", 1255, 548, `700 20px Cinzel`, n.ink, "center", 6);

  watermarkDraw(ctx, wmTone, 310, 300, 100, 128, true);
  text(ctx, n.serial, 180, 158, `600 22px "IBM Plex Mono"`, n.acc, "left", 1);
  text(ctx, n.serial, 1390, 596, `600 22px "IBM Plex Mono"`, n.acc, "right", 1);
  text(ctx, n.plate, 180, 470, `700 14px "Old Standard TT"`, n.ink, "left");
  for (const [x, y] of [[104, 104], [W - 104, 104], [104, H - 104], [W - 104, H - 104]]) medallion(ctx, n, x, y, 58);
  threadDraw(ctx, n, W - n.thread);
  dotsDraw(ctx, n, W - 37);
  fibers(ctx, 131 + n.v);
  specimen(ctx);
  return c.toDataURL("image/png");
}

window.jobs = () => NOTES.flatMap(n => [{ v: n.v, side: "front" }, { v: n.v, side: "back" }]);
window.renderJob = async job => {
  await document.fonts.ready;
  for (const f of [`900 20px Cinzel`, `700 20px Cinzel`, `900 20px "Playfair Display"`, `700 20px "Old Standard TT"`, `italic 20px "Old Standard TT"`, `20px "Pinyon Script"`, `600 20px "IBM Plex Mono"`]) await document.fonts.load(f);
  const n = NOTES.find(x => x.v === job.v);
  return job.side === "front" ? front(n) : back(n);
};
