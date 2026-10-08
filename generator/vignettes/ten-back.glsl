// $10 back: "Earthrise" - the half-lit Earth over a cratered lunar horizon.
const vec3 SUN = normalize(vec3(-.8, .35, .5));
const vec2 EC = vec2(.98, .27);
const float ER = .13;

float horizon(float u) { return .58 + .03 * sin(u * 2.3 + .4) + .012 * noise2(vec2(u * 9., 1.)) + .004 * noise2(vec2(u * 40., 2.)); }

// lunar surface height (for shading): craters as rims and bowls
float moonH(vec2 p) {
  float h = .02 * fbm2(p * vec2(6., 14.), 5);
  for (int i = 0; i < 26; i++) {
    float fi = float(i);
    vec2 c = vec2(hash12(vec2(fi, 1.)) * 1.5, .6 + .4 * hash12(vec2(fi, 2.)));
    float r = .02 + .09 * hash12(vec2(fi, 3.)) * (c.y - .5) * 1.6;
    vec2 d = (p - c) / vec2(r, r * .32 * (c.y - .45) * 2.2);
    float q = length(d);
    h += r * (-.7 * smoothstep(1., 0., q) + .5 * exp(-pow((q - 1.) * 4., 2.)));
  }
  return h;
}

Px paint(vec2 uv) {
  float hz = horizon(uv.x);
  // distant highlands along the horizon
  float hl = hz - .035 * smoothstep(.2, .8, fbm2(vec2(uv.x * 3., 4.), 4) * .5 + .5) - .01;
  if (uv.y > hl && uv.y <= hz) {
    float T = .35 + .25 * smoothstep(.0, 1., fbm2(uv * vec2(30., 60.), 4)) + .2 * smoothstep(hl + .02, hl, uv.y) * 0.;
    return Px(T, vec3(uv.y * K() * 1.2, (uv.x * .7 + uv.y) * K(), 0.));
  }
  if (uv.y > hz) {
    vec2 e = vec2(.002, 0.);
    float h0 = moonH(uv);
    float hx = moonH(uv + e.xy) - h0, hy = moonH(uv + e.yx) - h0;
    vec3 n = normalize(vec3(-hx / e.x * .7, hy / e.x * .7 + .9, 1.));
    float dif = max(dot(n, SUN), 0.);
    float z = (uv.y - hz) / (1. - hz);
    float T = 1. - (.1 + .82 * dif) + .06 * noise2(uv * vec2(200., 400.));
    T = mix(T, .9, smoothstep(.02, 0., uv.y - hz) * .5);
    return Px(T, vec3((uv.y + h0 * .12) * K() * 1.2 + .2 * noise2(uv * vec2(8., 20.)), (uv.x * .7 + uv.y) * K(), (-uv.x * .7 + uv.y) * K()));
  }
  // the Earth: lit from the left, with clouds and continents
  vec2 d = (uv - EC) / ER;
  float q = dot(d, d);
  if (q < 1.) {
    vec3 n = vec3(d.x, -d.y, sqrt(1. - q));
    float dif = max(dot(n, SUN), 0.);
    float land = smoothstep(.05, .2, fbm2(n.xy * 3. + vec2(1.3, 2.), 5));
    float cloud = smoothstep(.1, .45, fbm2(vec2(n.x * 4. + n.y, n.y * 9.) + 7., 5));
    float alb = .55 + .15 * land + .45 * cloud;
    float T = 1. - alb * (.04 + 1.25 * dif);
    T = clamp(T, .05, .97);
    float lat = asin(n.y) * ER * K() * 1.4;
    float lon = atan(n.x, n.z) * ER * K() * .9 * sqrt(1. - n.y * n.y);
    return Px(T, vec3(lat, lon, (uv.x + uv.y) * K()));
  }
  // black sky, stars, a faint glow round the Earth
  float glow = smoothstep(ER * 1.25, ER, length(uv - EC));
  float star = step(.993, hash12(floor(uv * 260.))) * smoothstep(.3, .15, length(fract(uv * 260.) - .5));
  float T = .93 - .25 * glow - .9 * star;
  return Px(T, vec3(uv.y * K() * 1.15, (uv.x * .6 + uv.y) * K(), (-uv.x * .6 + uv.y) * K()));
}
