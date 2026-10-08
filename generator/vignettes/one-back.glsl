// $1 back: "Independence Hall" - a brick hall with clock tower and steeple, trees and lawn.
const float CX = .7;

float box(vec2 uv, float x0, float x1, float y0, float y1) { return step(x0, uv.x) * step(uv.x, x1) * step(y0, uv.y) * step(uv.y, y1); }
Px brick(vec2 uv, float T) {
  float course = floor(uv.y * 260.);
  float joint = fract(uv.x * 130. + .5 * mod(course, 2.));
  T += .12 * smoothstep(.06, 0., min(joint, 1. - joint)) + .05 * noise2(uv * vec2(300., 260.));
  return Px(T, vec3(uv.y * K() * 1.2, (uv.x + .5 * mod(course, 2.) / 130.) * 130. * 1., (uv.x - uv.y) * K()));
}
// a sash window with shutters and a lintel; returns true if hit
bool windowAt(vec2 uv, vec2 c, vec2 hs, out Px px) {
  vec2 d = uv - c;
  if (abs(d.x) > hs.x + .006 || d.y < -hs.y - .012 || d.y > hs.y + .004) return false;
  float T;
  if (d.y < -hs.y) T = .25 + .15 * step(.5, fract(d.x * 300.));          // stone lintel
  else if (abs(d.x) > hs.x - .004 || abs(d.y) > hs.y - .004) T = .1;      // white frame
  else {
    vec2 g = fract((d + hs) / (2. * hs) * vec2(3., 4.));
    bool bar = min(g.x, 1. - g.x) < .07 || min(g.y, 1. - g.y) < .06;
    T = bar ? .2 : .78 - .25 * smoothstep(0., hs.x, d.x);
  }
  if (abs(d.x) < hs.x - .004 && d.y > -hs.y && d.y < -hs.y + .006) T = .9;  // shadow under the lintel
  px = Px(T, vec3(uv.y * K() * 1.25, uv.x * K() * 1.25, (uv.x + uv.y) * K()));
  return true;
}
// deciduous tree: a cluster of shaded leaf clumps over a trunk
Px tree(vec2 uv, vec2 c, float r, out bool hit) {
  hit = false;
  float best = -1.; vec3 bn; vec2 bc; float br;
  for (int i = 0; i < 22; i++) {
    float fi = float(i);
    vec2 o = (vec2(hash12(c * 13. + fi), hash12(c * 7. + fi * 3.1)) - .5) * vec2(1.5, 1.7) * r;
    float rr = r * (.28 + .2 * hash12(c + fi * 5.7));
    vec2 d = (uv - c - o) / rr;
    float edge = 1. + .12 * noise2(uv * 160. + fi);
    float q = dot(d, d);
    if (q < edge * edge) {
      float z = sqrt(max(edge * edge - q, 0.)) + (1. - o.y / r) * .2 + hash12(c + fi) * .3;   // upper clumps in front
      if (z > best) { best = z; bn = normalize(vec3(d, sqrt(max(edge * edge - q, 0.)))); bc = c + o; br = rr; }
    }
  }
  if (best > 0.) {
    hit = true;
    float lit = max(dot(bn, normalize(vec3(-.5, .55, .66))), 0.);
    float leaf = noise2(uv * 420.);
    float T = .88 - .62 * lit + .1 * leaf;
    vec2 d = uv - bc;
    return Px(T, vec3(length(d) * K() * 1.3 + .4 * leaf, (uv.x * .6 - uv.y) * K() * 1.2, (uv.x * .6 + uv.y) * K() * 1.2));
  }
  if (abs(uv.x - c.x - .01 * sin(uv.y * 30.)) < r * .07 && uv.y > c.y && uv.y < .87) {
    hit = true;
    float s = (uv.x - c.x) / (r * .07);
    return Px(.55 + .35 * smoothstep(.3, -1., s), vec3(uv.x * K() * 1.3, uv.y * K(), 0.));
  }
  return Px(0., vec3(0.));
}

Px paint(vec2 uv) {
  bool hit; Px px;
  // lawn and path
  if (uv.y > .865) {
    float path = abs(uv.x - CX) - (.03 + (uv.y - .865) * .9);
    float T = path < 0. ? .12 + .1 * smoothstep(.865, 1., uv.y) : .42 + .25 * smoothstep(.865, 1., uv.y) + .08 * noise2(uv * vec2(80., 300.));
    return Px(T, vec3(uv.y * K() * 1.2, (uv.x - CX) / (uv.y - .8) * 30., (uv.x + uv.y) * K()));
  }
  // flanking trees
  px = tree(uv, vec2(.08, .55), .17, hit); if (hit) return px;
  px = tree(uv, vec2(1.33, .57), .16, hit); if (hit) return px;
  // steeple: white timber stages above the brick tower
  float a = abs(uv.x - CX);
  if (uv.y > .0 && uv.y < .05 && a < .003 + uv.y * .1) return Px(.35, vec3(uv.x * K() * 1.3, uv.y * K(), 0.));
  if (uv.y >= .05 && uv.y < .09 && a < .026) {             // lantern with arched openings
    bool open = a < .018 && fract((uv.x - CX) * 70. + .5) > .45 && uv.y > .058 && uv.y < .085;
    float T = open ? .85 : .15 + .25 * smoothstep(.0, .028, uv.x - CX);
    return Px(T, vec3(uv.x * K() * 1.3, uv.y * K() * 1.2, 0.));
  }
  if (uv.y >= .09 && uv.y < .125 && a < .058 - (.125 - uv.y) * 1.05) {   // bell-shaped cap
    float T = .35 + .4 * smoothstep(-.05, .05, uv.x - CX);
    return Px(T, vec3((uv.y - .02 * cos(a * 30.)) * K() * 1.3, uv.x * K() * 1.2, 0.));
  }
  if (uv.y >= .125 && uv.y < .205 && a < .056) {               // octagonal belfry
    bool open = abs(fract((uv.x - CX + .056) / .112 * 3.) - .5) < .27 && uv.y > .138 && uv.y < .195 && length(vec2(fract((uv.x - CX + .056) / .112 * 3.) - .5, max(.155 - uv.y, 0.) * 18.)) < .3;
    float face = smoothstep(.035, .056, a) * sign(uv.x - CX);
    float T = open ? .92 - .2 * smoothstep(.15, .19, uv.y) : .08 + .3 * max(face, 0.) + .05 * max(-face, 0.);
    if (abs(uv.y - .127) < .004 || abs(uv.y - .202) < .004) T = .35;
    return Px(T, vec3(uv.y * K() * 1.2, uv.x * K() * 1.3, 0.));
  }
  if (uv.y >= .2 && uv.y < .285 && a < .065) {              // clock stage
    vec2 d = (uv - vec2(CX, .243)) / .03;
    float r = length(d);
    float T = .12 + .2 * smoothstep(.04, .065, uv.x - CX);
    if (r < 1.) {
      T = .02;
      float ang = atan(d.y, d.x);
      if (r > .82 && fract(ang / 6.2832 * 12.) < .12) T = .8;
      if (abs(d.x) < .08 && d.y < 0. && d.y > -.6) T = .9;
      if (abs(d.y + d.x * .9) < .09 && d.x > 0. && d.x < .7) T = .9;
    }
    if (r > 1. && r < 1.12) T = .7;
    if (abs(uv.y - .285) < .005) T = .4;
    return Px(T, vec3(uv.y * K() * 1.2, uv.x * K() * 1.3, (uv.x + uv.y) * K()));
  }
  if (uv.y >= .285 && uv.y < .5 && a < .09) {              // brick tower with a Palladian window
    vec2 d = uv - vec2(CX, .41);
    bool win = abs(d.x) < .03 && d.y > -.04 && (d.y < .04 || length(d - vec2(0., .0)) < .03);
    if (abs(d.x) < .03 && d.y < .045 && d.y > -.045 && length(vec2(d.x, max(-d.y - .015, 0.))) < .03) {
      bool bar = abs(fract((d.x + .03) / .06 * 3.) - .5) > .44 || abs(fract((d.y + .045) / .09 * 4.) - .5) > .44;
      return Px(bar ? .15 : .82, vec3(uv.y * K() * 1.25, uv.x * K() * 1.25, 0.));
    }
    if (abs(uv.y - .3) < .006 || abs(uv.y - .36) < .003) return Px(.25, vec3(uv.y * K() * 1.2, uv.x * K(), 0.));
    float T = .5 + .18 * smoothstep(.0, .085, uv.x - CX) + .25 * smoothstep(.3, .29, uv.y - .0) * 0.;
    T += .2 * smoothstep(.3, .29, uv.y) * 0.;
    T += .25 * smoothstep(.31, .3, uv.y);
    return brick(uv, T);
  }
  // chimneys and roof
  for (int i = 0; i < 4; i++) {
    float cxh = i == 0 ? .2 : i == 1 ? .26 : i == 2 ? 1.14 : 1.2;
    if (abs(uv.x - cxh) < .014 && uv.y > .37 && uv.y < .47) return brick(uv, .55 + .2 * step(cxh, uv.x));
  }
  float roofTop = .44, eave = .5;
  if (uv.y > roofTop && uv.y < eave && uv.x > .15 + (eave - uv.y) * .5 && uv.x < 1.25 - (eave - uv.y) * .5) {
    float T = .62 + .1 * noise2(uv * vec2(400., 40.));
    if (uv.y < roofTop + .008) T = .2;                     // balustrade rail
    return Px(T, vec3(uv.y * K() * 1.35, uv.x * K() * 1.2, (uv.x - uv.y) * K()));
  }
  // facade
  if (uv.y >= eave && uv.y <= .865 && uv.x > .15 && uv.x < 1.25) {
    if (uv.y < eave + .01) return Px(.08, vec3(uv.y * K() * 1.3, uv.x * K(), 0.));   // white cornice
    if (uv.y < eave + .03) return brick(uv, .78 - 10. * (uv.y - eave - .01));             // its shadow
    // door with fanlight
    vec2 dd = uv - vec2(CX, .865);
    if (abs(dd.x) < .032 && dd.y > -.11) {
      bool fan = dd.y < -.085;
      float T = fan ? .35 + .4 * step(.5, fract(atan(dd.y + .085, dd.x) * 3.)) : (abs(dd.x) < .003 ? .3 : .75);
      if (abs(dd.x) > .028) T = .1;
      return Px(T, vec3(uv.y * K() * 1.2, uv.x * K() * 1.3, 0.));
    }
    for (int r = 0; r < 2; r++) {
      float wy = r == 0 ? .6 : .76;
      for (int k = 0; k < 10; k++) {
        float fk = float(k);
        float wx = .2 + fk * .108 + (fk > 4. ? .14 : 0.);
        if (abs(wx - CX) < .06) continue;
        if (windowAt(uv, vec2(wx, wy), vec2(.024, .042), px)) return px;
      }
    }
    if (abs(uv.y - .69) < .003) return Px(.2, vec3(uv.y * K() * 1.2, uv.x * K(), 0.));     // belt course
    float T = .52 + .08 * smoothstep(eave + .012, eave + .05, eave + .05 - (uv.y - eave));
    return brick(uv, T);
  }
  // sky
  float c = fbm2(vec2(uv.x * 2.2, uv.y * 5.) + 4., 5);
  float T = mix(.3, .05, smoothstep(.0, .5, uv.y)) + .12 * smoothstep(.1, .45, c) * smoothstep(.55, .1, uv.y);
  return Px(T, vec3(uv.y * K() * 1.15 + .2 * sin(uv.x * 8.), (uv.x * .55 + uv.y) * K(), (-uv.x * .55 + uv.y) * K()));
}
