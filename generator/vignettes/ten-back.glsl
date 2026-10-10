// $10 back: "Apple Park" - the ring building seen from above at an angle, its inner orchard and the hills beyond.
const vec3 LT = normalize(vec3(-.5, .8, .35));
const vec2 C = vec2(.7, .6);       // ring centre on screen
const float RX = .56, RY = .25;    // outer ellipse (perspective-flattened circle)
const float W = .085;              // ring width (in outer-radius units * RX)

bool tree(vec2 uv, vec2 c, float r, out float T) {
  vec2 d = (uv - c) / r;
  float q = dot(d, d);
  if (q > 1.) return false;
  vec3 n = normalize(vec3(d.x, -d.y, sqrt(1. - q)));
  T = .78 - .5 * max(dot(n, LT), 0.) + .08 * noise2(uv * 600.);
  return true;
}

Px paint(vec2 uv) {
  vec2 d = (uv - C) / vec2(RX, RY);
  float r = length(d);
  float ang = atan(d.y, d.x);
  float rin = 1. - W / RX * 1.6;
  // roof of the ring: glass canopy fins, lit on the far side, shaded near side
  if (r < 1. && r > rin) {
    float t = (r - rin) / (1. - rin);
    float fins = fract(ang / 6.2832 * 260.);
    float near = smoothstep(-.2, .9, sin(ang));          // lower half is nearer the viewer
    float T = .18 + .12 * near + .25 * smoothstep(.85, 1., t) + .2 * smoothstep(.15, 0., t);
    T += .18 * smoothstep(.12, .0, min(fins, 1. - fins));
    // the facade band: visible glass wall on the near (lower) outer edge
    return Px(T, vec3(t * (1. - rin) * RY * K() * 1.3, ang / 6.2832 * 600., (uv.x + uv.y) * K()));
  }
  // outer glass wall seen below the roof edge on the near side
  vec2 dw = (uv - C - vec2(0., .035)) / vec2(RX, RY);
  if (length(dw) < 1. && r >= 1. && uv.y > C.y) {
    float mull = fract(atan(dw.y, dw.x) / 6.2832 * 340.);
    float T = .55 + .3 * smoothstep(.12, 0., min(mull, 1. - mull)) - .2 * smoothstep(C.y + .2, C.y + .3, uv.y) * 0.;
    return Px(T, vec3(uv.x * K() * 1.3, uv.y * K() * 1.2, 0.));
  }
  float T;
  // the inner courtyard: orchard of trees around a pond
  if (r <= rin) {
    vec2 pd = (uv - C - vec2(.05, .02)) / vec2(.12, .045);
    if (length(pd) < 1.) { float t = .22 + .2 * smoothstep(.6, 1., length(pd)); return Px(t, vec3(uv.y * K() * 1.3, uv.x * K(), 0.)); }
    vec2 g = uv / .028;
    vec2 cell = floor(g);
    vec2 tc = (cell + .5 + (hash22(cell) - .5) * .2) * .028;
    if (hash12(cell) < .62 && tree(uv, tc, .0085, T)) return Px(T, vec3(length(uv - tc) * K() * 1.4, (uv.x - uv.y) * K(), (uv.x + uv.y) * K()));
    T = .3 + .1 * noise2(uv * vec2(80., 160.));
    return Px(T, vec3(uv.y * K() * 1.2, (uv.x * .7 + uv.y) * K(), 0.));
  }
  // surrounding landscape: lawns, curving paths and tree belts
  if (uv.y > .2) {
    vec2 g = uv / .03;
    vec2 cell = floor(g);
    vec2 tc = (cell + .5 + (hash22(cell) - .5) * .2) * .03;
    float belt = smoothstep(.2, .55, noise2(uv * 4.5 + 3.));
    if (hash12(cell + 9.) < belt && tree(uv, tc, .0105, T)) return Px(T, vec3(length(uv - tc) * K() * 1.4, (uv.x - uv.y) * K(), (uv.x + uv.y) * K()));
    float path = smoothstep(.006, .002, abs(length((uv - C) / vec2(RX * 1.2, RY * 1.25)) - 1.) * .2);
    T = .32 + .12 * fbm2(uv * vec2(10., 20.), 4) - .25 * path + .15 * smoothstep(.45, .2, uv.y);
    return Px(T, vec3(uv.y * K() * 1.15 + .3 * noise2(uv * vec2(6., 14.)), (uv.x * .7 + uv.y) * K(), (-uv.x * .7 + uv.y) * K()));
  }
  // distant hills and sky
  float hill = .2 - .07 * exp(-pow((uv.x - .3) / .35, 2.)) - .05 * exp(-pow((uv.x - 1.2) / .25, 2.)) + .008 * noise2(vec2(uv.x * 12., 2.));
  if (uv.y > hill) return Px(.2 + .12 * fbm2(uv * vec2(20., 40.), 4), vec3(uv.y * K() * 1.15, (uv.x * .7 + uv.y) * K(), 0.));
  T = mix(.3, .08, smoothstep(.0, .2, uv.y));
  return Px(T, vec3(uv.y * K() * 1.15 + .2 * sin(uv.x * 7.), (uv.x * .55 + uv.y) * K(), 0.));
}
