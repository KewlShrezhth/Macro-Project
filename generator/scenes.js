const f1 = n => n.toFixed(1);
function rng(seed) { let s = seed; return () => (s = s * 16807 % 2147483647) / 2147483647; }
function starfield(n, w, h, seed, fill) {
  const r = rng(seed); let s = "";
  for (let i = 0; i < n; i++) s += `<circle cx="${f1(r() * w)}" cy="${f1(r() * h)}" r="${f1(r() * 1.5 + .4)}" fill="${fill}"/>`;
  return s;
}
function star(cx, cy, r, fill) {
  let p = "";
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .42 : r; p += f1(cx + rr * Math.cos(a)) + "," + f1(cy + rr * Math.sin(a)) + " "; }
  return `<polygon points="${p}" fill="${fill}"/>`;
}
function pine(x, base, ht, fill) {
  let s = `<rect x="${x - 2}" y="${base - 10}" width="4" height="10" fill="${fill}"/>`;
  for (let i = 0; i < 4; i++) {
    const w = ht * (.42 - i * .08), y = base - 8 - i * ht * .22;
    s += `<polygon points="${f1(x - w)},${f1(y)} ${f1(x + w)},${f1(y)} ${x},${f1(y - ht * .38)}" fill="${fill}"/>`;
  }
  return s;
}

/* ---------- Scenes: fronts draw in a 400x300 box, backs in 660x280 ---------- */
const SCENES = {
  liberty: {
    front: (c, h) => {
      let rays = "";
      for (let i = 0; i < 32; i++) { const a = i / 32 * Math.PI * 2; rays += `<line x1="200" y1="80" x2="${f1(200 + Math.cos(a) * 420)}" y2="${f1(80 + Math.sin(a) * 420)}" stroke="${c.mid}" stroke-width="${i % 2 ? 1.5 : 5}" opacity=".32"/>`; }
      return `<rect width="400" height="300" fill="${c.tint}"/>${rays}
        <circle cx="200" cy="80" r="64" fill="${c.light}" opacity=".9"/>
        <path d="M200 20 C230 52 238 88 214 114 C222 94 208 80 202 66 C196 88 178 94 186 114 C164 88 170 54 200 20Z" fill="${c.mid}"/>
        <path d="M200 20 C230 52 238 88 214 114 C222 94 208 80 202 66 C196 88 178 94 186 114 C164 88 170 54 200 20Z" fill="${h}" opacity=".25"/>
        <path d="M201 50 C215 72 215 94 204 110 C204 98 198 90 197 84 C192 94 190 102 194 110 C183 92 188 72 201 50Z" fill="${c.light}"/>
        <path d="M152 114 L248 114 L232 146 L168 146Z" fill="${c.ink}"/>
        <rect x="164" y="146" width="72" height="11" rx="3" fill="${c.mid}"/>
        <path d="M172 157 L228 157 L213 300 L187 300Z" fill="${c.ink}"/>
        <path d="M200 157 L228 157 L213 300 L200 300Z" fill="${c.light}" opacity=".14"/>
        <rect x="178" y="196" width="44" height="7" fill="${c.mid}"/><rect x="182" y="246" width="36" height="7" fill="${c.mid}"/>`;
    },
    back: (c, h) => {
      let rays = "", sky = "", rip = "";
      for (let i = 0; i < 22; i++) { const a = Math.PI + i / 21 * Math.PI; rays += `<line x1="220" y1="190" x2="${f1(220 + Math.cos(a) * 520)}" y2="${f1(190 + Math.sin(a) * 520)}" stroke="${c.mid}" stroke-width="${i % 2 ? 1.5 : 4}" opacity=".28"/>`; }
      const r = rng(7);
      for (let x = 0; x < 150; x += 16) { const ht = 40 + r() * 70; sky += `<rect x="${x}" y="${f1(190 - ht)}" width="13" height="${f1(ht)}" fill="${c.ink}" opacity=".55"/>`; }
      for (let y = 202; y < 280; y += 11) rip += `<line x1="${f1(r() * 120)}" y1="${y}" x2="${f1(420 + r() * 240)}" y2="${y}" stroke="${c.light}" stroke-width="2" stroke-dasharray="${f1(20 + r() * 30)} 14" opacity=".8"/>`;
      return `<rect width="660" height="280" fill="${c.tint}"/>${rays}
        <circle cx="220" cy="190" r="72" fill="${c.light}" stroke="${c.mid}" stroke-width="3"/>
        ${sky}
        <rect y="190" width="660" height="90" fill="${c.mid}" opacity=".45"/>
        <rect y="190" width="660" height="90" fill="${h}" opacity=".18"/>${rip}
        <ellipse cx="500" cy="196" rx="112" ry="14" fill="${c.ink}"/>
        <polygon points="470,196 530,196 521,150 479,150" fill="${c.ink}"/>
        <rect x="474" y="141" width="52" height="10" fill="${c.ink}"/>
        <path d="M485 141 L515 141 L507 80 L493 80Z" fill="${c.ink}"/>
        <circle cx="500" cy="72" r="8" fill="${c.ink}"/>
        <g stroke="${c.ink}" stroke-width="2.5" stroke-linecap="round"><line x1="500" y1="64" x2="500" y2="54"/><line x1="495" y1="65" x2="489" y2="57"/><line x1="505" y1="65" x2="511" y2="57"/><line x1="492" y1="69" x2="483" y2="65"/><line x1="508" y1="69" x2="517" y2="65"/></g>
        <line x1="506" y1="88" x2="521" y2="42" stroke="${c.ink}" stroke-width="7" stroke-linecap="round"/>
        <ellipse cx="522" cy="33" rx="6" ry="10" fill="${c.mid}"/>
        <rect x="484" y="96" width="9" height="18" fill="${c.mid}" transform="rotate(-12 488 105)"/>`;
    },
  },
  canyon: {
    front: (c, h) => `<rect width="400" height="300" fill="${c.tint}"/>
      <circle cx="300" cy="70" r="32" fill="${c.light}" stroke="${c.mid}" stroke-width="2"/>
      <polygon points="0,150 40,140 70,145 70,128 132,128 140,145 220,140 230,118 300,118 310,140 400,134 400,300 0,300" fill="${c.mid}" opacity=".3"/>
      <polygon points="0,190 50,185 60,164 120,164 135,190 200,185 210,158 262,158 272,180 340,178 350,152 400,156 400,300 0,300" fill="${c.mid}" opacity=".6"/>
      <polygon points="0,190 50,185 60,164 120,164 135,190 200,185 210,158 262,158 272,180 340,178 350,152 400,156 400,300 0,300" fill="${h}" opacity=".18"/>
      <polygon points="0,236 80,230 95,204 152,204 162,232 260,240 276,214 332,211 346,238 400,236 400,300 0,300" fill="${c.ink}" opacity=".8"/>
      <g stroke="${c.light}" stroke-width="1.2" opacity=".35"><line x1="95" y1="214" x2="152" y2="214"/><line x1="90" y1="222" x2="158" y2="222"/><line x1="276" y1="224" x2="332" y2="224"/></g>
      <polygon points="0,272 120,262 200,276 300,264 400,272 400,300 0,300" fill="${c.ink}"/>`,
    back: (c, h) => `<rect width="660" height="280" fill="${c.tint}"/>
      <circle cx="520" cy="58" r="30" fill="${c.light}" stroke="${c.mid}" stroke-width="2"/>
      <polygon points="0,122 80,112 100,90 200,90 215,116 330,110 345,86 450,86 470,112 660,104 660,280 0,280" fill="${c.mid}" opacity=".3"/>
      <polygon points="140,150 520,145 450,200 250,280 200,200" fill="${c.mid}" opacity=".55"/>
      <path d="M300 120 C270 160 360 185 310 220 S270 265 300 280 L360 280 C340 255 390 230 350 205 S320 150 320 120Z" fill="${c.light}" stroke="${c.mid}" stroke-width="2"/>
      <polygon points="0,140 140,150 200,200 250,280 0,280" fill="${c.ink}" opacity=".78"/>
      <polygon points="0,140 140,150 200,200 250,280 0,280" fill="${h}" opacity=".25"/>
      <polygon points="660,130 520,145 450,200 410,280 660,280" fill="${c.ink}" opacity=".78"/>
      <polygon points="660,130 520,145 450,200 410,280 660,280" fill="${h}" opacity=".25"/>`,
  },
  space: {
    front: (c) => {
      let tower = "";
      for (let y = 70; y < 250; y += 18) tower += `<line x1="128" y1="${y}" x2="150" y2="${y + 18}" stroke="${c.mid}" stroke-width="1.5"/><line x1="150" y1="${y}" x2="128" y2="${y + 18}" stroke="${c.mid}" stroke-width="1.5"/>`;
      return `<rect width="400" height="300" fill="${c.ink}"/>${starfield(70, 400, 230, 11, c.light)}
        <rect x="126" y="66" width="4" height="190" fill="${c.mid}"/><rect x="148" y="66" width="4" height="190" fill="${c.mid}"/>${tower}
        <line x1="150" y1="120" x2="184" y2="120" stroke="${c.mid}" stroke-width="3"/>
        <path d="M184 64 Q200 8 216 64Z" fill="${c.light}"/>
        <rect x="184" y="64" width="32" height="172" fill="${c.light}"/>
        <rect x="200" y="64" width="16" height="172" fill="${c.mid}" opacity=".35"/>
        <rect x="184" y="104" width="32" height="9" fill="${c.mid}"/><rect x="184" y="168" width="32" height="9" fill="${c.mid}"/>
        <path d="M184 202 L164 244 L184 236Z" fill="${c.mid}"/><path d="M216 202 L236 244 L216 236Z" fill="${c.mid}"/>
        <rect x="190" y="236" width="20" height="8" fill="${c.mid}"/>
        <path d="M190 244 L210 244 L200 284Z" fill="${c.mid}"/>
        <g fill="${c.tint}" opacity=".92"><circle cx="160" cy="282" r="30"/><circle cx="200" cy="292" r="34"/><circle cx="244" cy="280" r="28"/><circle cx="120" cy="296" r="24"/><circle cx="284" cy="296" r="26"/></g>`;
    },
    back: (c, h, u) => `<rect width="660" height="280" fill="${c.ink}"/>${starfield(90, 660, 190, 23, c.light)}
      <clipPath id="${u}-e"><circle cx="480" cy="88" r="56"/></clipPath>
      <circle cx="480" cy="88" r="56" fill="${c.mid}"/>
      <g clip-path="url(#${u}-e)">
        <path d="M444 64 q18 -18 36 -6 q12 12 -6 24 q-18 6 -30 -18Z M488 98 q22 -6 28 12 q-6 22 -24 16 q-12 -12 -4 -28Z M452 112 q12 -4 16 8 q-6 10 -14 4Z" fill="${c.tint}" opacity=".85"/>
        <circle cx="508" cy="102" r="58" fill="${c.ink}" opacity=".55"/>
      </g>
      <path d="M0 200 Q160 170 330 190 T660 184 L660 280 L0 280Z" fill="${c.tint}"/>
      <g fill="${c.mid}" opacity=".35"><ellipse cx="110" cy="232" rx="34" ry="7"/><ellipse cx="430" cy="252" rx="44" ry="9"/><ellipse cx="570" cy="214" rx="22" ry="5"/><ellipse cx="300" cy="212" rx="16" ry="4"/></g>
      <g transform="translate(250 248) rotate(-14)">
        <rect x="-30" y="-11" width="60" height="22" rx="11" fill="${c.ink}" opacity=".7"/>
        <g stroke="${c.tint}" stroke-width="2.5">${[-20, -12, -4, 4, 12, 20].map(x => `<line x1="${x}" y1="-8" x2="${x}" y2="8"/>`).join("")}</g>
      </g>`,
  },
  forest: {
    front: (c, h) => {
      const trunks = [[48, 22], [128, 30], [236, 26], [330, 34]];
      let t = "";
      for (const [x, w] of trunks) {
        t += `<rect x="${x}" y="0" width="${w}" height="300" fill="${c.ink}" opacity=".88"/><rect x="${x + w * .55}" y="0" width="${f1(w * .45)}" height="300" fill="${h}" opacity=".35"/>`;
        for (let i = 0; i < 3; i++) t += `<polygon points="${x - 38},${40 + i * 34} ${x + w + 38},${40 + i * 34} ${x + w / 2},${4 + i * 34}" fill="${c.ink}" opacity=".75"/>`;
      }
      let back = "";
      for (let x = 10; x < 400; x += 46) back += pine(x, 270, 120, c.mid);
      return `<rect width="400" height="300" fill="${c.tint}"/>
        <polygon points="170,0 230,0 330,300 200,300" fill="${c.light}" opacity=".7"/>
        <g opacity=".45">${back}</g>${t}
        <path d="M0 262 Q100 250 200 266 T400 258 L400 300 L0 300Z" fill="${c.ink}"/>
        <g stroke="${c.mid}" stroke-width="2" fill="none"><path d="M90 268 q-14 -18 -30 -16"/><path d="M90 268 q14 -20 30 -18"/><path d="M300 266 q-12 -16 -28 -14"/><path d="M300 266 q12 -18 26 -16"/></g>`;
    },
    back: (c, h, u) => {
      const mts = `<path d="M120 180 L200 92 Q250 44 300 70 L305 180Z" fill="${c.mid}"/>
        <path d="M200 92 Q250 44 300 70 L305 180 L268 180Z" fill="${h}" opacity=".22"/>
        <polygon points="280,180 380,74 480,180" fill="${c.mid}" opacity=".78"/>
        <polygon points="380,74 360,96 372,92 380,100 390,92 400,96" fill="${c.light}"/>
        <polygon points="420,180 520,104 660,180" fill="${c.mid}" opacity=".5"/>`;
      let trees = "";
      for (const [x, ht] of [[40, 150], [86, 112], [600, 160], [636, 120], [560, 92]]) trees += pine(x, 268, ht, c.ink);
      return `<rect width="660" height="280" fill="${c.tint}"/>
        <circle cx="560" cy="56" r="26" fill="${c.light}" stroke="${c.mid}" stroke-width="2"/>${mts}
        <clipPath id="${u}-lake"><rect y="180" width="660" height="70"/></clipPath>
        <rect y="180" width="660" height="70" fill="${c.light}"/>
        <g clip-path="url(#${u}-lake)"><g transform="translate(0 360) scale(1 -1)" opacity=".28">${mts}</g></g>
        <g stroke="${c.mid}" stroke-width="1.5" opacity=".5"><line x1="180" y1="196" x2="260" y2="196"/><line x1="340" y1="206" x2="440" y2="206"/><line x1="220" y1="222" x2="300" y2="222"/></g>
        <path d="M0 240 Q200 230 330 246 T660 238 L660 280 L0 280Z" fill="${c.ink}" opacity=".9"/>${trees}`;
    },
  },
  capitol: {
    front: (c, h) => {
      let cols = "", drum = "", ribs = "", steps = "";
      for (let x = 72; x <= 328; x += 16) cols += `<rect x="${x}" y="214" width="6" height="46" fill="${c.mid}"/>`;
      for (let x = 140; x <= 256; x += 12) drum += `<rect x="${x}" y="148" width="4" height="50" fill="${c.mid}"/>`;
      for (const x of [150, 172, 200, 228, 250]) ribs += `<path d="M${x} 146 Q${f1(200 + (x - 200) * .55)} 70 200 58" fill="none" stroke="${c.mid}" stroke-width="2"/>`;
      for (let i = 0; i < 4; i++) steps += `<rect x="${40 - i * 14}" y="${262 + i * 10}" width="${320 + i * 28}" height="10" fill="${c.mid}" opacity="${.5 + i * .12}"/>`;
      return `<rect width="400" height="300" fill="${c.tint}"/>
        <circle cx="200" cy="110" r="120" fill="${c.light}" opacity=".7"/>
        <rect x="60" y="200" width="280" height="62" fill="${c.light}" stroke="${c.ink}" stroke-width="2"/>${cols}
        <rect x="56" y="200" width="288" height="12" fill="${c.ink}"/>
        <polygon points="160,200 200,180 240,200" fill="${c.light}" stroke="${c.ink}" stroke-width="2"/>
        <rect x="128" y="140" width="144" height="60" fill="${c.light}" stroke="${c.ink}" stroke-width="2"/>${drum}
        <rect x="124" y="138" width="152" height="10" fill="${c.ink}"/>
        <path d="M132 140 Q132 60 200 54 Q268 60 268 140Z" fill="${c.light}" stroke="${c.ink}" stroke-width="2"/>
        <path d="M200 54 Q268 60 268 140 L200 140Z" fill="${h}" opacity=".22"/>${ribs}
        <rect x="188" y="34" width="24" height="22" fill="${c.light}" stroke="${c.ink}" stroke-width="2"/>
        <rect x="196" y="18" width="8" height="16" fill="${c.ink}"/><circle cx="200" cy="15" r="5" fill="${c.ink}"/>${steps}`;
    },
    back: (c, h) => {
      let lines = "";
      for (let i = 0; i < 6; i++) lines += `<rect x="190" y="${136 + i * 16}" width="${i === 5 ? 160 : 280}" height="4" rx="2" fill="${c.mid}" opacity=".45"/>`;
      return `<rect width="660" height="280" fill="${c.tint}"/>
        <rect width="660" height="280" fill="${h}" opacity=".06"/>
        <rect x="150" y="36" width="360" height="208" fill="${c.light}" stroke="${c.ink}" stroke-width="2"/>
        <rect x="134" y="22" width="392" height="24" rx="12" fill="${c.mid}" stroke="${c.ink}" stroke-width="2"/>
        <rect x="134" y="234" width="392" height="24" rx="12" fill="${c.mid}" stroke="${c.ink}" stroke-width="2"/>
        <text x="330" y="112" text-anchor="middle" font-size="46" font-style="italic" font-weight="600" fill="${c.ink}">We the People</text>
        ${lines}
        <path d="M560 252 C540 200 560 120 622 36 C616 110 600 190 568 252Z" fill="${c.ink}" opacity=".88"/>
        <line x1="562" y1="262" x2="622" y2="36" stroke="${c.light}" stroke-width="1.5"/>
        <path d="M556 252 L566 252 L560 270Z" fill="${c.ink}"/>`;
    },
  },
  bridge: {
    front: (c, h) => {
      let sus = "";
      const seg = (p0, p1, p2) => {
        for (let t = .06; t < 1; t += .06) {
          const x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0];
          const y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1];
          if (y < 186) sus += `<line x1="${f1(x)}" y1="${f1(y)}" x2="${f1(x)}" y2="186" stroke="${c.ink}" stroke-width="1"/>`;
        }
      };
      seg([0, 150], [70, 178], [120, 62]); seg([120, 62], [200, 250], [280, 62]); seg([280, 62], [330, 178], [400, 150]);
      const tower = x => `<rect x="${x - 9}" y="56" width="7" height="190" fill="${c.ink}"/><rect x="${x + 2}" y="56" width="7" height="190" fill="${c.ink}"/>
        <rect x="${x - 9}" y="70" width="18" height="5" fill="${c.ink}"/><rect x="${x - 9}" y="110" width="18" height="5" fill="${c.ink}"/><rect x="${x - 9}" y="150" width="18" height="5" fill="${c.ink}"/>`;
      return `<rect width="400" height="300" fill="${c.tint}"/>
        <circle cx="320" cy="150" r="46" fill="${c.light}" stroke="${c.mid}" stroke-width="2"/>
        <path d="M0 196 Q60 150 130 176 Q200 196 270 168 Q340 140 400 186 L400 300 L0 300Z" fill="${c.mid}" opacity=".35"/>
        <rect y="200" width="400" height="100" fill="${c.mid}" opacity=".45"/>
        <rect y="200" width="400" height="100" fill="${h}" opacity=".15"/>
        <g stroke="${c.light}" stroke-width="2" opacity=".75"><line x1="30" y1="230" x2="110" y2="230"/><line x1="160" y1="252" x2="260" y2="252"/><line x1="280" y1="226" x2="370" y2="226"/><line x1="60" y1="272" x2="150" y2="272"/></g>
        ${sus}${tower(120)}${tower(280)}
        <path d="M0 150 Q70 178 120 62 Q200 250 280 62 Q330 178 400 150" fill="none" stroke="${c.ink}" stroke-width="3.5"/>
        <rect y="184" width="400" height="9" fill="${c.ink}"/>`;
    },
    back: (c, h) => {
      let stars = "";
      for (let i = 0; i < 50; i++) { const a = -Math.PI / 2 + i / 50 * Math.PI * 2; stars += star(330 + Math.cos(a) * 108, 140 + Math.sin(a) * 108, 7, c.ink); }
      let rays = "";
      for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2; rays += `<line x1="${f1(330 + Math.cos(a) * 128)}" y1="${f1(140 + Math.sin(a) * 128)}" x2="${f1(330 + Math.cos(a) * 420)}" y2="${f1(140 + Math.sin(a) * 420)}" stroke="${c.mid}" stroke-width="${i % 2 ? 1 : 3}" opacity=".3"/>`; }
      return `<rect width="660" height="280" fill="${c.tint}"/>${rays}
        <circle cx="330" cy="140" r="126" fill="${c.light}" stroke="${c.mid}" stroke-width="3"/>
        <circle cx="330" cy="140" r="119" fill="none" stroke="${c.mid}" stroke-width="1"/>${stars}
        <circle cx="330" cy="140" r="88" fill="${c.light}" stroke="${c.ink}" stroke-width="2"/>
        <text x="330" y="98" text-anchor="middle" class="sans" font-size="13" font-weight="700" letter-spacing="5" fill="${c.mid}">ONE NATION</text>
        <text x="330" y="164" text-anchor="middle" font-size="76" font-weight="800" fill="${c.ink}">50</text>
        <text x="330" y="192" text-anchor="middle" class="sans" font-size="14" font-weight="700" letter-spacing="6" fill="${c.ink}">STATES</text>`;
    },
  },
};

