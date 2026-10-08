// $20 back: "The Giant Sequoia Grove" - furrowed trunks in shafts of light, ferns and a fallen log.
const vec3 L = normalize(vec3(.68, .3, .66));

float shafts(vec2 uv) {
  float d = uv.x * .55 + uv.y * .83;
  float s = smoothstep(.55, 1., sin(d * 9. + 1.3)) * .8 + smoothstep(.7, 1., sin(d * 23. + 4.)) * .4;
  return s * smoothstep(.95, .2, uv.y) * smoothstep(.05, .9, uv.x);
}

// a trunk: centre line leaning, flared base; returns false if uv misses it
bool trunk(vec2 uv, float c0, float w0, float lean, float baseV, float seed, out float nx, out float hw) {
  float y = baseV - uv.y;
  if (y < -.005) return false;
  float c = c0 + lean * y;
  float flare = 1. + 1.1 * exp(-y * 9.) + .25 * exp(-y * 30.) * sin(uv.x * 90. + seed);
  hw = w0 * flare * (1. - .1 * y) * (1. + .035 * noise2(vec2(uv.y * 14., seed)));
  float dx = uv.x - c;
  if (abs(dx) > hw) return false;
  nx = dx / hw;
  return true;
}
Px bark(vec2 uv, float nx, float hw, float seed, float haze, bool scar) {
  float th = asin(clamp(nx, -1., 1.));
  vec3 n = vec3(nx, 0., cos(th));
  float dif = max(dot(n, L), 0.);
  float wob = .35 * noise2(vec2(uv.y * 5., seed));
  float r = ridged2(vec2(th * 6. + wob, uv.y * 2.2 + seed), 4);
  float T = 1. - (.12 + .78 * dif);
  T += .42 * smoothstep(.5, .95, r) - .12;
  T += .05 * noise2(vec2(th * 12., uv.y * 9. + seed));
  T += .15 * smoothstep(.7, 1., abs(nx));
  if (scar) {
    float y = .9 - uv.y;
    float sc = smoothstep(.01, -.01, abs(nx + .12) - .32 * (1. - y / .2)) * step(y, .2);
    T = mix(T, .93, sc);
  }
  T = mix(T, .16, haze);
  float s = th * hw;
  return Px(T, vec3(s * K() * 1.2 + .25 * noise2(vec2(uv.y * 30., seed)),
                    (uv.y + .22 * hw * cos(th)) * K() * 1.05,
                    (uv.x * .7 + uv.y * .7) * K()));
}

Px far(vec2 uv) {
  // canopy: foliage clumps thinning downward
  float dens = fbm2(uv * vec2(4., 7.) + 2., 5) + .7 - uv.y * 3.6;
  if (dens > 0.) {
    float lit = fbm2(uv * vec2(4., 7.) + 2. + vec2(-.02, .03), 5) - fbm2(uv * vec2(4., 7.) + 2., 5);
    float T = .62 + .3 * clamp(lit * 8., -1., 1.) + .1 * smoothstep(.0, .3, dens) - .2 * shafts(uv);
    return Px(T, vec3((uv.x * .5 - uv.y) * K() * 1.2, (uv.x * .5 + uv.y) * K() * 1.2, uv.y * K()));
  }
  // misty depth: faint far trunks drawn with fine vertical lines
  float ft = .5 + .5 * noise2(vec2(uv.x * 38., 2.));
  float T = .26 + .18 * smoothstep(.55, .9, ft) + .1 * fbm2(uv * vec2(6., 3.), 3);
  T -= .42 * shafts(uv);
  T += .1 * smoothstep(.45, .15, uv.y);
  return Px(T, vec3(uv.x * K() * 1.25 + .2 * noise2(vec2(uv.y * 20., uv.x * 3.)), (uv.y + uv.x * .4) * K(), (uv.y - uv.x * .4) * K()));
}

// one fern frond: base b, angle a, length l, droop; returns true when uv is inside a leaflet
bool frond(vec2 uv, vec2 b, float a, float l, float droop, out float s, out float q, out float hw) {
  vec2 d = uv - b;
  vec2 dir = vec2(cos(a), -sin(a)), nrm = vec2(-dir.y, dir.x);
  s = dot(d, dir); q = dot(d, nrm);
  q -= droop * s * s / l * sign(cos(a) + 1e-3);
  if (s < 0. || s > l) return false;
  float t = s / l;
  hw = l * .2 * pow(sin(3.1416 * min(t * 1.15, 1.)), .7) * (1. - .5 * t);
  float leaflets = .3 + .7 * abs(sin(t * 34.));
  return abs(q) < hw * leaflets;
}
bool ferns(vec2 uv, out Px px) {
  float best = -1.;
  float cs = .11;
  float ci = floor(uv.x / cs);
  for (int k = -1; k <= 1; k++) {
    float id = ci + float(k);
    vec2 base = vec2((id + .5 + (hash12(vec2(id, 1.)) - .5) * .5) * cs, .95 + .03 * hash12(vec2(id, 2.)));
    for (int j = 0; j < 7; j++) {
      float fj = float(j);
      float a = mix(.35, 2.8, (fj + hash12(vec2(id, fj + 3.)) * .6) / 7.);
      float l = .11 + .07 * hash12(vec2(id, fj + 9.));
      float s, q, hw;
      if (frond(uv, base, a, l, .55, s, q, hw)) {
        float order = base.y + fj * .001;
        if (order > best) {
          best = order;
          float side = q / max(hw, 1e-4);
          float T = .5 + .25 * smoothstep(-.2, .9, side) - .3 * smoothstep(.12, 0., abs(side)) + .15 * (s / l);
          px = Px(T, vec3((s - .9 * abs(q)) * K() * 1.35, q * K() * 1.3, (s + .9 * abs(q)) * K() * 1.35));
        }
      }
    }
  }
  return best > 0.;
}

Px paint(vec2 uv) {
  float nx, hw;
  Px fp;
  if (ferns(uv, fp)) return fp;
  float ground = .82 + .015 * sin(uv.x * 7.) + .012 * noise2(vec2(uv.x * 12., 4.));
  // the great sequoia, with a fire scar at its base
  if (trunk(uv, .47, .165, -.035, .93, 1., nx, hw)) return bark(uv, nx, hw, 1., 0., true);
  // second giant, further back
  if (trunk(uv, 1.1, .1, .025, .84, 7., nx, hw)) return bark(uv, nx, hw, 7., .2, false);
  // forest floor
  if (uv.y > ground) {
    float T = .4 + .18 * fbm2(uv * vec2(14., 30.), 4) + .2 * smoothstep(ground, 1., uv.y) - .15 * shafts(uv);
    return Px(T, vec3(uv.y * K() * 1.2 + .3 * noise2(uv * vec2(30., 4.)), (uv.x * .6 + uv.y) * K(), (-uv.x * .6 + uv.y) * K()));
  }
  // background trunks fading into the haze
  if (trunk(uv, .14, .04, .01, .84, 3., nx, hw)) return bark(uv, nx, hw, 3., .5, false);
  if (trunk(uv, .8, .045, -.01, .84, 5., nx, hw)) return bark(uv, nx, hw, 5., .5, false);
  if (trunk(uv, 1.33, .032, .0, .84, 9., nx, hw)) return bark(uv, nx, hw, 9., .6, false);
  if (trunk(uv, .93, .018, .0, .84, 13., nx, hw)) return bark(uv, nx, hw, 13., .72, false);
  return far(uv);
}
