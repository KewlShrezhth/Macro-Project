// Portrait engraving: tone from the photograph, lines displaced by its blurred light so they wrap the face.
uniform sampler2D uImg;
Px paint(vec2 uv) {
  vec2 st = vec2(uv.x / aspect(), uv.y);
  float lum = texture(uImg, st).r;
  float soft = textureLod(uImg, st, 4.).r;     // blurred light field: lines bend over the forms
  float mid = textureLod(uImg, st, 2.5).r;
  float T = 1. - lum;
  T = smoothstep(.02, .98, T);
  float bend = soft * .045 + mid * .012;
  return Px(T, vec3((uv.y + bend) * K() * 1.05,
                    ((uv.x * .55 + uv.y * .83) + bend * .8) * K() * 1.05,
                    ((-uv.x * .55 + uv.y * .83) + bend * .8) * K() * 1.1));
}
