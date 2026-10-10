// $5 front: "Monument Buttes" - sandstone buttes at sunset with a road leading in.
const vec3 L = normalize(vec3(-.7, .35, .6));   // low sun from the left

// a butte: flat top at vTop, cliff to vCliff, talus to vBase, spanning [x0,x1] at the top
bool butte(vec2 uv, float x0, float x1, float vTop, float vCliff, float vBase, float seed, float haze, out Px px) {
  if (uv.y < vTop - .01 || uv.y > vBase) return false;
  float topEdge = vTop + .006 * noise2(vec2(uv.x * 40., seed));
  if (uv.y < topEdge) return false;
  float t = clamp((uv.y - vCliff) / (vBase - vCliff), 0., 1.);
  float spread = (x1 - x0) * .32 * pow(t, .8);
  float jag = .008 * noise2(vec2(uv.y * 60., seed)) + .004 * noise2(vec2(uv.y * 200., seed + 1.));
  float l = x0 - spread + jag, r = x1 + spread - jag * .7;
  if (uv.x < l || uv.x > r) return false;
  float c = (l + r) * .5, hw = (r - l) * .5;
  float s = (uv.x - c) / hw;
  float T;
  vec3 ph;
  if (uv.y < vCliff) {
    // vertical cliff: lit on the left, flutes and strata
    float edge = .15 + .1 * noise2(vec2(uv.y * 8., seed));
    float dif = s < edge ? .78 - .15 * smoothstep(-1., edge, s) : .18 + .08 * smoothstep(1., edge, s);
    float flute = ridged2(vec2(uv.x * 90., uv.y * 6. + seed), 4);
    T = 1. - (.15 + .75 * dif) + .2 * smoothstep(.6, .95, flute) + .08 * smoothstep(.45, .55, fract(uv.y * 40. + .3 * noise2(vec2(uv.x * 10., seed))));
    T += .12 * smoothstep(vTop + .02, vTop, uv.y) * 0.;
    ph = vec3((uv.x + .003 * noise2(vec2(uv.y * 30., seed))) * K() * 1.2, uv.y * K() * 1.1, (uv.x - uv.y) * K());
  } else {
    // talus: fanning flow lines, gullies
    vec3 n = normalize(vec3(s * .9, .5, 1.));
    float dif = max(dot(n, L), 0.);
    float gully = ridged2(vec2(atan(uv.x - c, uv.y - vCliff + .05) * 12., t * 2. + seed), 4);
    T = 1. - (.2 + .7 * dif) + .18 * smoothstep(.55, .95, gully);
    float fan = atan(uv.x - c, uv.y - vCliff + .08) * 140.;
    ph = vec3(fan, uv.y * K() * 1.1, (uv.x + uv.y) * K());
  }
  T = mix(T, .12, haze);
  px = Px(T, ph);
  return true;
}

Px paint(vec2 uv) {
  Px px;
  float horizon = .63;
  // desert floor with a road
  if (uv.y > horizon) {
    float z = (uv.y - horizon) / (1. - horizon);
    float roadC = .7 + .12 * sin(z * 3. + .5) * z - .05;
    float roadW = .006 + .09 * z * z;
    float road = smoothstep(roadW, roadW * .8, abs(uv.x - roadC));
    float brush = smoothstep(.45, .8, noise2(vec2(uv.x * 60. / (.15 + z), uv.y * 160. / (.15 + z))));
    float T = .24 + .34 * z + .3 * brush * (.3 + z) - .18 * road + .1 * smoothstep(roadW * 1.6, roadW, abs(uv.x - roadC)) * (1. - road);
    // dark rock ledge in the left foreground
    float ledge = .84 + .3 * smoothstep(.0, .5, uv.x) + .02 * noise2(vec2(uv.x * 30., 1.));
    if (uv.y > ledge) T = .7 + .15 * noise2(uv * vec2(40., 80.)) - .3 * smoothstep(ledge + .02, ledge, uv.y);
    return Px(T, vec3(uv.y * K() * 1.2 + .15 * noise2(uv * vec2(10., 30.)), (uv.x * .7 + uv.y) * K(), (-uv.x * .7 + uv.y) * K()));
  }
  if (butte(uv, .22, .52, .2, .53, .64, 1., 0., px)) return px;
  if (butte(uv, .9, 1.08, .27, .54, .64, 5., .08, px)) return px;
  if (butte(uv, 1.17, 1.2, .3, .55, .64, 9., .1, px)) return px;
  if (butte(uv, .63, .78, .42, .56, .64, 3., .42, px)) return px;
  if (butte(uv, 1.27, 1.45, .45, .57, .64, 7., .48, px)) return px;
  if (butte(uv, -.1, .1, .43, .56, .64, 11., .48, px)) return px;
  // distant mesa line
  float far = .58 - .02 * smoothstep(.3, .5, fbm2(vec2(uv.x * 3., 2.), 3));
  if (uv.y > far) return Px(.16 + .05 * noise2(uv * 50.), vec3(uv.y * K() * 1.2, uv.x * K(), 0.));
  // sunset sky with banded clouds
  float c = fbm2(vec2(uv.x * 1.6, uv.y * 9.) + 2., 6);
  float band = smoothstep(.0, .35, c) * smoothstep(.62, .1, uv.y);
  float T = mix(.42, .04, smoothstep(.05, .6, uv.y)) + .3 * band * (.6 + .4 * noise2(uv * vec2(4., 30.)));
  float sun = length((uv - vec2(.14, .5)) * vec2(1., 1.3));
  T *= smoothstep(.03, .16, sun);
  return Px(T, vec3(uv.y * K() * 1.15 + .25 * sin(uv.x * 6.), (uv.x * .5 + uv.y) * K(), (-uv.x * .5 + uv.y) * K()));
}
