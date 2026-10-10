// ---------- painted-layer renderer: the scene returns tone and line fields per pixel ----------
float lineCov(float phi, float aa, float w) {
  if (w <= .002) return 0.;
  if (aa > .42) return w;
  float d = abs(fract(phi) - .5);
  return clamp((w * .5 - d) / aa + .5, 0., 1.);
}
void main() {
  vec2 fc = gl_FragCoord.xy;
  gSc = vec2(fc.x, uRes.y - fc.y);
  vec2 uv = gSc / uRes.y;           // u: 0..aspect, v: 0 (top)..1 (bottom)
  Px s = paint(uv);
  float T = clamp(s.T, 0., 1.);
  vec3 aa = fwidth(s.ph);
  float w1 = T < .03 ? 0. : clamp(.06 + T * 1.05, 0., .86);
  float w2 = clamp((T - .45) * 1.35, 0., .7);
  float w3 = clamp((T - .76) * 1.9, 0., .6);
  float c = lineCov(s.ph.x, aa.x, w1);
  c = 1. - (1. - c) * (1. - lineCov(s.ph.y, aa.y, w2));
  c = 1. - (1. - c) * (1. - lineCov(s.ph.z, aa.z, w3));
  outColor = vec4(uInk * c, c);
}
