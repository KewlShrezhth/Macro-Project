// The New American Note Series: 2:30 pitch film. Pure function of time: window.seek(t) paints frame t.
// Timing is in beats (u) on the 88 bpm grid in beats.json; docs/shotlist.md is the plan this follows.
// Every note on screen is a real render from assets/ (generator/ output), cropped and moved, never redrawn.
import * as M from './lib/motion.js';

const { W, H, E, prog, lerp, clamp, springU, springKeys, SPRING, wobble, kf, font, layout, glyph, text, rrect } = M;

// Brand tokens (assets/brand.json): navy ink, warm paper, one gold accent.
const C = { ink: '#0b1424', ink2: '#16223b', paper: '#f4efe2', gold: '#d8b46a', muted: '#9aa3b5', mutedInk: '#5b6272' };
const DISPLAY = 'Display', UI = 'UI';
const VALUES = [1, 5, 10, 20, 50, 100];
const MM = { 1: 156, 5: 163, 10: 170, 20: 177, 50: 184, 100: 191 };
const SOFT = { stiffness: 150, damping: 19 };
const DEAL = { stiffness: 210, damping: 21 };

// ------------------------------------------------------------------ HITS: every accent gets a sound
const HITS = [
  [0, 'macro open', 'sub', { len: 1.2 }],
  [4, 'deal $1', 'click'], [5, 'deal $5', 'click'], [6, 'deal $10', 'click'], [7, 'deal $50', 'click'], [8, 'deal $100', 'thud'],
  [12, 'Money', 'pop', { pitch: 'D5' }], [13, 'you', 'pop', { pitch: 'F#5' }], [14, 'can', 'pop', { pitch: 'A5' }],
  [16, 'trust.', 'bell', { pitch: 'D6' }],
  [20, 'series line', 'type', { len: 1.6, n: 14 }],
  [24, 'chapter 01', 'impact'], [26, 'S1 chip', 'tick'], [27, 'S2 chip', 'tick'], [28, 'S3 chip', 'tick'],
  [32, 'into S1', 'whoosh', { len: 0.5 }], [34.5, 'zoom numeral', 'whoosh', { len: 0.6, from: 500, to: 2600 }],
  [36.5, 'tilt copper', 'blip', { pitch: 'A5' }], [39, 'tilt green', 'blip', { pitch: 'E6' }],
  [41.5, 'tilt copper', 'blip', { pitch: 'A5' }], [44, 'tilt green', 'blip', { pitch: 'E6' }],
  [48, 'into S2', 'whoosh', { len: 0.5 }], [50, 'trace $50', 'riser', { len: 0.6 }], [51.5, 'trace $100', 'tick'],
  [55, 'magnifier', 'pop', { pitch: 'A5' }], [59, 'read USA 100', 'tick'],
  [64, 'into S3', 'whoosh', { len: 0.5 }], [68, 'held to light', 'swell', { len: 1.2 }], [72, 'portrait appears', 'bell', { pitch: 'A5' }],
  [74, 'push to watermark', 'whoosh', { len: 0.6, from: 400, to: 2000 }],
  [80, 'chapter 02', 'impact'], [82, 'A1 chip', 'tick'], [83, 'A2 chip', 'tick'], [84, 'length chip', 'tick'],
  [88, 'into A1', 'whoosh', { len: 0.5 }], [90, 'zoom numeral', 'whoosh', { len: 0.5, from: 600, to: 2400 }],
  [93, 'low vision on', 'click'], [97, 'low vision off', 'click'], [99, 'whole note blur', 'click'], [102, 'sharp again', 'click'],
  [104, 'into A2', 'whoosh', { len: 0.5 }],
  [106, '1 dot', 'tok', { pitch: 'D5' }], [107.5, '2 dots', 'tok', { pitch: 'E5' }], [109, '3 dots', 'tok', { pitch: 'F#5' }],
  [110.5, '4 dots', 'tok', { pitch: 'A5' }], [112, '5 dots', 'tok', { pitch: 'B5' }], [113.5, '6 dots', 'tok', { pitch: 'D6' }],
  [116, 'read by touch', 'type', { len: 1.4, n: 12 }],
  [120, 'into lengths', 'whoosh', { len: 0.5 }],
  [121, '$1 156', 'tick'], [122.5, '$5 163', 'tick'], [124, '$10 170', 'tick'], [125.5, '$20 177', 'tick'], [127, '$50 184', 'tick'], [128.5, '$100 191', 'thud'],
  [132, '+35 mm', 'bell', { pitch: 'A5' }],
  [136, 'chapter 03', 'impact'], [137, 'M chips', 'tick'], [138, 'M chips', 'tick'],
  [140, 'into store', 'whoosh', { len: 0.5 }], [143, 'needle swings', 'boing', { pitch: 'D5', to: 'A5' }],
  [146, 'chip', 'tick'], [147.5, 'chip', 'tick'], [149, 'chip', 'tick'],
  [152, 'into exchange', 'whoosh', { len: 0.5 }],
  [154, 'shop', 'coins'], [156, 'wages', 'coins'], [158, 'bank', 'coins'], [160, 'shop', 'coins'], [162, 'wages', 'coins'],
  [164, 'into AD', 'whoosh', { len: 0.5 }],
  [164.5, 'AD', 'pop', { pitch: 'D5' }], [165.5, 'C', 'pop', { pitch: 'F#5' }], [166.5, 'I', 'pop', { pitch: 'A5' }],
  [167.5, 'G', 'pop', { pitch: 'B5' }], [168.5, 'NX', 'pop', { pitch: 'D6' }],
  [170, 'C lights', 'bell', { pitch: 'D6' }], [172, 'I caption', 'tick'], [174, 'AD rises', 'tick'],
  [176, 'into reserve', 'whoosh', { len: 0.5 }], [177, 'arc trade', 'blip', { pitch: 'D6' }], [178, 'arc reserves', 'blip', { pitch: 'F#6' }],
  [179, 'arc savings', 'blip', { pitch: 'A6' }], [181, 'tagline', 'type', { len: 1.3, n: 12 }],
  [184, 'cost-benefit', 'impact'],
  [186.5, 'cost 1', 'thud'], [188.5, 'cost 2', 'thud'], [190.5, 'cost 3', 'thud'],
  [194.5, 'benefit 1', 'thud'], [196.5, 'benefit 2', 'thud'], [198.5, 'benefit 3', 'thud', { pitch: 70 }],
  [202, 'verdict', 'bell', { pitch: 'A5' }],
  [208, 'end card', 'impact'], [210, 'title', 'pop', { pitch: 'D5' }], [212, 'tagline', 'bell', { pitch: 'D6' }],
];

// ------------------------------------------------------------------ static backdrops (built once in init)
let BG_NAVY, BG_PAPER;
function makeBg(base, line, vignette) {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, W, H);
  // guilloché bands: interleaved sine families, the same engraving language as the notes
  g.lineWidth = 1.1; g.strokeStyle = line;
  for (const [y0, amp, ph] of [[H * 0.86, 46, 0], [H * 0.12, 30, 1.7]]) {
    for (let k = 0; k < 22; k++) {
      g.beginPath();
      for (let x = -10; x <= W + 10; x += 5) {
        const y = y0 + (k - 11) * 4.2 + amp * Math.sin(x / 150 + k * 0.29 + ph) * Math.sin(x / 610 + k * 0.04);
        x < 0 ? g.moveTo(x, y) : g.lineTo(x, y);
      }
      g.stroke();
    }
  }
  const rg = g.createRadialGradient(W * 0.55, H * 0.45, 200, W * 0.5, H * 0.5, W * 0.78);
  rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, vignette);
  g.fillStyle = rg; g.fillRect(0, 0, W, H);
  return c;
}
const bg = (ctx, which) => ctx.drawImage(which === 'paper' ? BG_PAPER : BG_NAVY, 0, 0);

// ------------------------------------------------------------------ note helpers
const nh = (img, w) => (w * img.height) / img.width;
// Note centred at (cx, cy), width w, rotated; sh = shadow strength.
function drawNote(ctx, img, cx, cy, w, rot = 0, sh = 1) {
  const h = nh(img, w);
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
  if (sh > 0) {
    ctx.shadowColor = `rgba(0,0,0,${0.55 * sh})`; ctx.shadowBlur = 46; ctx.shadowOffsetY = 22;
    ctx.fillStyle = '#000'; ctx.fillRect(-w / 2 + 8, -h / 2 + 8, w - 16, h - 16);
    ctx.shadowColor = 'transparent';
  }
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
}
// Geometry of a note placed so its point (fx, fy) sits on screen point (sx, sy).
function placeAt(img, fx, fy, sx, sy, w) { const h = nh(img, w); return { x: sx - fx * w, y: sy - fy * h, w, h }; }
function drawPlaced(ctx, img, P) { ctx.drawImage(img, P.x, P.y, P.w, P.h); }

// ------------------------------------------------------------------ type helpers
// Per-glyph rise out of a baseline mask.
function rise(ctx, str, x, y, size, color, u, u0, { family = DISPLAY, weight = 900, stagger = 0.025, track = -0.012, spring = SOFT } = {}) {
  const f = font(size, weight, family), L = layout(ctx, str, f, track * size);
  ctx.save(); ctx.beginPath(); ctx.rect(x - 30, y - size * 1.1, L.width + 80, size * 1.42); ctx.clip();
  L.glyphs.forEach((g, j) => {
    const k = springU(u, u0 + j * stagger, spring);
    if (k <= 0) return;
    glyph(ctx, g.ch, x + g.cx, y + (1 - k) * size * 1.15, f, color);
  });
  ctx.restore();
  return L.width;
}
// Left-to-right wipe reveal (mono copy).
function wipe(ctx, str, x, y, f, color, u, u0, dur = 1.2) {
  const p = E.outCubic(prog(u, u0, u0 + dur));
  if (p <= 0) return;
  ctx.font = f; const w = ctx.measureText(str).width;
  ctx.save(); ctx.beginPath(); ctx.rect(x - 4, y - 70, (w + 12) * p, 100); ctx.clip();
  text(ctx, str, x, y, f, color);
  ctx.restore();
}
// Typed mono line with a gold block cursor.
function typeOn(ctx, str, x, y, size, color, u, u0, dur) {
  const p = prog(u, u0, u0 + dur);
  if (u < u0) return;
  const n = Math.floor(p * str.length + 1e-6), shown = str.slice(0, n);
  const f = font(size, 600, UI);
  text(ctx, shown, x, y, f, color);
  ctx.font = f; const w = ctx.measureText(shown).width;
  if (p < 1 || Math.floor((u - u0 - dur) * 2) % 2 === 0 && u - u0 - dur < 3) { ctx.fillStyle = C.gold; ctx.fillRect(x + w + 4, y - size * 0.8, size * 0.55, size * 0.95); }
}
// Feature label: gold rule draws, code reveals, title rises, copy wipes.
function featText(ctx, u, u0, code, title, desc, { x = 96, y = 330, dark = true, size = 96 } = {}) {
  const col = dark ? C.paper : C.ink, sub = dark ? C.muted : C.mutedInk;
  const r = E.outCubic(prog(u, u0 - 0.4, u0 + 0.4));
  if (r > 0) { ctx.fillStyle = C.gold; ctx.fillRect(x, y - 12, 56 * r, 4); }
  wipe(ctx, code, x + 74, y, font(28, 600, UI), C.gold, u, u0 - 0.2, 1);
  title.forEach((t, i) => rise(ctx, t, x, y + 120 + i * size * 1.02, size, col, u, u0 + i * 0.35));
  const ty = y + 120 + (title.length - 1) * size * 1.02;
  desc.forEach((d, i) => wipe(ctx, d, x, ty + 86 + i * 46, font(31, 600, UI), sub, u, u0 + 1.2 + i * 0.4, 1.4));
}
function pill(ctx, label, x, y, on, { size = 26, dark = true } = {}) {
  const f = font(size, 600, UI); ctx.font = f;
  const w = ctx.measureText(label).width + 120, h = size * 2;
  rrect(ctx, x, y, w, h, h / 2); ctx.fillStyle = dark ? C.ink2 : '#e6dfcd'; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = M.mix(C.muted, C.gold, on); ctx.stroke();
  text(ctx, label, x + 28, y + h / 2 + size * 0.36, f, dark ? C.paper : C.ink);
  const kx = x + w - 62, r = h * 0.32;
  rrect(ctx, kx, y + h / 2 - r - 2, 44, 2 * r + 4, r + 2); ctx.fillStyle = M.mix('#3a465f', C.gold, on); ctx.fill();
  ctx.beginPath(); ctx.arc(kx + r + 2 + on * (44 - 2 * r - 4), y + h / 2, r - 2, 0, M.TAU); ctx.fillStyle = C.paper; ctx.fill();
}

// ------------------------------------------------------------------ fan of all six notes (hook + end card)
function fanPose(i, px, py, R) { const a = (i - 2.5) * 0.15; return { x: px + R * Math.sin(a), y: py - R * Math.cos(a), rot: a }; }

// ================================================================== SCENES
// HOOK  u 0..24: macro on the $20 engraving pulls back, the other five are dealt in, headline.
function sceneHook(ctx, u, IMG) {
  bg(ctx, 'navy');
  const [px, py, R, w] = springKeys(u, [[0, [960, 1900, 1250, 1000]], [11.4, [1370, 1860, 1000, 760]]], SOFT);
  const order = [1, 5, 10, 50, 100];
  VALUES.forEach((v, i) => {
    if (v === 20) return;
    const j = order.indexOf(v), k = springU(u, 3.6 + j, DEAL);
    if (k <= 0) return;
    const p = fanPose(i, px, py, R);
    drawNote(ctx, IMG[`n${v}f`], p.x + (1 - k) * 1500, p.y - (1 - k) * 260, w, p.rot + (1 - k) * 0.55);
  });
  // the $20: frame 0 is a macro on the engraved portrait
  const img = IMG.n20hi, p = fanPose(3, px, py, R);
  const k = 1 - (1 - prog(u, 0, 7)) ** 3;
  const w0 = 6600, ww = Math.exp(lerp(Math.log(w0), Math.log(w), k));
  const c0x = 960, c0y = 540 - (0.44 - 0.5) * nh(img, w0);
  drawNote(ctx, img, lerp(c0x, p.x, k), lerp(c0y, p.y, k), ww, lerp(-0.04, p.rot, k), k);
  // headline
  const s = 150, x = 96;
  rise(ctx, 'Money', x, 330, s, C.paper, u, 12);
  rise(ctx, 'you', x + 520, 330, s, C.paper, u, 13);
  rise(ctx, 'can', x, 480, s, C.paper, u, 14);
  const tw = rise(ctx, 'trust.', x + 320, 480, s, C.gold, u, 16, { spring: SPRING.bouncy, stagger: 0.04 });
  const ul = E.inOutCubic(prog(u, 16.6, 17.8));
  if (ul > 0) { ctx.fillStyle = C.gold; ctx.fillRect(x + 320, 512, tw * ul, 7); }
  typeOn(ctx, 'THE NEW AMERICAN NOTE SERIES · 2026', x, 610, 30, C.muted, u, 20, 2.2);
}

// CHAPTER CARD on paper: huge gold numeral, title, the items it will cover.
function sceneChapter(ctx, u, u0, num, title, items, step = 1) {
  bg(ctx, 'paper');
  const f = font(600, 900, DISPLAY), L = layout(ctx, num, f, -20);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, 760); ctx.clip();
  L.glyphs.forEach((g, j) => {
    const k = springU(u, u0 - 0.15 + j * 0.18, SPRING.bouncy);
    if (k > 0) glyph(ctx, g.ch, 70 + g.cx, 740 + (1 - k) * 640, f, C.gold);
  });
  ctx.restore();
  const tx = 80 + L.width + 70;
  rise(ctx, title, tx, 470, 150, C.ink, u, u0 + 0.4, { stagger: 0.03 });
  const r = E.inOutCubic(prog(u, u0 + 1, u0 + 2));
  ctx.fillStyle = C.ink; ctx.fillRect(tx, 520, (W - tx - 96) * r, 3);
  items.forEach(([code, label], i) => {
    const k = springU(u, u0 + 2 + i * step, SOFT);
    if (k <= 0) return;
    const y = 610 + i * 78 - (1 - k) * 40;
    ctx.save(); ctx.globalAlpha = clamp(k * 1.5);
    text(ctx, code, tx, y, font(30, 600, UI), '#a4802f');
    text(ctx, label, tx + 110, y, font(34, 600, UI), C.ink);
    ctx.restore();
  });
}

// S1  u 32..48: colour-shifting numeral on the $100, tilted under a moving light.
function sceneShift(ctx, u, IMG) {
  const u0 = 32;
  bg(ctx, 'navy');
  featText(ctx, u, u0, 'S1 · SECURITY FEATURE', ['Colour-shifting', 'numeral'], ['Tilt the note and the', 'ink turns copper → green.', 'A photocopy can’t do that.'], { size: 92 });
  const img = IMG.n100f;
  const [w, fx, fy] = springKeys(u, [[32, [1080, 0.5, 0.5]], [34.5, [3900, 0.918, 0.885]], [45.5, [3300, 0.918, 0.885]]], SOFT);
  const enter = springU(u, 31.6, SOFT);
  const th = kf(u, [[35, 0], [36.5, -1], [39, 1], [41.5, -1], [44, 1], [46.5, 0.2]], E.inOutSine);
  const sx = 1340, sy = 540 + (1 - enter) * 700;
  ctx.save();
  ctx.beginPath(); ctx.rect(800, 0, W - 800, H); ctx.clip();
  ctx.translate(sx, sy); ctx.rotate(th * 0.045); ctx.transform(1, 0, th * 0.12, 1 - 0.05 * Math.abs(th), 0, 0); ctx.translate(-sx, -sy);
  const P = placeAt(img, fx, fy, sx, sy, w);
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 20; ctx.fillStyle = '#000';
  ctx.fillRect(P.x + 8, P.y + 8, P.w - 16, P.h - 16); ctx.shadowColor = 'transparent';
  drawPlaced(ctx, img, P);
  // the numeral itself shifts: hue blend keeps the engraving's light and shade, swaps the ink colour
  const on = prog(u, 34.5, 35.5), amt = (th + 1) / 2;
  const bx = P.x + 0.872 * P.w, by = P.y + 0.82 * P.h, bw = 0.096 * P.w, bh = 0.135 * P.h;
  if (on > 0) {
    ctx.save(); ctx.beginPath(); ctx.rect(bx, by, bw, bh); ctx.clip();
    ctx.globalCompositeOperation = 'hue';
    ctx.globalAlpha = on * amt; ctx.fillStyle = '#18a866'; ctx.fillRect(bx, by, bw, bh);
    ctx.globalAlpha = on * (1 - amt); ctx.fillStyle = '#c4661c'; ctx.fillRect(bx, by, bw, bh);
    // a sheen travels across as the angle changes
    ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = on * 0.9;
    const gx = bx + bw * (0.5 + th * 0.6);
    const lg = ctx.createLinearGradient(gx - bw * 0.35, by, gx + bw * 0.35, by + bh);
    lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.5, 'rgba(255,255,255,1)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = lg; ctx.fillRect(bx, by, bw, bh);
    ctx.restore();
  }
  ctx.restore();
  // readout: the angle and the colour it gives
  const rk = springU(u, 35.5, SOFT);
  if (rk > 0) {
    const x0 = 880, y0 = 980 + (1 - rk) * 140;
    text(ctx, 'COPPER', x0, y0, font(28, 600, UI), M.mix('#e09a5a', C.muted, amt));
    text(ctx, 'GREEN', x0 + 560, y0, font(28, 600, UI), M.mix(C.muted, '#5fd39a', amt));
    ctx.fillStyle = '#2a3652'; ctx.fillRect(x0 + 140, y0 - 11, 390, 4);
    ctx.beginPath(); ctx.arc(x0 + 140 + 390 * amt, y0 - 9, 12, 0, M.TAU); ctx.fillStyle = C.gold; ctx.fill();
  }
}

// S2  u 48..64: the security thread sits in a different place on every value.
function sceneThread(ctx, u, IMG) {
  const u0 = 48;
  bg(ctx, 'navy');
  featText(ctx, u, u0, 'S2 · SECURITY FEATURE', ['Security', 'thread'], ['Woven into the paper.', 'Reads “USA 50”, “USA 100”…', 'and moves for every value.'], { size: 92 });
  const notes = [[IMG.n50f, 0.358, 300, 'USA 50', 50], [IMG.n100f, 0.684, 770, 'USA 100', 51.5]];
  const w = 1040, cx = 1330;
  const geo = notes.map(([img, tx, cy, label, ut], i) => {
    const k = springU(u, u0 - 0.2 + i * 0.6, DEAL);
    const x = cx + (1 - k) * 1300, h = nh(img, w);
    drawNote(ctx, img, x, cy, w, (1 - k) * 0.2 * (i ? -1 : 1));
    const lx = x - w / 2 + tx * w, top = cy - h / 2, p = E.inOutCubic(prog(u, ut, ut + 1.6));
    if (p > 0) {
      ctx.fillStyle = C.gold; ctx.fillRect(lx - 3, top, 6, h * p);
      ctx.beginPath(); ctx.arc(lx, top + h * p, 10, 0, M.TAU); ctx.fill();
      const tk = springU(u, ut + 1.4, SOFT);
      if (tk > 0) {
        ctx.save(); ctx.globalAlpha = clamp(tk * 1.4);
        rrect(ctx, lx + 18, top - 52 + (1 - tk) * 20, 170, 44, 22); ctx.fillStyle = C.gold; ctx.fill();
        text(ctx, label, lx + 103, top - 21 + (1 - tk) * 20, font(24, 600, UI), C.ink, 'center');
        ctx.restore();
      }
    }
    return { img, lx, cy, top, h };
  });
  // magnifier on the $100 thread: a full-resolution crop of the same note, so "USA 100" is legible
  const mk = springU(u, 55, SPRING.bouncy);
  if (mk > 0) {
    const g = geo[1], th = IMG.thr100;
    const r = 200 * mk, cx2 = g.lx - 330, cy2 = g.cy - 20;
    ctx.strokeStyle = C.gold; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx2 + r * 0.95, cy2 + r * 0.3); ctx.lineTo(g.lx, g.cy); ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.arc(cx2, cy2, r, 0, M.TAU); ctx.clip();
    const sc = 1.25, pan = kf(u, [[55, 0], [63, 1]], E.inOutSine) * (th.height * sc - 2 * r - 40);
    ctx.drawImage(th, cx2 - (th.width * sc) / 2, cy2 - r - 20 - pan, th.width * sc, th.height * sc);
    ctx.restore();
    ctx.beginPath(); ctx.arc(cx2, cy2, r, 0, M.TAU); ctx.lineWidth = 7; ctx.strokeStyle = C.gold; ctx.stroke();
  }
}

// S3  u 64..80: the watermark is invisible until the $10 is held to the light.
function sceneWater(ctx, u, IMG) {
  const u0 = 64;
  bg(ctx, 'navy');
  const light = E.inOutCubic(prog(u, 67, 69.5));
  ctx.fillStyle = `rgba(2,5,12,${0.55 * light})`; ctx.fillRect(0, 0, W, H);
  featText(ctx, u, u0, 'S3 · SECURITY FEATURE', ['Watermark', 'window'], ['Hold it to the light and', 'a second portrait appears.', 'It’s in the paper, not the ink.'], { size: 92 });
  const img = IMG.n10f;
  const enter = springU(u, u0 - 0.2, DEAL);
  const [w, fx, fy] = springKeys(u, [[64, [1120, 0.5, 0.5]], [74, [2700, 0.768, 0.43]]], SOFT);
  const sx = 1340 + (1 - enter) * 1300, sy = 520;
  const P = placeAt(img, fx, fy, sx, sy, w);
  ctx.save(); ctx.beginPath(); ctx.rect(800, 0, W - 800, H); ctx.clip();
  // the light box behind the note
  if (light > 0) {
    const lx = P.x + 0.768 * P.w, ly = P.y + 0.43 * P.h;
    const rg = ctx.createRadialGradient(lx, ly, 20, lx, ly, 900);
    rg.addColorStop(0, `rgba(255,244,214,${0.95 * light})`); rg.addColorStop(1, 'rgba(255,244,214,0)');
    ctx.fillStyle = rg; ctx.fillRect(800, 0, W - 800, H);
  }
  ctx.shadowColor = `rgba(0,0,0,${0.5 * (1 - light)})`; ctx.shadowBlur = 40; ctx.shadowOffsetY = 20; ctx.fillStyle = '#000';
  if (light < 1) ctx.fillRect(P.x + 8, P.y + 8, P.w - 16, P.h - 16);
  ctx.shadowColor = 'transparent';
  drawPlaced(ctx, img, P);
  const ex = P.x + 0.768 * P.w, ey = P.y + 0.43 * P.h, rx = 0.052 * P.w, ry = 0.175 * P.h;
  // front-lit: paper covers the window; backlit: the rest of the note darkens and the window glows through
  if (light < 1) {
    ctx.save(); ctx.translate(ex, ey); ctx.scale(rx, ry);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, `rgba(247,242,232,${1 - light})`); g.addColorStop(0.82, `rgba(247,242,232,${1 - light})`); g.addColorStop(1, 'rgba(247,242,232,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 1.05, 0, M.TAU); ctx.fill();
    ctx.restore();
  }
  if (light > 0) {
    ctx.save(); ctx.beginPath(); ctx.rect(P.x, P.y, P.w, P.h); ctx.clip();
    ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = M.mix('#ffffff', '#a99d86', light); ctx.fillRect(P.x, P.y, P.w, P.h);
    ctx.globalCompositeOperation = 'screen';
    ctx.translate(ex, ey); ctx.scale(rx, ry);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1.3);
    g.addColorStop(0, `rgba(255,236,190,${0.55 * light})`); g.addColorStop(1, 'rgba(255,236,190,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 1.3, 0, M.TAU); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
  pill(ctx, light > 0.5 ? 'HELD TO LIGHT' : 'FRONT LIGHT', 880, 940 + (1 - springU(u, 65, SOFT)) * 160, light);
}

// A1  u 88..104: large high-contrast numeral, checked with a low-vision blur.
function sceneNumerals(ctx, u, IMG) {
  const u0 = 88;
  bg(ctx, 'navy');
  featText(ctx, u, u0, 'A1 · ACCESSIBILITY FEATURE', ['Large, high-', 'contrast numerals'], ['Dark numbers on light panels.', 'Readable even with', 'low vision.'], { size: 76 });
  const img = IMG.n5b, enter = springU(u, u0 - 0.2, DEAL);
  const [w, fx, fy] = springKeys(u, [[88, [1130, 0.5, 0.5]], [90, [2500, 0.8, 0.46]], [97, [1130, 0.5, 0.5]]], SOFT);
  const lv = Math.max(kf(u, [[92.6, 0], [93, 1], [96.6, 1], [97, 0]]), kf(u, [[98.6, 0], [99, 1], [101.6, 1], [102, 0]]));
  const sx = 1340 + (1 - enter) * 1300, sy = 520;
  const P = placeAt(img, fx, fy, sx, sy, w);
  ctx.save(); ctx.beginPath(); ctx.rect(800, 0, W - 800, H); ctx.clip();
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 20; ctx.fillStyle = '#000';
  ctx.fillRect(P.x + 8, P.y + 8, P.w - 16, P.h - 16); ctx.shadowColor = 'transparent';
  if (lv > 0.01) ctx.filter = `blur(${(lv * 15).toFixed(2)}px)`;
  drawPlaced(ctx, img, P);
  ctx.filter = 'none';
  ctx.restore();
  pill(ctx, 'LOW-VISION VIEW', 880, 940 + (1 - springU(u, 91.5, SOFT)) * 160, lv);
  const ok = springU(u, 100, SPRING.bouncy);
  if (ok > 0) {
    ctx.save(); ctx.translate(1660, 960); ctx.rotate(-0.06); ctx.scale(ok, ok);
    rrect(ctx, -150, -42, 300, 84, 42); ctx.fillStyle = C.gold; ctx.fill();
    text(ctx, 'STILL READS 5', 0, 10, font(26, 600, UI), C.ink, 'center');
    ctx.restore();
  }
}

// A2  u 104..120: tactile dots, one per value step, counted out on the beat.
function sceneDots(ctx, u, IMG) {
  const u0 = 104;
  bg(ctx, 'navy');
  const r = E.outCubic(prog(u, u0 - 0.4, u0 + 0.4));
  ctx.fillStyle = C.gold; ctx.fillRect(96, 128, 56 * r, 4);
  wipe(ctx, 'A2 · ACCESSIBILITY FEATURE', 170, 140, font(28, 600, UI), C.gold, u, u0 - 0.2, 1);
  rise(ctx, 'Tactile raised dots', 96, 250, 88, C.paper, u, u0);
  wipe(ctx, 'One dot for $1, up to six for $100.', 1010, 250, font(31, 600, UI), C.muted, u, u0 + 1.6, 1.4);
  const cw = 220, gap = 70, x0 = 125, y0 = 330, ar = 2.28, ch = cw * ar;
  VALUES.forEach((v, i) => {
    const ut = 106 + i * 1.5, k = springU(u, ut, SPRING.bouncy);
    if (k <= 0) return;
    const img = IMG[`n${v}f`], sw = 0.115 * img.width, sh = sw * ar;
    const sy = clamp(0.62 * img.height - sh / 2, 0, img.height - sh);
    const x = x0 + i * (cw + gap), y = y0 + (1 - k) * 140;
    ctx.save(); ctx.globalAlpha = clamp(k * 2);
    ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 14;
    rrect(ctx, x, y, cw, ch, 16); ctx.fillStyle = '#000'; ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.save(); rrect(ctx, x, y, cw, ch, 16); ctx.clip();
    ctx.drawImage(img, 0, sy, sw, sh, x, y, cw, ch);
    ctx.restore();
    // the dot count, as gold beads under each corner
    const n = i + 1, sp = 30;
    for (let d = 0; d < n; d++) {
      const dk = springU(u, ut + 0.15 + d * 0.08, SPRING.bouncy);
      if (dk <= 0) continue;
      ctx.beginPath(); ctx.arc(x + cw / 2 + (d - (n - 1) / 2) * sp, y0 + ch + 48, 10 * dk, 0, M.TAU); ctx.fillStyle = C.gold; ctx.fill();
    }
    text(ctx, `$${v}`, x + cw / 2, y0 + ch + 112, font(34, 600, UI), C.paper, 'center');
    ctx.restore();
  });
  typeOn(ctx, 'READ BY TOUCH. NO SIGHT NEEDED.', 1010, 300, 26, C.gold, u, 116, 2);
}

// LENGTHS  u 120..136: every value is 7 mm longer than the one below it.
function sceneLengths(ctx, u, IMG) {
  const u0 = 120;
  bg(ctx, 'navy');
  const r = E.outCubic(prog(u, u0 - 0.4, u0 + 0.4));
  ctx.fillStyle = C.gold; ctx.fillRect(96, 88, 56 * r, 4);
  wipe(ctx, 'A1 + A2 · BUILT IN TOO', 170, 100, font(28, 600, UI), C.gold, u, u0 - 0.2, 1);
  rise(ctx, 'A different length for every value', 96, 200, 78, C.paper, u, u0, { stagger: 0.015 });
  const s = 6.4, x0 = 170, top0 = 262, step = 64;
  VALUES.forEach((v, i) => {
    const ut = 121 + i * 1.5, k = springU(u, ut, DEAL);
    if (k <= 0) return;
    const img = IMG[`n${v}f`], w = MM[v] * s, h = nh(img, w), top = top0 + i * step;
    const x = x0 - (1 - k) * (w + 300);
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = -6; ctx.fillStyle = '#000';
    ctx.fillRect(x + 4, top + 4, w - 8, h - 8); ctx.shadowColor = 'transparent';
    ctx.drawImage(img, x, top, w, h);
    ctx.restore();
    const lk = springU(u, ut + 0.4, SOFT);
    if (lk > 0) {
      ctx.save(); ctx.globalAlpha = clamp(lk * 1.6);
      const lx = x0 + MM[100] * s + 250 + (1 - lk) * 30;
      ctx.fillStyle = 'rgba(154,163,181,.5)'; ctx.fillRect(x0 + w + 14, top + 33, (lx - 18 - x0 - w - 14) * lk, 2);
      text(ctx, `$${v}`, lx, top + 44, font(32, 600, UI), C.gold);
      text(ctx, `${MM[v]} mm`, lx + 110, top + 44, font(32, 600, UI), C.paper);
      ctx.restore();
    }
  });
  // +35 mm bracket between the $1 and $100 right edges
  const bk = springU(u, 132, SOFT);
  if (bk > 0) {
    const a = x0 + MM[1] * s, b = x0 + MM[100] * s, y = 240;
    ctx.save(); ctx.globalAlpha = clamp(bk * 1.5);
    ctx.strokeStyle = C.gold; ctx.lineWidth = 3; ctx.setLineDash([8, 8]);
    ctx.beginPath(); ctx.moveTo(a, y); ctx.lineTo(a, top0 + 40); ctx.moveTo(b, y); ctx.lineTo(b, top0 + 5 * step + 40); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(a, y); ctx.lineTo(a + (b - a) * bk, y); ctx.stroke();
    rrect(ctx, b + 20, y - 26, 190, 52, 26); ctx.fillStyle = C.gold; ctx.fill();
    text(ctx, '+35 mm', b + 115, y + 10, font(28, 600, UI), C.ink, 'center');
    ctx.restore();
  }
}

// M1  u 140..152: store of value, a trust gauge.
function sceneStore(ctx, u) {
  const u0 = 140;
  bg(ctx, 'navy');
  featText(ctx, u, u0, 'M1 · STORE OF VALUE', ['Savings keep', 'their worth'], ['Hard-to-fake money means', 'people trust what they save.'], { size: 92 });
  const cx = 1360, cy = 690, R = 360, k = springU(u, u0 - 0.1, SOFT);
  ctx.save(); ctx.translate(0, (1 - k) * 600);
  ctx.lineWidth = 3;
  for (let i = 0; i <= 40; i++) {
    const a = Math.PI + (i / 40) * Math.PI, big = i % 5 === 0;
    const r0 = big ? R - 46 : R - 26;
    ctx.strokeStyle = M.mix('#4a5672', C.gold, i / 40);
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.stroke();
  }
  ctx.lineWidth = 6; ctx.strokeStyle = '#2a3652'; ctx.beginPath(); ctx.arc(cx, cy, R + 16, Math.PI, 0); ctx.stroke();
  const n = springU(u, 143, { stiffness: 90, damping: 7 });
  const a = Math.PI + lerp(0.18, 0.84, n) * Math.PI;
  ctx.strokeStyle = C.gold; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * (R - 70), cy + Math.sin(a) * (R - 70)); ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.beginPath(); ctx.arc(cx, cy, 18, 0, M.TAU); ctx.fillStyle = C.gold; ctx.fill();
  text(ctx, 'LOW TRUST', cx - R, cy + 56, font(26, 600, UI), C.muted, 'center');
  text(ctx, 'HIGH TRUST', cx + R, cy + 56, font(26, 600, UI), C.gold, 'center');
  ctx.restore();
  ['COUNTERFEITS ↓', 'PRICES STEADY', 'SAVINGS SAFE'].forEach((t, i) => {
    const ck = springU(u, 146 + i * 1.5, SPRING.bouncy);
    if (ck <= 0) return;
    const x = 1000 + i * 290, y = 870;
    ctx.save(); ctx.translate(x + 130, y + 30); ctx.scale(ck, ck);
    rrect(ctx, -130, -30, 260, 60, 30); ctx.strokeStyle = C.gold; ctx.lineWidth = 2; ctx.stroke();
    text(ctx, t, 0, 9, font(24, 600, UI), C.paper, 'center');
    ctx.restore();
  });
}

// M2  u 152..164: medium of exchange, one note travelling the shop -> wages -> bank loop.
function sceneExchange(ctx, u, IMG) {
  const u0 = 152;
  bg(ctx, 'navy');
  featText(ctx, u, u0, 'M2 · MEDIUM OF EXCHANGE', ['Faster, safer', 'everyday trade'], ['Easy to check at a glance,', 'so every hand-off is quick.'], { size: 92 });
  const cx = 1370, cy = 560, R = 300;
  const ring = E.inOutCubic(prog(u, 152.3, 153.6));
  ctx.save();
  ctx.strokeStyle = 'rgba(216,180,106,.55)'; ctx.lineWidth = 3; ctx.setLineDash([14, 14]); ctx.lineDashOffset = -u * 18;
  ctx.beginPath(); ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + M.TAU * ring); ctx.stroke();
  ctx.restore();
  const nodes = [['SHOP', -90], ['WAGES', 30], ['BANK', 150]];
  nodes.forEach(([label, deg], i) => {
    const k = springU(u, 152.5 + i * 0.5, SPRING.bouncy);
    if (k <= 0) return;
    const a = (deg * Math.PI) / 180, x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
    ctx.beginPath(); ctx.arc(x, y, 66 * k, 0, M.TAU); ctx.fillStyle = C.ink2; ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = C.gold; ctx.stroke();
    const ly = deg === -90 ? y - 92 : y + 118;
    ctx.save(); ctx.globalAlpha = clamp(k * 1.5);
    text(ctx, label, x, ly, font(30, 600, UI), C.paper, 'center');
    ctx.restore();
  });
  const stepv = springKeys(u, [[153.5, 0], [154, 0], [156, 1], [158, 2], [160, 3], [162, 4]].map(([b, v], i) => [i ? b - 0.9 : b, v]), { stiffness: 140, damping: 16 });
  const k = springU(u, 153.4, SOFT);
  if (k > 0) {
    const a = -Math.PI / 2 + (stepv * M.TAU) / 3;
    const x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R - (1 - k) * 300;
    drawNote(ctx, IMG.n10f, x, y, 250 * k, Math.sin(a * 2) * 0.08, 0.8);
  }
  const cnt = Math.max(0, Math.floor(stepv + 0.5));
  if (k > 0) text(ctx, `HAND-OFFS  ${String(cnt).padStart(2, '0')}`, cx, cy + 12, font(30, 600, UI), C.gold, 'center');
}

// M3  u 164..176: AD = C + I + G + NX, built term by term.
function sceneAD(ctx, u) {
  const u0 = 164;
  bg(ctx, 'navy');
  const r = E.outCubic(prog(u, u0 - 0.4, u0 + 0.4));
  ctx.fillStyle = C.gold; ctx.fillRect(96, 228, 56 * r, 4);
  wipe(ctx, 'M3 · AGGREGATE DEMAND', 170, 240, font(28, 600, UI), C.gold, u, u0 - 0.2, 1);
  const str = 'AD = C + I + G + NX', size = M.fitSize(ctx, str, 900, DISPLAY, W - 220, 210), f = font(size, 900, DISPLAY), L = layout(ctx, str, f, -2);
  const x0 = 96, base = 520;
  // which term each glyph belongs to, and when that term lands
  const at = { A: 164.5, D: 164.5, '=': 165, C: 165.5, I: 166.5, G: 167.5, N: 168.5, X: 168.5 };
  let plusN = 0;
  const pos = {};
  L.glyphs.forEach((g) => {
    if (g.ch === ' ') return;
    let t = at[g.ch];
    if (g.ch === '+') t = [166, 167, 168][plusN++];
    const k = springU(u, t, SPRING.bouncy);
    if (k <= 0) return;
    const lit = g.ch === 'C' ? prog(u, 170, 170.5) : 0;
    const sc = 1 + 0.12 * lit + 0.1 * wobble(u - 170, 2, 4) * (g.ch === 'C' ? 1 : 0);
    glyph(ctx, g.ch, x0 + g.cx, base + (1 - k) * 160, f, M.mix(C.paper, C.gold, lit), sc * Math.min(1, k + 0.3), sc);
    pos[g.ch] = x0 + g.cx;
  });
  const cap = (ch, ut, line, y) => {
    const k = E.outCubic(prog(u, ut, ut + 0.8));
    if (k <= 0 || pos[ch] === undefined) return;
    ctx.fillStyle = C.gold; ctx.fillRect(pos[ch] - 2, base + 40, 4, (y - base - 72) * k);
    wipe(ctx, line, pos[ch] - 2, y, font(32, 600, UI), C.paper, u, ut + 0.5, 1.2);
  };
  cap('C', 170, 'C · consumers spend with confidence', 700);
  cap('I', 172, 'I · businesses take cash without risk', 800);
  const k = springU(u, 174, SOFT);
  if (k > 0) {
    ctx.save(); ctx.globalAlpha = clamp(k * 1.5);
    rrect(ctx, 96, 880 + (1 - k) * 40, 470, 70, 35); ctx.fillStyle = C.gold; ctx.fill();
    text(ctx, 'TRUST → AD RISES', 331, 926 + (1 - k) * 40, font(30, 600, UI), C.ink, 'center');
    ctx.restore();
  }
}

// M4  u 176..184: reserve currency, lines out from the $100 to the world's uses.
function sceneReserve(ctx, u, IMG) {
  const u0 = 176;
  bg(ctx, 'navy');
  const r = E.outCubic(prog(u, u0 - 0.4, u0 + 0.4));
  ctx.fillStyle = C.gold; ctx.fillRect(96, 128, 56 * r, 4);
  wipe(ctx, 'M4 · RESERVE CURRENCY', 170, 140, font(28, 600, UI), C.gold, u, u0 - 0.2, 1);
  rise(ctx, 'The world’s money', 96, 250, 90, C.paper, u, u0);
  const k = springU(u, u0 - 0.2, DEAL);
  const nx = 560, ny = 620 + (1 - k) * 700, w = 860;
  drawNote(ctx, IMG.n100f, nx, ny, w, -0.05);
  const dests = [['Global trade', 1240, 420, 177], ['Central-bank reserves', 1320, 620, 178], ['Savings abroad', 1240, 820, 179]];
  dests.forEach(([label, x, y, ut]) => {
    const p = E.inOutCubic(prog(u, ut - 0.6, ut));
    if (p <= 0) return;
    const sx = nx + w / 2 - 20, sy = ny - 20;
    const qx = (sx + x) / 2, qy = Math.min(sy, y) - 120;
    // draw the quadratic up to p
    ctx.strokeStyle = C.gold; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sx, sy);
    for (let i = 1; i <= 40; i++) {
      const t = (i / 40) * p, a = (1 - t) ** 2, b = 2 * (1 - t) * t, c = t * t;
      ctx.lineTo(a * sx + b * qx + c * x, a * sy + b * qy + c * y);
    }
    ctx.stroke();
    const dk = springU(u, ut, SPRING.bouncy);
    if (dk > 0) {
      ctx.beginPath(); ctx.arc(x, y, 14 * dk, 0, M.TAU); ctx.fillStyle = C.gold; ctx.fill();
      wipe(ctx, label, x + 34, y + 11, font(34, 600, UI), C.paper, u, ut + 0.1, 0.9);
    }
  });
  typeOn(ctx, 'THE WORLD KEEPS TRUSTING THE DOLLAR.', 96, 1000, 28, C.gold, u, 181, 2);
}

// COST-BENEFIT  u 184..208: a balance that tips toward the benefits.
function sceneScale(ctx, u) {
  const u0 = 184;
  bg(ctx, 'paper');
  const r = E.outCubic(prog(u, u0 - 0.4, u0 + 0.4));
  ctx.fillStyle = '#a4802f'; ctx.fillRect(96, 108, 56 * r, 4);
  wipe(ctx, 'COST VS. BENEFIT', 170, 120, font(28, 600, UI), '#a4802f', u, u0 - 0.2, 1);
  const out = E.inBack(prog(u, 201.4, 201.9), 1.4);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 120, W, 120); ctx.clip();
  ctx.translate(0, -out * 130);
  rise(ctx, 'Is it worth it?', 96, 218, 88, C.ink, u, u0);
  ctx.restore();
  rise(ctx, 'Yes: the benefits outweigh the costs.', 96, 218, 88, C.ink, u, 202, { stagger: 0.012 });
  const vk = E.inOutCubic(prog(u, 203, 204.2));
  if (vk > 0) { ctx.fillStyle = C.gold; ctx.fillRect(96, 244, 1450 * vk, 6); }
  // the stand
  const px = 960, py = 420;
  const sk = springU(u, u0 - 0.1, SOFT);
  ctx.save(); ctx.translate(0, (1 - sk) * 700);
  ctx.fillStyle = C.ink; ctx.fillRect(px - 6, py, 12, 1000 - py);
  ctx.beginPath(); ctx.moveTo(px - 150, 1010); ctx.lineTo(px + 150, 1010); ctx.lineTo(px + 90, 980); ctx.lineTo(px - 90, 980); ctx.fill();
  const th = springKeys(u, [[184, 0], [186.5, -0.035], [188.5, -0.07], [190.5, -0.1], [194.5, -0.05], [196.5, 0.02], [198.5, 0.13]], { stiffness: 80, damping: 8 });
  const L = 640, dx = Math.cos(th) * L, dy = Math.sin(th) * L;
  ctx.strokeStyle = C.ink; ctx.lineWidth = 10; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(px - dx, py - dy); ctx.lineTo(px + dx, py + dy); ctx.stroke();
  ctx.beginPath(); ctx.arc(px, py, 18, 0, M.TAU); ctx.fillStyle = C.gold; ctx.fill();
  const pans = [
    [px - dx, py - dy, ['New printing plates', 'ATM & vending upgrades', 'Public education'], [186.5, 188.5, 190.5], false, 'COSTS · ONE-TIME'],
    [px + dx, py + dy, ['Less counterfeiting', 'Access for blind & low-vision', 'More trust in the dollar'], [194.5, 196.5, 198.5], true, 'BENEFITS · LASTING'],
  ];
  pans.forEach(([ex, ey, items, beats, gold, head]) => {
    const ty = ey + 230;
    ctx.lineWidth = 3; ctx.strokeStyle = C.ink;
    ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex - 170, ty); ctx.moveTo(ex, ey); ctx.lineTo(ex + 170, ty); ctx.stroke();
    ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(ex - 200, ty); ctx.quadraticCurveTo(ex, ty + 40, ex + 200, ty); ctx.stroke();
    text(ctx, head, ex, ty + 64, font(26, 600, UI), gold ? '#a4802f' : C.mutedInk, 'center');
    items.forEach((it, i) => {
      const k = springU(u, beats[i] - 0.25, SPRING.bouncy);
      if (k <= 0) return;
      ctx.font = font(26, 600, UI); const tw = ctx.measureText(it).width + 48;
      const y = ty - 8 - (i + 1) * 62 - (1 - k) * 500;
      rrect(ctx, ex - tw / 2, y, tw, 54, 12);
      if (gold) { ctx.fillStyle = C.gold; ctx.fill(); } else { ctx.fillStyle = '#e8e1cf'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.ink; ctx.stroke(); }
      text(ctx, it, ex, y + 36, font(26, 600, UI), C.ink, 'center');
    });
  });
  ctx.lineCap = 'butt';
  ctx.restore();
}

// END  u 208..: the six notes fan back in; title, promise, specimen line.
function sceneEnd(ctx, u, IMG) {
  bg(ctx, 'navy');
  const px = 1390, py = 1860, R = 1000, w = 760;
  VALUES.forEach((v, i) => {
    const k = springU(u, 208 + i * 0.3, DEAL);
    if (k <= 0) return;
    const p = fanPose(i, px, py, R);
    drawNote(ctx, IMG[v === 20 ? 'n20hi' : `n${v}f`], p.x, p.y + (1 - k) * 900, w, p.rot * k);
  });
  rise(ctx, 'The New', 96, 330, 120, C.paper, u, 209.5);
  rise(ctx, 'American', 96, 460, 120, C.paper, u, 210);
  rise(ctx, 'Note Series', 96, 590, 120, C.gold, u, 210.5);
  typeOn(ctx, 'SECURE. ACCESSIBLE. BUILT FOR TRUST.', 96, 700, 32, C.paper, u, 212, 2.4);
  wipe(ctx, 'SPECIMEN · CLASS PROJECT · NOT LEGAL TENDER', 96, 760, font(22, 600, UI), C.muted, u, 214, 1.5);
}

// ================================================================== timeline
const SCENES = [
  [0, (c, u, I) => sceneHook(c, u, I)],
  [24, (c, u) => sceneChapter(c, u, 24, '01', 'Security', [['S1', 'Colour-shifting numeral'], ['S2', 'Security thread'], ['S3', 'Watermark window']])],
  [32, sceneShift], [48, sceneThread], [64, sceneWater],
  [80, (c, u) => sceneChapter(c, u, 80, '02', 'Accessibility', [['A1', 'Large high-contrast numerals'], ['A2', 'Tactile raised dots'], ['+', 'A length for every value']])],
  [88, sceneNumerals], [104, sceneDots], [120, sceneLengths],
  [136, (c, u) => sceneChapter(c, u, 136, '03', 'The economy', [['M1', 'Store of value'], ['M2', 'Medium of exchange'], ['M3', 'Aggregate demand'], ['M4', 'Reserve currency']], 0.5)],
  [140, sceneStore], [152, sceneExchange], [164, sceneAD], [176, sceneReserve],
  [184, sceneScale], [208, sceneEnd],
];
const SIDEWAYS = new Set([24, 80, 136, 184, 208]);   // section changes push sideways; within a section, up
const TR = 0.6;                                       // transition length, beats

M.film({
  fonts: [font(100, 900, DISPLAY), font(40, 600, UI)],
  images: Object.fromEntries([
    ['n20hi', 'assets/n20-front-hi.jpg'], ['thr100', 'assets/thread100.jpg'],
    ...VALUES.map((v) => [`n${v}f`, `assets/n${v}-front.jpg`]), ['n5b', 'assets/n5-back.jpg'],
  ]),
  hits: [
    ...HITS,
    // a whoosh on every cut that isn't already voiced
    ...SCENES.slice(1).map(([b]) => b).filter((b) => !HITS.some((h) => Math.abs(h[0] - b) < 0.01 && h[2] === 'whoosh') && !SIDEWAYS.has(b))
      .map((b) => [b, 'cut', 'whoosh', { len: 0.4 }]),
    ...[...SIDEWAYS].map((b) => [b, 'push', 'whoosh', { len: 0.45, from: 2400, to: 500 }]),
  ],
  init() {
    BG_NAVY = makeBg(C.ink, 'rgba(216,180,106,0.07)', 'rgba(0,0,0,0.45)');
    BG_PAPER = makeBg(C.paper, 'rgba(120,96,40,0.10)', 'rgba(90,70,30,0.12)');
  },
  draw(ctx, u, t, IMG) {
    let i = SCENES.length - 1;
    while (i > 0 && u < SCENES[i][0]) i--;
    const next = SCENES[i + 1];
    if (next && u > next[0] - TR) {
      // push transition: the outgoing scene slides away, the incoming one arrives on the cut
      const k = E.inOutCubic(prog(u, next[0] - TR, next[0]));
      const side = SIDEWAYS.has(next[0]);
      ctx.save(); side ? ctx.translate(-W * 0.35 * k, 0) : ctx.translate(0, -H * 0.3 * k);
      SCENES[i][1](ctx, u, IMG); ctx.restore();
      ctx.save();
      if (side) { ctx.beginPath(); ctx.rect(W * (1 - k), 0, W * k + 1, H); ctx.clip(); ctx.translate(W * (1 - k) * 0.6, 0); }
      else { ctx.beginPath(); ctx.rect(0, H * (1 - k), W, H * k + 1); ctx.clip(); ctx.translate(0, H * (1 - k) * 0.6); }
      next[1](ctx, u, IMG); ctx.restore();
      ctx.fillStyle = C.gold;
      side ? ctx.fillRect(W * (1 - k) - 6, 0, 6, H) : ctx.fillRect(0, H * (1 - k) - 6, W, 6);
      return;
    }
    SCENES[i][1](ctx, u, IMG);
  },
});
