// $100 back: "Across the Strait" - the whole bridge between headlands, a sailing ship passing beneath.
const vec3 L = normalize(vec3(-.55, .5, .68));
const float T1 = .36, T2 = 1.04;          // towers
const float TTOP = .17, DECK = .5, WATER = .56;

float mainCable(float u) {
  if (u > T1 && u < T2) { float t = (u - (T1 + T2) * .5) / ((T2 - T1) * .5); return DECK - .04 - (DECK - .04 - TTOP - .01) * t * t; }
  if (u <= T1) { float t = (T1 - u) / .45; return TTOP + .01 + (DECK - .03 - TTOP) * (1. - pow(1. - clamp(t, 0., 1.), 1.6)); }
  float t = (u - T2) / .45; return TTOP + .01 + (DECK - .03 - TTOP) * (1. - pow(1. - clamp(t, 0., 1.), 1.6));
}
// a three-masted ship: hull, sails, rigging
bool ship(vec2 uv, out Px px) {
  vec2 o = vec2(.66, .79);
  vec2 d = uv - o;
  // hull
  float hl = .2;
  if (d.y > 0. && d.y < .04 && abs(d.x) < hl - d.y * 1.4 + .02 * step(d.x, 0.) * 0.) {
    float T = .75 + .15 * step(.012, d.y) - .3 * smoothstep(.0, .004, .006 - d.y) * step(d.y, .006);
    if (d.y > .01 && d.y < .016 && fract(d.x * 90.) < .4) T = .2;   // gun ports band
    px = Px(T, vec3(uv.y * K() * 1.3 + .3 * sin(d.x * 30.), uv.x * K(), 0.));
    return true;
  }
  // masts and sails
  for (int i = 0; i < 3; i++) {
    float mx = o.x - .1 + float(i) * .1;
    float h = i == 1 ? .3 : .25;
    if (abs(uv.x - mx) < .0025 && d.y < 0. && d.y > -h - .02) { px = Px(.85, vec3(uv.x * K(), uv.y * K(), 0.)); return true; }
    for (int k = 0; k < 3; k++) {
      float y0 = -.03 - float(k) * h * .3, y1 = y0 - h * .27;
      float w = (.055 - float(k) * .012) * (i == 1 ? 1.1 : 1.);
      if (d.y < y0 && d.y > y1) {
        float t = (y0 - d.y) / (y0 - y1);
        float bulge = .006 * sin(t * 3.1416);
        float dx = uv.x - mx - bulge * 2.;
        if (abs(dx) < w * (1. - .12 * t)) {
          float s = dx / w;
          float T = .1 + .35 * smoothstep(-.6, 1., s) + .15 * smoothstep(.85, 1., t);
          px = Px(T, vec3((uv.y + .01 * cos(s * 1.5)) * K() * 1.3, (uv.x - .3 * uv.y) * K(), 0.));
          return true;
        }
      }
    }
  }
  // jib and rigging lines
  vec2 a = vec2(o.x + .2, o.y), b = vec2(o.x + .1, o.y - .24);
  vec2 pa = uv - b, ba = a - b; float hh = clamp(dot(pa, ba) / dot(ba, ba), 0., 1.);
  if (length(pa - ba * hh) < .0015) { px = Px(.8, vec3(uv.y * K(), uv.x * K(), 0.)); return true; }
  return false;
}

Px paint(vec2 uv) {
  Px px;
  if (ship(uv, px)) return px;
  // water with reflections of the towers and the ship
  if (uv.y > WATER) {
    float z = (uv.y - WATER) / (1. - WATER);
    float refl = smoothstep(.03, .0, min(abs(uv.x - T1), abs(uv.x - T2)) - .012) * smoothstep(.3, .0, z);
    float sr = smoothstep(.2, .1, abs(uv.x - .66)) * step(.83, uv.y) * smoothstep(1., .85, uv.y) * .3;
    float T = .2 + .25 * z + .35 * refl + sr + .08 * noise2(vec2(uv.x * 8., uv.y * 160.));
    return Px(T, vec3(uv.y * K() * 1.3 + .3 * noise2(vec2(uv.x * 14., uv.y * 90.)), (uv.x * .4 + uv.y) * K(), 0.));
  }
  // towers
  for (int i = 0; i < 2; i++) {
    float cx = i == 0 ? T1 : T2;
    for (int j = 0; j < 2; j++) {
      float lx = cx + (j == 0 ? -.016 : .016);
      float w = .007 - .0015 * step(uv.y, .3) - .0015 * step(uv.y, .23);
      if (uv.y > TTOP && abs(uv.x - lx) < w) return Px(.4 + .4 * smoothstep(-.4, 1., (uv.x - lx) / w), vec3(uv.x * K() * 1.3, uv.y * K(), 0.));
    }
    for (int j = 0; j < 4; j++) {
      float by = TTOP + .005 + float(j) * .075;
      if (uv.y > by && uv.y < by + .012 && abs(uv.x - cx) < .016) return Px(.6, vec3(uv.y * K() * 1.3, uv.x * K(), 0.));
    }
  }
  // deck
  if (uv.y > DECK && uv.y < DECK + .018) {
    float t = (uv.y - DECK) / .018;
    float tr = fract(uv.x * 110.);
    float T = t < .3 ? .2 : (min(abs(tr - t), abs(tr - 1. + t)) < .12 ? .78 : .25);
    return Px(T, vec3(uv.y * K() * 1.3, uv.x * K(), 0.));
  }
  // cables and suspenders
  float cy = mainCable(uv.x);
  if (abs(uv.y - cy) < .0035) return Px(.85, vec3(uv.y * K() * 1.3, uv.x * K(), 0.));
  if (uv.y > cy && uv.y < DECK && fract(uv.x * 120.) < .14) return Px(.55, vec3(uv.x * K() * 1.3, uv.y * K(), 0.));
  // headlands left and right, city hills far
  float hl = .5 - .2 * exp(-pow(uv.x / .32, 2.)) - .15 * exp(-pow((uv.x - 1.4) / .22, 2.)) + .012 * noise2(vec2(uv.x * 14., 3.));
  if (uv.y > hl) {
    vec2 e = vec2(.002, 0.);
    float h0 = fbm2(uv * vec2(14., 22.), 5);
    float hx = fbm2((uv + e.xy) * vec2(14., 22.), 5) - h0;
    float T = .32 + .25 * clamp(hx / e.x * .02, -1., 1.) + .15 * smoothstep(hl + .02, hl, uv.y);
    return Px(T, vec3((uv.y - hl) * K() * 1.15 + .3 * noise2(uv * 30.), (uv.x * .7 + uv.y) * K(), 0.));
  }
  float far = .52 - .02 * smoothstep(.0, 1., noise2(vec2(uv.x * 4., 6.)));
  if (uv.y > far) return Px(.12, vec3(uv.y * K() * 1.2, uv.x * K(), 0.));
  float c = fbm2(vec2(uv.x * 2., uv.y * 7.) + 8., 5);
  float T = mix(.36, .06, smoothstep(.0, .5, uv.y)) + .14 * smoothstep(.1, .4, c) * smoothstep(.5, .05, uv.y);
  return Px(T, vec3(uv.y * K() * 1.15 + .2 * sin(uv.x * 7.), (uv.x * .55 + uv.y) * K(), (-uv.x * .55 + uv.y) * K()));
}
