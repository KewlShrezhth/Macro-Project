// $1 front: "The Liberty Bell" - the bell on its yoke before a sunburst, in a panelled hall.
const vec3 L = normalize(vec3(.45, .5, .74));
const float CX = .7;          // bell axis
const float VT = .27, VB = .8; // crown and lip

float bellR(float v) {
  float t = clamp((v - VT) / (VB - VT), 0., 1.);
  float r = .148 + .045 * t + .135 * pow(t, 3.4);
  r *= sqrt(smoothstep(-.02, .11, t));                     // rounded shoulder
  r += .012 * smoothstep(.9, .94, t) * smoothstep(1.01, .97, t);  // sound bow
  return r;
}

Px sunburst(vec2 uv) {
  vec2 d = uv - vec2(CX, .5);
  float a = atan(d.y, d.x), r = length(d);
  float ray = .5 + .5 * sin(a * 36.);
  float T = .06 + .16 * smoothstep(.2, .95, ray) * smoothstep(.12, .4, r) + .3 * smoothstep(.3, .85, r);
  float rays = a / 6.2832 * 520.;
  if (r < .34) { T = .05 + .2 * smoothstep(.12, .34, r); return Px(T, vec3(r * K() * 1.15, rays, (uv.x * .6 - uv.y) * K())); }
  return Px(T, vec3(rays, r * K() * 1.1, (uv.x * .6 - uv.y) * K()));
}

Px paint(vec2 uv) {
  // floor in perspective
  if (uv.y > .9) {
    float z = (uv.x - CX) / (uv.y - .62);
    float plank = fract(z * 4.);
    float T = .42 + .2 * smoothstep(.9, 1., uv.y) + .14 * smoothstep(.02, 0., min(plank, 1. - plank)) + .06 * noise2(vec2(z * 30., uv.y * 60.));
    return Px(T, vec3(uv.y * K() * 1.2 + .15 * noise2(vec2(z * 8., uv.y * 30.)), z * 26., (uv.x + uv.y) * K()));
  }
  // timber posts holding the yoke
  for (int i = 0; i < 2; i++) {
    float px = i == 0 ? CX - .37 : CX + .37;
    if (abs(uv.x - px) < .022 && uv.y > .14) {
      float s = (uv.x - px) / .022;
      float T = .45 + .35 * smoothstep(.2, -1., s) + .12 * noise2(vec2(uv.x * 400., uv.y * 8.));
      return Px(T, vec3((uv.x + .002 * noise2(vec2(uv.y * 30., 1.))) * K() * 1.3, uv.y * K(), (uv.x - uv.y) * K()));
    }
  }
  // the yoke beam
  if (uv.y > .14 && uv.y < .235 && abs(uv.x - CX) < .4) {
    float t = (uv.y - .14) / .095;
    float T = .36 + .4 * smoothstep(.35, 1., t) + .1 * noise2(vec2(uv.x * 3., uv.y * 90.));
    bool strap = abs(abs(uv.x - CX) - .07) < .008;
    if (strap) T = .78 - .25 * smoothstep(.5, 0., t);
    float grain = (uv.y + .006 * sin(uv.x * 30.) + .004 * noise2(vec2(uv.x * 8., uv.y * 40.))) * K() * 1.2;
    return Px(T, vec3(grain, (uv.x * .8 + uv.y) * K(), (uv.x * .8 - uv.y) * K()));
  }
  // crown straps joining bell and yoke
  if (uv.y > .225 && uv.y < VT + .02 && abs(uv.x - CX) < .05) {
    float s = (uv.x - CX) / .05;
    float T = .55 + .3 * smoothstep(.3, -1., s);
    return Px(T, vec3((uv.x - CX) * K() * 1.3, uv.y * K(), (uv.x + uv.y) * K()));
  }
  // bell mouth: dark interior with the clapper
  float R = bellR(uv.y);
  float lip = VB + .004;
  vec2 m = vec2((uv.x - CX) / bellR(VB), (uv.y - lip) / .036);
  if (length(m) < 1. && uv.y > lip - .002) {
    float T = .9;
    if (abs(uv.x - CX + .01) < .014 && uv.y < lip + .03) T = .6;
    return Px(T, vec3(uv.y * K() * 1.2, (uv.x + uv.y) * K(), (uv.x - uv.y) * K()));
  }
  // the bell
  if (uv.y > VT - .01 && uv.y < VB && abs(uv.x - CX) < R) {
    float nx = (uv.x - CX) / R;
    float th = asin(clamp(nx, -1., 1.));
    float slope = (bellR(uv.y + .002) - bellR(uv.y - .002)) / .004;
    vec3 n = normalize(vec3(nx, slope * .6 * cos(th), cos(th)));
    float dif = max(dot(n, L), 0.);
    float spec = pow(max(dot(reflect(-L, n), vec3(0, 0, 1)), 0.), 14.);
    float t = (uv.y - VT) / (VB - VT);
    float streak = smoothstep(.16, 0., abs(nx - .38)) * .3 + smoothstep(.06, 0., abs(nx + .55)) * .12;
    float T = 1. - (.1 + .6 * dif + .1 * spec + streak);
    T += .18 * smoothstep(.7, 1., abs(nx));
    // raised bands and the inscription
    float band = smoothstep(.006, 0., abs(t - .12)) + smoothstep(.006, 0., abs(t - .25)) + smoothstep(.008, 0., abs(t - .88)) + smoothstep(.008, 0., abs(t - .955));
    T = mix(T, T * .6 + .35, clamp(band, 0., 1.));
    if (t > .135 && t < .235) {
      vec2 g = vec2(th * 26., (t - .135) / .1 * 2.);
      float glyph = step(.25, hash12(floor(g * vec2(1., 1.))));
      float stroke = step(.35, fract(g.x)) * step(.15, fract(g.y)) * step(fract(g.y), .85);
      T += .3 * glyph * (1. - stroke) * smoothstep(.95, .6, abs(nx));
    }
    // the crack: a jagged dark line rising from the lip
    float cx = -.24 + .05 * noise2(vec2(t * 18., 3.)) + .02 * noise2(vec2(t * 70., 1.));
    float crack = smoothstep(.022, .008, abs(nx - cx)) * smoothstep(.42, .55, t);
    T = mix(T, .97, crack);
    float ring = (uv.y - .04 * R * cos(th)) * K() * 1.1;
    return Px(T, vec3(ring, th * R * K() * 1.2, (uv.x * .7 + uv.y * .7) * K()));
  }
  return sunburst(uv);
}
