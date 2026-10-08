// $10 front: "The Launch" - a multi-stage rocket rising beside its launch tower on billowing steam.
const vec3 L = normalize(vec3(.55, .45, .7));
const float RX = .74;

float segDist(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0., 1.); return length(pa - ba * h); }

// steam: shaded cloud balls
bool steam(vec2 uv, out Px px) {
  float best = -1.; vec3 bn;
  for (int i = 0; i < 90; i++) {
    float fi = float(i);
    float side = mod(fi, 2.) * 2. - 1.;
    float spread = pow(hash12(vec2(fi, 1.)), .8);
    float h = hash12(vec2(fi, 2.));
    vec2 c = vec2(RX + side * (.03 + spread * .72), .93 - .24 * h * (1. - .55 * spread));
    float r = .03 + .055 * hash12(vec2(fi, 3.)) * (1. - .35 * h);
    vec2 d = (uv - c) / r;
    float edge = 1. + .1 * noise2(uv * 45. + fi) + .05 * noise2(uv * 140. + fi);
    float q = dot(d, d);
    if (q < edge * edge) {
      float z = sqrt(edge * edge - q) * r * 3. + (c.y - .7) * 1.5 + hash12(vec2(fi, 5.)) * .05;
      if (z > best) { best = z; bn = normalize(vec3(d.x, -d.y, sqrt(edge * edge - q))); }
    }
  }
  if (best < 0.) return false;
  float lit = max(dot(bn, normalize(vec3(.4, .7, .6))), 0.);
  float T = .64 - .6 * lit;
  px = Px(T, vec3(uv.y * K() * 1.2 + .15 * noise2(uv * 20.), (uv.x * .6 - uv.y) * K(), (uv.x * .6 + uv.y) * K()));
  return true;
}

float rocketR(float v0) {
  float v = .095 + (v0 - .03) * (.605 / .71);
  float k = 1.32;
  if (v < .095) return 0.;
  if (v < .14) return .006 * k;                          // escape tower
  if (v < .175) return (.006 + .022 * (v - .14) / .035) * k;  // capsule
  if (v < .25) return .028 * k;
  if (v < .27) return (.028 + .009 * (v - .25) / .02) * k;
  if (v < .4) return .037 * k;
  if (v < .42) return (.037 + .009 * (v - .4) / .02) * k;
  if (v < .7) return .046 * k;
  return 0.;
}

Px paint(vec2 uv) {
  Px px;
  // flame and the pad's fire glow
  vec2 f = uv - vec2(RX, .74);
  float fw = .05 * (1. - f.y / .2) + .01 * noise2(vec2(uv.y * 40., 1.));
  if (f.y > 0. && f.y < .2 && abs(f.x) < fw) {
    float T = .02 + .2 * smoothstep(fw * .4, fw, abs(f.x)) + .1 * smoothstep(.05, .2, f.y);
    return Px(T, vec3((uv.x + .002 * sin(uv.y * 200.)) * K() * 1.3, uv.y * K(), 0.));
  }
  if (steam(uv, px)) return px;
  // ground
  if (uv.y > .93) return Px(.62 + .2 * smoothstep(.93, 1., uv.y), vec3(uv.y * K() * 1.2, (uv.x + uv.y) * K(), 0.));
  // rocket
  float R = rocketR(uv.y);
  float dx = uv.x - RX;
  if (R > 0. && abs(dx) < R) {
    float nx = dx / R, th = asin(clamp(nx, -1., 1.));
    vec3 n = vec3(nx, 0., cos(th));
    float dif = max(dot(n, L), 0.);
    float T = 1. - (.12 + .78 * dif) + .1 * smoothstep(.75, 1., abs(nx));
    // roll pattern and stage bands
    float vv = .095 + (uv.y - .03) * (.605 / .71);
    bool dark = (vv > .6 && vv < .68 && mod(floor((th / 3.1416 + .5) * 4.), 2.) < 1.) || abs(vv - .25) < .004 || abs(vv - .4) < .004 || abs(vv - .42) < .003 || (vv > .175 && vv < .185) || abs(vv - .27) < .003;
    if (dark) T = .82 - .25 * dif;
    if (vv > .38 && vv < .395 && abs(nx) < .5) T = .3;   // lettering band
    return Px(T, vec3((uv.y + .1 * R * cos(th)) * K() * 1.3, th * R * K() * 1.25, (uv.x + uv.y) * K()));
  }
  // fins
  float fy = uv.y - .65;
  float rb = .046 * 1.32;
  if (fy > 0. && fy < .09 && abs(dx) > rb && abs(dx) < rb + .036 * fy / .09) {
    float T = dx > 0. ? .35 : .75;
    return Px(T, vec3(uv.y * K() * 1.3, uv.x * K(), 0.));
  }
  // launch tower: two rails with cross bracing, and swing arms
  float tx0 = .52, tx1 = .6;
  if (uv.x > tx0 - .006 && uv.x < tx1 + .006 && uv.y > .06 && uv.y < .93) {
    float cell = .055;
    float cy = floor(uv.y / cell) * cell;
    vec2 p = uv;
    float d = min(abs(uv.x - tx0), abs(uv.x - tx1));
    d = min(d, segDist(p, vec2(tx0, cy), vec2(tx1, cy + cell)));
    d = min(d, segDist(p, vec2(tx1, cy), vec2(tx0, cy + cell)));
    d = min(d, abs(uv.y - cy));
    if (d < .0028) return Px(.86, vec3(uv.x * K() * 1.3, uv.y * K() * 1.3, (uv.x + uv.y) * K()));
  }
  for (int i = 0; i < 4; i++) {
    float ay = .16 + float(i) * .15;
    if (abs(uv.y - ay) < .005 && uv.x > tx1 && uv.x < RX - .03) return Px(.85, vec3(uv.y * K() * 1.4, uv.x * K(), 0.));
  }
  if (uv.y > .055 && uv.y < .07 && uv.x > tx0 - .012 && uv.x < tx1 + .02) return Px(.85, vec3(uv.y * K(), uv.x * K(), 0.));
  // sky: dawn gradient, streaked clouds, glow from the launch
  float c = fbm2(vec2(uv.x * 2., uv.y * 10.) + 3., 6);
  float T = mix(.5, .1, smoothstep(.0, .75, uv.y)) + .15 * smoothstep(.0, .35, c) * smoothstep(.7, .1, uv.y);
  T -= .12 * smoothstep(.35, .0, length((uv - vec2(RX, .8)) * vec2(.6, 1.)));
  return Px(T, vec3(uv.y * K() * 1.15 + .25 * sin(uv.x * 7.), (uv.x * .55 + uv.y) * K(), (-uv.x * .55 + uv.y) * K()));
}
