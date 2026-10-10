#version 300 es
precision highp float;
uniform vec2 uRes;      // full image size in px
uniform float uLpx;     // engraving line period in px
uniform vec3 uInk;
out vec4 outColor;

#define PI 3.14159265

float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float hash13(vec3 p3) { p3 = fract(p3 * .1031); p3 += dot(p3, p3.zyx + 31.32); return fract((p3.x + p3.y) * p3.z); }
vec2 hash22(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
float noise2(vec2 x) {
  vec2 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f);
  return mix(mix(hash12(i), hash12(i + vec2(1, 0)), f.x), mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), f.x), f.y) * 2. - 1.;
}
float noise3(vec3 x) {
  vec3 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f);
  return mix(mix(mix(hash13(i), hash13(i + vec3(1, 0, 0)), f.x), mix(hash13(i + vec3(0, 1, 0)), hash13(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(hash13(i + vec3(0, 0, 1)), hash13(i + vec3(1, 0, 1)), f.x), mix(hash13(i + vec3(0, 1, 1)), hash13(i + vec3(1, 1, 1)), f.x), f.y), f.z) * 2. - 1.;
}
float fbm2(vec2 p, int oct) { float a = .5, s = 0.; for (int i = 0; i < 9; i++) { if (i >= oct) break; s += a * noise2(p); p = mat2(1.6, 1.2, -1.2, 1.6) * p + 3.1; a *= .5; } return s; }
float fbm3(vec3 p, int oct) { float a = .5, s = 0.; for (int i = 0; i < 8; i++) { if (i >= oct) break; s += a * noise3(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= .5; } return s; }
float ridged2(vec2 p, int oct) { float a = .5, s = 0.; for (int i = 0; i < 9; i++) { if (i >= oct) break; s += a * (1. - abs(noise2(p))); p = mat2(1.6, 1.2, -1.2, 1.6) * p + 1.7; a *= .5; } return s; }

float smin(float a, float b, float k) { float h = clamp(.5 + .5 * (b - a) / k, 0., 1.); return mix(b, a, h) - k * h * (1. - h); }
float smax(float a, float b, float k) { return -smin(-a, -b, k); }
float sdBox(vec3 p, vec3 b) { vec3 q = abs(p) - b; return length(max(q, 0.)) + min(max(q.x, max(q.y, q.z)), 0.); }
float sdEllipsoid(vec3 p, vec3 r) { float k0 = length(p / r), k1 = length(p / (r * r)); return k0 * (k0 - 1.) / k1; }
float sdCylY(vec3 p, float r, float h) { vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h); return min(max(d.x, d.y), 0.) + length(max(d, 0.)); }
float sdCapsule(vec3 p, vec3 a, vec3 b, float r) { vec3 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0., 1.); return length(pa - ba * h) - r; }
float sdTorus(vec3 p, vec2 t) { vec2 q = vec2(length(p.xz) - t.x, p.y); return length(q) - t.y; }
// cone with apex up: base radius r at y=0, height h
float sdConeY(vec3 p, float r, float h) {
  vec2 q = vec2(length(p.xz), p.y);
  vec2 k1 = vec2(0., h), k2 = vec2(-r, h);
  vec2 ca = vec2(q.x - min(q.x, q.y < 0. ? r : 0.), abs(q.y - h * .5) - h * .5);
  vec2 cb = q - k1 + k2 * clamp(dot(k1 - q, k2) / dot(k2, k2), 0., 1.);
  float s = (cb.x < 0. && ca.y < 0.) ? -1. : 1.;
  return s * sqrt(min(dot(ca, ca), dot(cb, cb)));
}

// --- engraving state shared with the scene ---
vec3 gRo, gWw, gUu, gVv; float gF;
vec2 gSc; // screen position in px, origin top-left
// world -> screen y (px, top-left origin)
vec2 toScreen(vec3 p) { vec3 d = p - gRo; float z = dot(d, gWw); return vec2(.5 * uRes.x + gF * dot(d, gUu) / z, .5 * uRes.y - gF * dot(d, gVv) / z); }
float zOf(vec3 p) { return dot(p - gRo, gWw); }

struct Px { float T; vec3 ph; };
float K() { return uRes.y / uLpx; }      // line periods per unit of v
float aspect() { return uRes.x / uRes.y; }
