// $20 front: "The High Sierra" - a granite dome over a mountain lake, painted layer by layer.
const vec3 L = normalize(vec3(.32, .55, .78));   // screen space light: x right, y up, z toward viewer

float hill(float u, float c, float w) { float x = (u - c) / w; return exp(-x * x); }

// ---- sky ----
float cloudD(vec2 uv) {
  float band = hill(uv.y, .34, .14);
  return fbm2(vec2(uv.x * 2.4, uv.y * 5.2) + vec2(3.1, 1.7), 6) + .55 * band - .2;
}
Px sky(vec2 uv) {
  float T = mix(.46, .12, smoothstep(.0, .55, uv.y)) + .1 * smoothstep(.9, 1.4, uv.x) * smoothstep(.6, .2, uv.y);
  float d = cloudD(uv);
  float lit = cloudD(uv + vec2(.012, -.02)) - d;
  float mask = smoothstep(.0, .2, d);
  float cT = .04 + .3 * clamp(.45 + lit * 9., 0., 1.);
  T = mix(T, cT, mask);
  return Px(T, vec3(uv.y * K() * 1.15 + .25 * sin(uv.x * 9.), (uv.x * .55 + uv.y) * K(), (-uv.x * .55 + uv.y) * K()));
}

// ---- distant ridges ----
float farRidge(float u) { return .53 - .11 * hill(u, .2, .17) - .05 * hill(u, .46, .1) + .018 * ridged2(vec2(u * 7., 1.), 4); }
float rightRidge(float u) { return .44 - .02 * hill(u, 1.38, .1) + .16 * smoothstep(1.25, 1.62, u) + .015 * ridged2(vec2(u * 8., 4.), 4); }
Px ridgePx(vec2 uv, float top, float seed, float haze) {
  // heightfield shading from slope noise
  vec2 e = vec2(.002, 0.);
  float h0 = ridged2(uv * vec2(14., 22.) + seed, 5);
  float hx = ridged2((uv + e.xy) * vec2(14., 22.) + seed, 5), hy = ridged2((uv + e.yx) * vec2(14., 22.) + seed, 5);
  vec3 n = normalize(vec3(-(hx - h0) / e.x * .02, (hy - h0) / e.x * .02, 1.));
  float b = .45 + .5 * max(dot(n, L), 0.);
  float T = mix(1. - b, .12, haze);
  float depthIn = uv.y - top;
  return Px(T, vec3((depthIn + .004 * noise2(uv * 40.)) * K() * 1.1, (uv.x * .7 + uv.y * .7) * K(), (uv.x * .7 - uv.y * .7) * K()));
}

// ---- the dome ----
const vec2 DC = vec2(.86, .66);
const vec2 DR = vec2(.5, .5);
float cutU(float v) { return .64 + .07 * (v - .3) + .006 * noise2(vec2(v * 30., 2.)); }
vec2 domeQ(vec2 uv) {
  vec2 q = (uv - DC) / DR;
  q.x *= q.x > 0. ? .82 : 1.25;           // long back slope, steep crown near the face
  q.y += .1 * q.x * q.x;
  q += .035 * vec2(fbm2(uv * vec2(9., 14.) + 2., 4), fbm2(uv * vec2(11., 7.) + 8., 4));
  return q;
}
bool inDome(vec2 uv) {
  vec2 q = domeQ(uv);
  bool body = (uv.y < DC.y ? dot(q, q) < 1. : abs(q.x) < 1.);
  return body && uv.x > cutU(uv.y) && uv.y > .135 + .02 * noise2(vec2(uv.x * 20., 3.));
}
Px domePx(vec2 uv) {
  vec2 q = domeQ(uv);
  float faceW = .05 + .1 * smoothstep(.16, .62, uv.y);
  float f = uv.x - cutU(uv.y);
  if (f < faceW) {
    // sheer face, turned away from the light, streaked by exfoliation
    float streak = noise2(vec2(uv.x * 160., uv.y * 5.)) * .5 + .5;
    float T = .7 + .2 * streak - .2 * smoothstep(faceW * .5, faceW, f);
    T -= .1 * smoothstep(.5, .18, uv.y);
    T += .1 * smoothstep(.04, 0., f);
    float ph = (uv.x + .004 * noise2(vec2(uv.y * 18., 1.))) * K() * 1.2;
    return Px(T, vec3(ph, (uv.y * .9 + uv.x * .4) * K(), (uv.y * .9 - uv.x * .4) * K()));
  }
  // rounded granite shoulder
  float r2 = clamp(dot(q, q), 0., .999);
  vec3 n = vec3(q.x, -q.y, sqrt(1. - r2));
  vec2 e = vec2(.0015, 0.);
  float g0 = fbm2(uv * vec2(18., 9.), 5);
  n.x += -(fbm2((uv + e.xy) * vec2(18., 9.), 5) - g0) / e.x * .006;
  n.y += (fbm2((uv + e.yx) * vec2(18., 9.), 5) - g0) / e.x * .006;
  n.x += .18 * noise2(vec2(uv.x * 55., uv.y * 7.));
  n = normalize(n);
  float b = .24 + .62 * max(dot(n, L), 0.);
  float T = 1. - b;
  float rr = sqrt(r2);
  float ang = atan(q.x, -q.y);
  // exfoliation sheets and joints in the granite
  T += .14 * noise2(vec2(rr * 14., ang * 2.5));
  T += .22 * smoothstep(.72, .98, ridged2(vec2(ang * 5., rr * 9.) + 3., 4)) * smoothstep(.2, .6, rr);
  T += .3 * smoothstep(.7, 1., rr) + .12 * smoothstep(.45, .66, uv.y);
  float ring = rr * DR.y * K() * 1.05 + .22 * noise2(uv * 18.);
  float mer = atan(q.x, -q.y) * .9 * DR.x * K() * .9;
  return Px(T, vec3(ring, mer, (uv.x * .7 + uv.y * .7) * K()));
}

// ---- forest and tree line ----
float shoreV(float u) { return .675 + .006 * sin(u * 11.) + .004 * noise2(vec2(u * 30., 5.)); }
bool treeAt(vec2 uv, float base, float cell, float hMin, float hMax, float seed, out Px s) {
  float best = 1e3; bool hit = false;
  float ci = floor(uv.x / cell);
  for (int k = -2; k <= 2; k++) {
    float id = ci + float(k);
    float rnd = hash12(vec2(id, seed));
    if (rnd < .12) continue;
    float tx = (id + .5 + (hash12(vec2(id, seed + 3.)) - .5) * .7) * cell;
    float h = mix(hMin, hMax, hash12(vec2(id, seed + 7.)));
    float b = base + .004 * noise2(vec2(tx * 40., seed));
    float top = b - h;
    if (uv.y < top || uv.y > b + .01) continue;
    float y = (uv.y - top) / h;
    float tier = fract(y * (6. + 3. * hash12(vec2(id, seed + 5.))));
    float hw = h * .27 * pow(y, .95) * (.62 + .38 * tier) * (.85 + .25 * noise2(vec2(uv.y * 160., id)));
    float dx = uv.x - tx;
    if (abs(dx) < hw) {
      // nearer (lower base) trees win
      if (b < best) {
        best = b; hit = true;
        float side = dx / max(hw, 1e-4);
        float T = .8 - .3 * smoothstep(-.1, .95, side) - .12 * tier + .08 * noise2(uv * vec2(300., 120.));
        float drop = .62;
        s = Px(T, vec3((uv.y - drop * abs(dx)) * K() * 1.25, dx * K() * 1.4, (uv.y + drop * abs(dx)) * K() * 1.25));
      }
    }
  }
  return hit;
}

Px above(vec2 uv) {
  Px s;
  float sh = shoreV(uv.x);
  if (treeAt(uv, sh - .004, .03, .05, .13, 1., s)) return s;
  if (treeAt(uv, sh - .025, .022, .035, .085, 9., s)) return s;
  if (treeAt(uv, sh - .045, .018, .025, .06, 17., s)) return s;
  // dark forest band at the foot of the cliffs
  float forestTop = .6 + .015 * noise2(vec2(uv.x * 25., 2.)) - .04 * hill(uv.x, .95, .25);
  if (uv.y > forestTop && uv.y <= sh) {
    float T = .55 + .2 * noise2(uv * vec2(160., 60.)) + .15 * smoothstep(forestTop, sh, uv.y);
    return Px(T, vec3((uv.x + .01 * noise2(uv * vec2(20., 90.))) * K() * 1.3, (uv.y + uv.x * .5) * K(), (uv.y - uv.x * .5) * K()));
  }
  if (inDome(uv)) return domePx(uv);
  float rr = rightRidge(uv.x);
  if (uv.y > rr && uv.x > .9) return ridgePx(uv, rr, 11., .35);
  float fr = farRidge(uv.x);
  if (uv.y > fr) return ridgePx(uv, fr, 4., .55);
  return sky(uv);
}

Px paint(vec2 uv) {
  Px s;
  // framing conifer on the left
  {
    float base = 1.05, h = .95, tx = .075;
    float top = base - h;
    float y = (uv.y - top) / h;
    float yy = clamp(y, 0., 1.);
    float tier = fract(yy * 11. + .3 * noise2(vec2(uv.x * 30., 1.)));
    float dx = uv.x - tx;
    float droop = tier + 1.8 * abs(dx) / h;
    float hw = h * .2 * pow(yy, .85) * (.45 + .55 * fract(yy * 11. - abs(dx) * 4.)) * (.85 + .3 * noise2(vec2(uv.y * 90., 4.)));
    if (uv.y > top && abs(dx) < hw) {
      float side = dx / max(hw, 1e-4);
      float T = .86 - .32 * smoothstep(-.05, 1., side) - .18 * fract(yy * 11. - abs(dx) * 4.) + .06 * noise2(uv * vec2(200., 90.));
      return Px(T, vec3((uv.y - .55 * abs(dx)) * K() * 1.05, dx * K() * 1.3, (uv.y + .55 * abs(dx)) * K() * 1.05));
    }
  }
  // foreground meadow
  float fg = .93 + .02 * sin(uv.x * 4. + 1.) + .008 * noise2(vec2(uv.x * 20., 7.));
  if (uv.y > fg) {
    float T = .42 + .28 * smoothstep(fg, 1., uv.y) + .16 * fbm2(uv * vec2(22., 10.), 5);
    T += .1 * smoothstep(.2, .9, noise2(vec2(uv.x * 60., uv.y * 8.)));
    float fl = (uv.y - fg + .012 * fbm2(uv * vec2(6., 3.), 3)) * K() * 1.15;
    return Px(T, vec3(fl, (uv.x * .8 + uv.y * .6) * K(), (-uv.x * .8 + uv.y * .6) * K()));
  }
  // lake with reflection
  float sh = shoreV(uv.x);
  if (uv.y > sh) {
    float rip = .003 * noise2(vec2(uv.x * 12., uv.y * 140.));
    vec2 m = vec2(uv.x + rip, 2. * sh - uv.y + rip * 2.);
    Px r = above(m);
    float T = r.T * .78 + .14 + .06 * noise2(vec2(uv.x * 6., uv.y * 120.));
    T -= .12 * smoothstep(sh + .012, sh, uv.y);
    T += .1 * smoothstep(fg - .05, fg, uv.y);
    return Px(T, vec3(uv.y * K() * 1.3 + .35 * noise2(vec2(uv.x * 14., uv.y * 90.)), (uv.x * .35 + uv.y) * K(), (-uv.x * .35 + uv.y) * K()));
  }
  return above(uv);
}
