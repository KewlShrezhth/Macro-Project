// $50 front: "The Capitol Dome" - a ribbed dome on a colonnaded drum above a porticoed hall.
const vec3 L = normalize(vec3(-.55, .45, .7));
const float CX = .7;

// shading for a vertical cylinder of radius r centred at cx
Px cylPx(vec2 uv, float cx, float r, float base, float seed) {
  float nx = clamp((uv.x - cx) / r, -1., 1.);
  float th = asin(nx);
  float dif = max(dot(vec3(nx, 0., cos(th)), L), 0.);
  float flute = .5 + .5 * cos(th * 16.);
  float T = 1. - (base + .7 * dif) + .12 * flute;
  return Px(T, vec3(th * r * K() * 1.3, uv.y * K() * 1.2, (uv.x + uv.y) * K()));
}
Px wallPx(vec2 uv, float T) { return Px(T + .04 * noise2(uv * 300.), vec3(uv.y * K() * 1.25, uv.x * K() * 1.2, (uv.x - uv.y) * K())); }

// colonnade ring seen from the front: columns at angles, nearest drawn
bool colonnade(vec2 uv, float R, float y0, float y1, float n, float cr, out Px px) {
  if (uv.y < y0 || uv.y > y1) return false;
  float best = -2.;
  for (int i = 0; i < 28; i++) {
    float a = (float(i) + .5) / n * 6.2832;
    if (float(i) >= n) break;
    float z = cos(a);
    if (z < -.05) continue;
    float cx = CX + R * sin(a);
    if (abs(uv.x - cx) < cr && z > best) { best = z; px = cylPx(uv, cx, cr, .08, float(i)); px.T += .25 * (1. - z); }
  }
  return best > -2.;
}

bool tree(vec2 uv, vec2 c, float r, out Px px) {
  float best = -1.; vec3 bn; vec2 bc;
  for (int i = 0; i < 20; i++) {
    float fi = float(i);
    vec2 o = (vec2(hash12(c * 13. + fi), hash12(c * 7. + fi * 3.1)) - .5) * vec2(1.4, 1.7) * r;
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
  return false;
}

Px paint(vec2 uv) {
  Px px;
  if (tree(uv, vec2(.06, .72), .13, px)) return px;
  if (tree(uv, vec2(1.34, .73), .12, px)) return px;
  float a = abs(uv.x - CX);
  // statue and lantern
  if (uv.y > .025 && uv.y < .07 && a < .008 + .006 * smoothstep(.04, .07, uv.y)) return Px(.75 - .3 * step(CX, uv.x), vec3(uv.x * K() * 1.3, uv.y * K(), 0.));
  if (uv.y >= .07 && uv.y < .085 && a < .03 - (.085 - uv.y) * 1.2) return Px(.4 + .3 * step(CX, uv.x), vec3(uv.y * K() * 1.3, uv.x * K(), 0.));
  if (uv.y >= .085 && uv.y < .14 && a < .034) {
    if (colonnade(uv, .028, .09, .135, 10., .0045, px)) return px;
    if (uv.y < .09 || uv.y > .135) return wallPx(uv, .3);
    return wallPx(uv, .85);
  }
  // the dome: ribs and two tiers of windows
  float top = .14, base = .4;
  if (uv.y >= top && uv.y < base) {
    float t = (uv.y - top) / (base - top);
    float R = .205 * sqrt(1. - pow(1. - t, 2.)) + .035 * (1. - t);
    if (a < R) {
      float nx = (uv.x - CX) / R, th = asin(clamp(nx, -1., 1.));
      float ny = (1. - t) * .9;
      vec3 n = normalize(vec3(nx, ny, cos(th) * (1. - ny * .6)));
      float dif = max(dot(n, L), 0.);
      float T = 1. - (.1 + .78 * dif);
      float rib = abs(fract(th / 3.1416 * 12. + .5) - .5);
      T += .25 * smoothstep(.06, .02, rib);
      float tier1 = smoothstep(.01, 0., abs(t - .55) - .04), tier2 = smoothstep(.01, 0., abs(t - .82) - .035);
      float win = step(.18, rib) * (tier1 + tier2);
      T = mix(T, .9, win * .8);
      if (abs(t - .44) < .008 || abs(t - .72) < .006) T = .55;
      return Px(T, vec3((uv.y + .08 * R * cos(th)) * K() * 1.2, th * R * K() * 1.2, (uv.x + uv.y) * K()));
    }
  }
  // entablature, peristyle and attic
  if (uv.y >= .4 && uv.y < .425 && a < .245) return wallPx(uv, .2 + .5 * smoothstep(.41, .425, uv.y));
  if (uv.y >= .425 && uv.y < .55 && a < .24) {
    if (colonnade(uv, .222, .425, .55, 22., .0125, px)) return px;
    float nx = (uv.x - CX) / .2;
    return wallPx(uv, .72 + .15 * nx);
  }
  if (uv.y >= .55 && uv.y < .6 && a < .26) {
    float pil = step(.7, fract((uv.x - CX) * 60.));
    return wallPx(uv, .25 + .3 * pil + .3 * smoothstep(.0, .26, uv.x - CX));
  }
  // portico and wings
  if (uv.y >= .6 && uv.y < .86) {
    if (a < .16) {
      if (uv.y < .66 && (uv.y - .6) > a * .32) {
        float T = .42 + .18 * noise2(uv * vec2(60., 90.)) + .2 * smoothstep(.62, .66, uv.y);
        return wallPx(uv, T);                                                 // pediment with sculpture
      }
      if (uv.y < .6 + a * .32 + .006 && uv.y >= .6 + a * .32) return wallPx(uv, .1);
      if (uv.y >= .66 && uv.y < .675) return wallPx(uv, .25);
      if (uv.y >= .675 && uv.y < .82) {
        for (int i = 0; i < 8; i++) {
          float cx = CX - .14 + float(i) * .04;
          if (abs(uv.x - cx) < .0145) return cylPx(uv, cx, .0145, .3, float(i));
        }
        return wallPx(uv, .85);
      }
    }
    if (uv.x > .02 && uv.x < 1.38) {
      if (uv.y < .63) return wallPx(uv, .25 + .4 * step(.62, uv.y));
      float wx = fract((uv.x - CX) * 20.);
      bool window = abs(wx - .5) < .17 && ((uv.y > .66 && uv.y < .71) || (uv.y > .75 && uv.y < .8));
      if (window) return wallPx(uv, .82);
      float pil = smoothstep(.04, .0, abs(wx - .02));
      return wallPx(uv, .22 + .25 * pil + .1 * smoothstep(.0, 1., (uv.x - CX) * 1.5));
    }
  }
  // steps, plaza, lawn and trees
  if (uv.y >= .82) {
    if (a < .2 + (uv.y - .82) * 1.5 && uv.y < .9) {
      float st = fract((uv.y - .82) * 120.);
      return wallPx(uv, .1 + .45 * step(.7, st));
    }
    float T = .34 + .3 * smoothstep(.86, 1., uv.y) + .05 * noise2(uv * vec2(20., 60.));
    return Px(T, vec3(uv.y * K() * 1.2, (uv.x * .6 + uv.y) * K(), 0.));
  }
  float c = fbm2(vec2(uv.x * 2., uv.y * 6.) + 2., 5);
  float T = mix(.3, .06, smoothstep(.0, .6, uv.y)) + .14 * smoothstep(.1, .4, c) * smoothstep(.6, .05, uv.y);
  return Px(T, vec3(uv.y * K() * 1.15 + .2 * sin(uv.x * 7.), (uv.x * .55 + uv.y) * K(), (-uv.x * .55 + uv.y) * K()));
}
