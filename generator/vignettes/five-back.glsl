// $5 back: "The Colorado River" - stepped canyon temples above a plateau cut by the river's inner gorge.
float terrace(float x, float n) { float k = x * n; return (floor(k) + smoothstep(.55, 1., fract(k))) / n; }
float layerTop(float u, float base, float amp, float seed) {
  float m = 0.;
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    float c = hash12(vec2(seed, fi)) * 1.6 - .1, w = .08 + .14 * hash12(vec2(seed, fi + 9.));
    m = max(m, (1. - smoothstep(0., 1., abs(u - c) / w)) * (.5 + .5 * hash12(vec2(seed, fi + 4.))));
  }
  m += .06 * noise2(vec2(u * 30., seed));
  return base - amp * terrace(clamp(m, 0., 1.), 4.);
}
Px rock(vec2 uv, float top, float seed, float haze) {
  float d = uv.y - top;
  float tier = fract((uv.y - top) * 30. + .3 * noise2(vec2(uv.x * 9., seed)));
  float cliff = smoothstep(.0, .12, tier) * smoothstep(.5, .3, tier);
  float gully = smoothstep(.6, .95, ridged2(vec2(uv.x * 26., uv.y * 4. + seed), 4));
  float T = .24 + .3 * cliff + .18 * gully + .07 * noise2(uv * vec2(60., 20.));
  T += .25 * smoothstep(.02, 0., d);
  T = mix(T, .08, haze);
  return Px(T, vec3((uv.y + .003 * noise2(vec2(uv.x * 20., seed))) * K() * 1.15, (uv.x + .004 * noise2(vec2(uv.y * 40., seed))) * K() * 1.25, (uv.x * .7 + uv.y * .7) * K()));
}
bool juniper(vec2 uv, vec2 c, float r, out Px px) {
  float best = -1.; vec3 bn; vec2 bc;
  for (int i = 0; i < 16; i++) {
    float fi = float(i);
    vec2 o = (vec2(hash12(c * 13. + fi), hash12(c * 7. + fi * 3.1)) - .5) * vec2(1.7, 1.1) * r;
    float rr = r * (.22 + .16 * hash12(c + fi * 5.7));
    vec2 d = (uv - c - o) / rr;
    float edge = 1. + .15 * noise2(uv * 200. + fi);
    float q = dot(d, d);
    if (q < edge * edge) {
      float z = sqrt(edge * edge - q) - o.y / r * .3 + hash12(c + fi) * .3;
      if (z > best) { best = z; bn = normalize(vec3(d, sqrt(edge * edge - q))); bc = c + o; }
    }
  }
  if (best > 0.) {
    float lit = max(dot(bn, normalize(vec3(.5, .55, .66))), 0.);
    px = Px(.9 - .55 * lit + .12 * noise2(uv * 380.), vec3(length(uv - bc) * K() * 1.35, (uv.x * .6 - uv.y) * K() * 1.2, (uv.x * .6 + uv.y) * K() * 1.2));
    return true;
  }
  float tx = c.x + .03 * sin((uv.y - c.y) * 25.);
  if (abs(uv.x - tx) < .009 && uv.y > c.y && uv.y < c.y + .2) {
    px = Px(.55 + .35 * smoothstep(.3, -1., (uv.x - tx) / .009), vec3((uv.y - .4 * (uv.x - tx)) * K() * 1.3, uv.x * K() * 1.3, 0.));
    return true;
  }
  return false;
}

Px paint(vec2 uv) {
  Px px;
  float v = uv.y;
  float rim = .9 - .1 * smoothstep(.55, .0, uv.x) + .012 * noise2(vec2(uv.x * 14., 3.));
  if (juniper(uv, vec2(.13, .66), .1, px) && v < rim + .01) return px;
  if (v > rim) {
    float crack = smoothstep(.75, .95, ridged2(uv * vec2(14., 22.), 4));
    float T = .6 + .15 * fbm2(uv * vec2(12., 8.), 5) + .2 * crack - .4 * smoothstep(rim + .012, rim, v) + .15 * smoothstep(rim, 1., v);
    return Px(T, vec3((v - rim) * K() * 1.15 + .5 * noise2(uv * vec2(6., 3.)), (uv.x * .6 + v) * K(), (-uv.x * .6 + v) * K()));
  }
  // plateau cut by the winding inner gorge
  float plat = .665 + .01 * noise2(vec2(uv.x * 8., 5.));
  if (v > plat) {
    float z = (v - plat) / (1. - plat);
    float gx = .62 + .2 * z + .09 * sin(z * 7.5);
    float gw = .018 + .16 * z;
    float dx = uv.x - gx;
    if (abs(dx) < gw) {
      float rw = .004 + .035 * z;
      if (abs(dx) < rw) {
        float T = .1 + .14 * smoothstep(.3, .9, noise2(vec2(uv.x * 40., v * 260.)));
        return Px(T, vec3(v * K() * 1.3, uv.x * K(), 0.));
      }
      float s = (abs(dx) - rw) / (gw - rw);
      float T = dx < 0. ? .38 + .2 * s : .8 - .15 * s;
      T += .15 * smoothstep(.6, .95, ridged2(vec2(uv.x * 40., v * 5.), 4));
      T += .12 * smoothstep(.3, .5, fract(v * 45.));
      return Px(T, vec3((uv.x + .003 * noise2(vec2(v * 50., 1.))) * K() * 1.25, v * K() * 1.15, (uv.x - v) * K()));
    }
    float edge = smoothstep(.012, 0., abs(dx) - gw);
    float shrub = smoothstep(.55, .85, noise2(uv * vec2(70., 160.) / (.3 + z)));
    float T = .2 + .15 * z + .3 * shrub + .45 * edge * step(0., dx) + .2 * edge * step(dx, 0.);
    return Px(T, vec3(v * K() * 1.15 + .2 * noise2(uv * vec2(10., 30.)), (uv.x * .6 + v) * K(), (-uv.x * .6 + v) * K()));
  }
  float t3 = layerTop(uv.x, .665, .15, 7.);
  if (v > t3) return rock(uv, t3, 7., .06);
  float t2 = layerTop(uv.x, .58, .2, 5.);
  if (v > t2) return rock(uv, t2, 5., .24);
  float t1 = layerTop(uv.x, .5, .22, 3.);
  if (v > t1) return rock(uv, t1, 3., .42);
  float t0 = .4 + .012 * noise2(vec2(uv.x * 5., 1.)) - .05 * terrace(smoothstep(-.3, .6, noise2(vec2(uv.x * 2.2, 2.))), 3.);
  if (v > t0) return rock(uv, t0, 1., .6);
  float c = fbm2(vec2(uv.x * 2., v * 6.) + 9., 5);
  float T = mix(.34, .06, smoothstep(.0, .44, v)) + .14 * smoothstep(.1, .4, c) * smoothstep(.44, .1, v);
  return Px(T, vec3(v * K() * 1.15 + .2 * sin(uv.x * 7.), (uv.x * .55 + v) * K(), (-uv.x * .55 + v) * K()));
}
