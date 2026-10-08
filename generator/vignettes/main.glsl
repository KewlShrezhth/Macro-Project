// ---------- generic renderer: march, light, haze, engrave ----------
#ifndef MAXSTEPS
#define MAXSTEPS 260
#endif
#ifndef STEPK
#define STEPK 0.8
#endif
vec3 calcNormal(vec3 p, float t) {
  float e = max(.002, .0007 * t);
  vec2 k = vec2(1, -1);
  return normalize(k.xyy * scene(p + k.xyy * e).x + k.yyx * scene(p + k.yyx * e).x + k.yxy * scene(p + k.yxy * e).x + k.xxx * scene(p + k.xxx * e).x);
}
float softShadow(vec3 ro, vec3 rd, float k, float tmax) {
  float res = 1., t = .05;
  for (int i = 0; i < 90; i++) { float h = scene(ro + rd * t).x; res = min(res, k * h / t); t += clamp(h, .05, 6.); if (res < .002 || t > tmax) break; }
  return clamp(res, 0., 1.);
}
float calcAO(vec3 p, vec3 n, float s) {
  float occ = 0., sca = 1.;
  for (int i = 0; i < 5; i++) { float h = s * (.02 + .16 * float(i)); occ += (h - scene(p + h * n).x) * sca; sca *= .7; }
  return clamp(1. - 2.2 * occ / s, 0., 1.);
}
vec2 march(vec3 ro, vec3 rd, float tmax) {
  float t = .05; float m = -1.;
  for (int i = 0; i < MAXSTEPS; i++) {
    vec2 h = scene(ro + rd * t);
    if (abs(h.x) < .0008 * t) { m = h.y; break; }
    t += h.x * STEPK;
    if (t > tmax) break;
  }
  return vec2(t, m);
}
// brightness (0 black .. 1 white) of a surface point, before haze
float shadeAt(vec3 p, vec3 n, float m, float t) {
  float sh = softShadow(p + n * .02 * max(1., t * .01), LIGHT, 10., 400.);
  float dif = clamp(dot(n, LIGHT), 0., 1.) * sh;
  float ao = calcAO(p, n, aoScale(m));
  float amb = (.32 + .22 * n.y) * ao;
  return albedo(m, p, n) * (amb + 1.05 * dif);
}
float lineCov(float phi, float aa, float w) {
  if (w <= .002) return 0.;
  if (aa > .42) return w;
  float d = abs(fract(phi) - .5);
  return clamp((w * .5 - d) / aa + .5, 0., 1.);
}
void main() {
  vec2 fc = gl_FragCoord.xy;
  gSc = vec2(fc.x, uRes.y - fc.y);
  vec3 ta; float fov; cameraSetup(gRo, ta, fov);
  gWw = normalize(ta - gRo); gUu = normalize(cross(gWw, vec3(0, 1, 0))); gVv = cross(gUu, gWw);
  gF = .5 * uRes.y / tan(radians(fov) * .5);
  vec2 q = fc - .5 * uRes;
  vec3 rd = normalize(q.x * gUu + q.y * gVv + gF * gWw);

  vec2 hit = march(gRo, rd, MAXD);
  float T; vec3 ph; float m = hit.y;
  if (m < 0.) {
    T = skyTone(rd);
    ph = skyFields(rd);
  } else {
    vec3 p = gRo + rd * hit.x;
    vec3 n = calcNormal(p, hit.x);
    float z = zOf(p);
    float b;
    if (m > 3.5 && m < 4.5) {               // water: one reflection bounce
      vec3 r = reflect(rd, vec3(0, 1, 0));
      vec2 h2 = march(p + vec3(0, .05, 0), r, MAXD);
      float rb;
      if (h2.y < 0.) rb = 1. - skyTone(r);
      else { vec3 p2 = p + r * h2.x; vec3 n2 = calcNormal(p2, h2.x); rb = shadeAt(p2, n2, h2.y, h2.x); rb = mix(rb, hazeBright(), 1. - exp(-(z + h2.x) * FOGK)); }
      b = waterBright(rb, p);
    } else {
      b = shadeAt(p, n, m, hit.x);
    }
    b = mix(b, hazeBright(), 1. - exp(-z * FOGK));
    T = 1. - b;
    ph = matFields(m, p, n, z);
  }
  T = clamp(toneCurve(T), 0., 1.);
  vec3 aa = fwidth(ph);
  float w1 = T < .035 ? 0. : clamp(.07 + T * 1.05, 0., .86);
  float w2 = clamp((T - .42) * 1.35, 0., .72);
  float w3 = clamp((T - .74) * 1.9, 0., .62);
  float c = lineCov(ph.x, aa.x, w1);
  c = 1. - (1. - c) * (1. - lineCov(ph.y, aa.y, w2));
  c = 1. - (1. - c) * (1. - lineCov(ph.z, aa.z, w3));
  outColor = vec4(uInk * c, c);
}
