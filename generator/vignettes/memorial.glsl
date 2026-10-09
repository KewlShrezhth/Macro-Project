// Memorial roundel shared by every note: the Twin Towers drawn as a pale memory beside One World Trade Center,
// over the Lower Manhattan skyline and the Hudson. Square frame (uv 0..1).
const vec3 L = normalize(vec3(-.6, .3, .74));

// One WTC in elevation: square plan with chamfered edges -> facade of alternating triangles, tapering upward
bool oneWTC(vec2 uv, out Px px) {
  float cx = .63, base = .7, roof = .14, wb = .085, wt = .046;
  if (uv.y > roof && uv.y < base) {
    float t = (base - uv.y) / (base - roof);
    float hw = mix(wb, wt, t);
    float x = (uv.x - cx) / hw;              // -1..1
    if (abs(x) < 1.) {
      // centre triangle (apex up) faces us and catches the light; side triangles (apex down) turn away
      float centre = step(abs(x), 1. - t);
      float lit = centre > .5 ? .2 : (x < 0. ? .45 : .72);
      float T = lit + .05 * noise2(uv * 500.);
      float mull = fract((x + 1.) * 9.);
      T += .12 * smoothstep(.12, 0., min(mull, 1. - mull));
      if (abs(abs(x) - (1. - t)) < .02) T = .85;            // edges of the facets
      px = Px(T, vec3(uv.x * K() * 1.4 + .2 * x, (uv.y - .3 * abs(x) * hw) * K() * 1.2, (uv.x + uv.y) * K()));
      return true;
    }
  }
  // parapet ring and the spire
  if (uv.y > roof - .012 && uv.y <= roof && abs(uv.x - cx) < wt * 1.05) { px = Px(.8, vec3(uv.y * K(), uv.x * K(), 0.)); return true; }
  if (uv.y > .02 && uv.y <= roof - .012 && abs(uv.x - cx) < .003 + .004 * smoothstep(.02, roof, uv.y)) { px = Px(.85, vec3(uv.x * K() * 1.4, uv.y * K(), 0.)); return true; }
  // podium
  if (uv.y >= base && uv.y < .8 && abs(uv.x - cx) < wb * 1.08) {
    float fin = fract((uv.x - cx) * 160.);
    px = Px(.45 + .3 * step(.6, fin), vec3(uv.x * K() * 1.4, uv.y * K(), 0.)); return true;
  }
  return false;
}
// the Twin Towers as remembered: pale, finely ruled, lit from the left
bool twins(vec2 uv, out Px px) {
  for (int i = 0; i < 2; i++) {
    float x0 = i == 0 ? .2 : .32, top = i == 0 ? .1 : .12, w = .085;
    if (uv.x > x0 && uv.x < x0 + w && uv.y > top && uv.y < .8) {
      float s = (uv.x - x0) / w;
      float col = fract(s * 22.);
      float T = .2 + .2 * smoothstep(.45, 1., s) + .12 * smoothstep(.3, .0, min(col, 1. - col));
      if (uv.y < top + .006) T = .3;
      px = Px(T, vec3(uv.x * K() * 1.6, uv.y * K() * 1.3, 0.));
      return true;
    }
    if (i == 0 && abs(uv.x - (x0 + w * .5)) < .0025 && uv.y > .02 && uv.y <= top) { px = Px(.3, vec3(uv.x * K(), uv.y * K(), 0.)); return true; }
  }
  return false;
}
float skyline(float u) {
  float h = 0.;
  for (int i = 0; i < 26; i++) {
    float fi = float(i);
    float c = hash12(vec2(fi, 1.)), w = .015 + .03 * hash12(vec2(fi, 2.)), ht = .06 + .16 * hash12(vec2(fi, 3.));
    if (abs(u - c) < w) h = max(h, ht);
  }
  return .8 - h;
}

Px paint(vec2 uv) {
  Px px;
  // Hudson with reflections
  if (uv.y > .8) {
    float z = (uv.y - .8) / .2;
    float refl = smoothstep(.1, 0., abs(uv.x - .63)) * .4 + smoothstep(.15, .05, abs(uv.x - .3)) * .15;
    float T = .35 + .25 * z + refl * (1. - z) - .05 + .08 * noise2(vec2(uv.x * 20., uv.y * 260.));
    return Px(T, vec3(uv.y * K() * 1.3 + .3 * noise2(vec2(uv.x * 14., uv.y * 90.)), (uv.x * .4 + uv.y) * K(), 0.));
  }
  if (oneWTC(uv, px)) return px;
  // Lower Manhattan
  float sk = skyline(uv.x);
  if (uv.y > sk) {
    float win = step(.5, fract(uv.x * 140.)) * step(.5, fract(uv.y * 120.));
    float T = .38 + .2 * hash12(vec2(floor(uv.x * 40.), 2.)) + .12 * win;
    return Px(T, vec3(uv.x * K() * 1.3, uv.y * K() * 1.2, (uv.x + uv.y) * K()));
  }
  if (twins(uv, px)) return px;
  // dawn sky with rays rising from behind the towers
  vec2 d = uv - vec2(.36, .85);
  float ray = .5 + .5 * sin(atan(d.y, d.x) * 40.);
  float T = mix(.45, .12, smoothstep(.0, .75, uv.y)) + .06 * smoothstep(.3, .9, ray);
  return Px(T, vec3(uv.y * K() * 1.15, (uv.x * .55 + uv.y) * K(), (-uv.x * .55 + uv.y) * K()));
}
