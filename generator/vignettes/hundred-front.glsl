// $100 front: "The Golden Gate" - a stepped bridge tower, its cables sweeping away, fog rolling beneath.
const vec3 L = normalize(vec3(-.55, .5, .68));
const float LX = .74, RX = .92;      // tower legs (centres)
const float TOP = .05, DECK = .6, WATER = .8;

float legW(float v) { return .03 - .005 * step(v, .44) - .005 * step(v, .3) - .004 * step(v, .17); }
float cableL(float u) { float t = (LX - u) / (LX + .4); return TOP + .04 + (DECK - .05 - TOP) * (1. - pow(1. - clamp(t, 0., 1.), 2.)); }
float cableR(float u) { float t = (u - RX) / .9; return TOP + .04 + (DECK - .05 - TOP) * .8 * (1. - pow(1. - clamp(t, 0., 1.), 2.)); }
float fog(vec2 uv) { return fbm2(vec2(uv.x * 2.2, uv.y * 5.) + 4., 4) + .65 * exp(-pow((uv.y - .68) / .08, 2.)) - .38; }

Px paint(vec2 uv) {
  // water
  if (uv.y > WATER) {
    float z = (uv.y - WATER) / (1. - WATER);
    float refl = smoothstep(.04, .0, min(abs(uv.x - LX), abs(uv.x - RX)) - .03) * smoothstep(.5, .0, z);
    float T = .26 + .22 * z + .3 * refl + .08 * noise2(vec2(uv.x * 8., uv.y * 160.));
    return Px(T, vec3(uv.y * K() * 1.3 + .3 * noise2(vec2(uv.x * 14., uv.y * 90.)), (uv.x * .4 + uv.y) * K(), 0.));
  }
  // fog bank in front of the lower tower
  float fd = fog(uv);
  if (fd > 0. && uv.y > .52) {
    float lit = fog(uv + vec2(-.01, -.02)) - fd;
    float T = .08 + .28 * clamp(-lit * 5. + .25, 0., 1.) + .12 * smoothstep(.74, .8, uv.y);
    return Px(T, vec3(uv.y * K() * 1.15 + .4 * noise2(uv * vec2(6., 20.)), (uv.x * .6 - uv.y) * K(), 0.));
  }
  // tower legs with recessed panels and portal braces
  for (int i = 0; i < 2; i++) {
    float cx = i == 0 ? LX : RX;
    float w = legW(uv.y);
    if (uv.y > TOP && abs(uv.x - cx) < w) {
      float s = (uv.x - cx) / w;
      float T = .25 + .55 * smoothstep(-.3, .9, s);
      float panel = step(abs(s), .45) * step(.3, fract(uv.y * 40.)) * step(fract(uv.y * 40.), .9);
      T += .25 * panel * (s > 0. ? .5 : 1.);
      if (fract(uv.y * 40.) < .08) T -= .15;
      return Px(T, vec3(uv.x * K() * 1.3, uv.y * K() * 1.2, (uv.x + uv.y) * K()));
    }
  }
  for (int j = 0; j < 4; j++) {
    float by = j == 0 ? TOP + .01 : j == 1 ? .17 : j == 2 ? .3 : .44;
    float bh = j == 0 ? .04 : .03;
    if (uv.y > by && uv.y < by + bh && uv.x > LX && uv.x < RX) {
      float t = (uv.y - by) / bh;
      float arch = uv.y - (by + bh * (.4 + .6 * pow(abs(uv.x - (LX + RX) * .5) / ((RX - LX) * .5), 4.)));
      if (arch > 0. && j > 0) break;
      float T = .3 + .35 * t + .15 * step(.5, fract(uv.x * 160.)) * step(.3, t);
      return Px(T, vec3(uv.y * K() * 1.25, uv.x * K() * 1.3, 0.));
    }
  }
  // deck with its truss
  if (uv.y > DECK && uv.y < DECK + .035) {
    float t = (uv.y - DECK) / .035;
    if (t < .25) return Px(.2, vec3(uv.y * K() * 1.3, uv.x * K(), 0.));
    float tr = fract(uv.x * 45.);
    float diag = min(abs(tr - (t - .25) / .75), abs(tr - 1. + (t - .25) / .75));
    float T = diag < .08 || t > .9 ? .8 : .2;
    return Px(T, vec3(uv.y * K() * 1.3, uv.x * K() * 1.3, 0.));
  }
  // main cables and suspenders
  float cy = uv.x < LX ? cableL(uv.x) : uv.x > RX ? cableR(uv.x) : 1.;
  if (abs(uv.y - cy) < .0065) return Px(.85 - .3 * smoothstep(-.0065, .0065, uv.y - cy), vec3(uv.y * K() * 1.3, uv.x * K(), 0.));
  if (uv.y > cy && uv.y < DECK && (uv.x < LX - .03 || uv.x > RX + .03)) {
    float sx = fract(uv.x * 55.);
    if (sx < .1) return Px(.7, vec3(uv.x * K() * 1.3, uv.y * K(), 0.));
  }
  // headlands behind, hazed
  float hl = .5 - .14 * exp(-pow((uv.x - .15) / .25, 2.)) - .05 * exp(-pow((uv.x - 1.3) / .2, 2.)) + .01 * noise2(vec2(uv.x * 15., 2.));
  if (uv.y > hl) {
    float T = .2 + .12 * fbm2(uv * vec2(20., 40.), 4) + .1 * smoothstep(hl + .03, hl, uv.y);
    return Px(T, vec3((uv.y - hl) * K() * 1.15, (uv.x * .7 + uv.y) * K(), 0.));
  }
  float c = fbm2(vec2(uv.x * 2., uv.y * 7.) + 8., 5);
  float T = mix(.36, .06, smoothstep(.0, .5, uv.y)) + .14 * smoothstep(.1, .4, c) * smoothstep(.5, .05, uv.y);
  return Px(T, vec3(uv.y * K() * 1.15 + .2 * sin(uv.x * 7.), (uv.x * .55 + uv.y) * K(), (-uv.x * .55 + uv.y) * K()));
}
