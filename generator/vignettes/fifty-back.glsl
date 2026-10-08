// $50 back: "The Hall of the People" - a temple front; the frieze is left clear for the engraved inscription.
const vec3 L = normalize(vec3(-.5, .45, .74));
const float CX = .7;

Px cylPx(vec2 uv, float cx, float r) {
  float nx = clamp((uv.x - cx) / r, -1., 1.);
  float th = asin(nx);
  float dif = max(dot(vec3(nx, 0., cos(th)), L), 0.);
  float flute = .5 + .5 * cos(th * 20.);
  float T = 1. - (.25 + .7 * dif) + .14 * flute;
  return Px(T, vec3(th * r * K() * 1.3, uv.y * K() * 1.2, (uv.x + uv.y) * K()));
}
Px wallPx(vec2 uv, float T) { return Px(T + .03 * noise2(uv * 300.), vec3(uv.y * K() * 1.25, uv.x * K() * 1.2, (uv.x - uv.y) * K())); }
bool tree(vec2 uv, vec2 c, float r, out Px px) {
  float best = -1.; vec3 bn; vec2 bc;
  for (int i = 0; i < 22; i++) {
    float fi = float(i);
    vec2 o = (vec2(hash12(c * 13. + fi), hash12(c * 7. + fi * 3.1)) - .5) * vec2(1.3, 1.9) * r;
    float rr = r * (.26 + .2 * hash12(c + fi * 5.7));
    vec2 d = (uv - c - o) / rr;
    float edge = 1. + .12 * noise2(uv * 160. + fi);
    float q = dot(d, d);
    if (q < edge * edge) {
      float z = sqrt(edge * edge - q) - o.y / r * .2 + hash12(c + fi) * .3;
      if (z > best) { best = z; bn = normalize(vec3(d, sqrt(edge * edge - q))); bc = c + o; }
    }
  }
  if (best > 0.) {
    float lit = max(dot(bn, normalize(vec3(-.5, .55, .66))), 0.);
    px = Px(.88 - .6 * lit + .1 * noise2(uv * 420.), vec3(length(uv - bc) * K() * 1.3, (uv.x * .6 - uv.y) * K() * 1.2, (uv.x * .6 + uv.y) * K() * 1.2));
    return true;
  }
  if (abs(uv.x - c.x) < r * .07 && uv.y > c.y && uv.y < .9) { px = Px(.7, vec3(uv.x * K() * 1.3, uv.y * K(), 0.)); return true; }
  return false;
}

Px paint(vec2 uv) {
  Px px;
  float a = abs(uv.x - CX);
  if (tree(uv, vec2(.08, .5), .15, px)) return px;
  if (tree(uv, vec2(1.33, .52), .14, px)) return px;
  float x0 = CX - .46, x1 = CX + .46;
  // pediment with a sculpted tympanum
  float apex = .08, eave = .235;
  float slope = (eave - apex) / .48;
  if (uv.y > apex + a * slope - .012 && uv.y < eave && a < .48) {
    float inner = uv.y - (apex + a * slope);
    if (inner < .012 || uv.y > eave - .014) return wallPx(uv, .12 + .45 * step(eave - .006, uv.y));   // raking and horizontal cornices
    float fig = smoothstep(.1, .5, noise2(vec2(uv.x * 40., 3.))) * smoothstep(.0, .02, inner);
    float relief = fbm2(uv * vec2(60., 40.), 4);
    float T = .62 - .35 * fig * (.5 + .5 * relief) + .1 * relief;
    return Px(T, vec3((uv.y + .01 * relief) * K() * 1.25, uv.x * K() * 1.2, (uv.x - uv.y) * K()));
  }
  // entablature: architrave, clear frieze for the inscription, dentils
  if (uv.y >= eave && uv.y < .345 && a < .48) {
    if (uv.y < .25) return wallPx(uv, .2 + .3 * step(.5, fract(uv.x * 160.)));       // dentils
    if (uv.y < .3) return wallPx(uv, .08);                                            // frieze (inscription goes here)
    if (uv.y < .306) return wallPx(uv, .45);
    return wallPx(uv, .15 + .15 * step(.325, uv.y));                                  // architrave fasciae
  }
  // colonnade with a shadowed cella and its great door
  if (uv.y >= .345 && uv.y < .79 && a < .46) {
    for (int i = 0; i < 8; i++) {
      float cx = x0 + .05 + float(i) * (.82 / 7.);
      float rr = .022;
      if (uv.y < .365 && abs(uv.x - cx) < rr * 1.5) return wallPx(uv, .15 + .3 * step(.357, uv.y));   // capital
      if (uv.y > .77 && abs(uv.x - cx) < rr * 1.35) return wallPx(uv, .25);                          // base
      if (abs(uv.x - cx) < rr) return cylPx(uv, cx, rr * (1. - .08 * (uv.y - .365) / .4));
    }
    vec2 d = uv - vec2(CX, .79);
    if (abs(d.x) < .06 && d.y > -.27) {
      float T = abs(d.x) > .052 || d.y < -.262 ? .35 : .95 - .1 * step(.5, fract(d.y * 30.));
      return wallPx(uv, T);
    }
    return wallPx(uv, .82 - .1 * smoothstep(.36, .5, uv.y) * 0. + .06 * noise2(uv * vec2(40., 8.)));
  }
  // steps
  if (uv.y >= .79 && uv.y < .9 && a < .5 + (uv.y - .79) * .3) {
    float st = fract((uv.y - .79) * 82.);
    return wallPx(uv, .08 + .5 * smoothstep(.65, .8, st));
  }
  if (uv.y >= .86) {
    float T = .34 + .3 * smoothstep(.86, 1., uv.y) + .05 * noise2(uv * vec2(20., 60.));
    return Px(T, vec3(uv.y * K() * 1.2, (uv.x * .6 + uv.y) * K(), 0.));
  }
  float c = fbm2(vec2(uv.x * 2., uv.y * 6.) + 6., 5);
  float T = mix(.32, .06, smoothstep(.0, .6, uv.y)) + .14 * smoothstep(.1, .4, c) * smoothstep(.6, .05, uv.y);
  return Px(T, vec3(uv.y * K() * 1.15 + .2 * sin(uv.x * 7.), (uv.x * .55 + uv.y) * K(), (-uv.x * .55 + uv.y) * K()));
}
