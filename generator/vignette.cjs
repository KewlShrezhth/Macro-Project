// Renders an engraved vignette: node vignette.cjs <scene> <width> <height> <linePeriodPx> <inkHex> <out.png>
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
module.exports = async function renderVignette(browser, { scene, w, h, lpx, ink, out, image }) {
  const dir = path.join(__dirname, "vignettes");
  const main = fs.readFileSync(path.join(dir, scene + ".glsl"), "utf8").includes("Px paint(") ? "main2d.glsl" : "main.glsl";
  const src = ["common.glsl", scene + ".glsl", main].map(f => fs.readFileSync(path.join(dir, f), "utf8")).join("\n");
  const page = await browser.newPage();
  page.on("console", m => { if (!/GPU stall|swiftshader|GroupMarker/i.test(m.text())) console.log("  gl:", m.text()); });
  const t0 = Date.now();
  const imgData = image ? "data:image/png;base64," + fs.readFileSync(image).toString("base64") : null;
  const data = await page.evaluate(async ({ src, w, h, lpx, ink, imgData }) => {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const gl = c.getContext("webgl2", { preserveDrawingBuffer: true, premultipliedAlpha: true, antialias: false });
    const vs = `#version 300 es\nin vec2 p; void main(){ gl_Position = vec4(p,0,1); }`;
    const mk = (type, s) => { const sh = gl.createShader(type); gl.shaderSource(sh, s); gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)); return sh; };
    const prog = gl.createProgram();
    gl.attachShader(prog, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, mk(gl.FRAGMENT_SHADER, src)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(gl.getUniformLocation(prog, "uRes"), w, h);
    gl.uniform1f(gl.getUniformLocation(prog, "uLpx"), lpx);
    const n = parseInt(ink.slice(1), 16);
    gl.uniform3f(gl.getUniformLocation(prog, "uInk"), (n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
    if (imgData) {
      const im = new Image(); im.src = imgData; await im.decode();
      const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.uniform1i(gl.getUniformLocation(prog, "uImg"), 0);
    }
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.SCISSOR_TEST);
    const TS = 160;
    for (let y = 0; y < h; y += TS) for (let x = 0; x < w; x += TS) {
      gl.scissor(x, y, TS, TS); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
      await new Promise(r => setTimeout(r, 0));
    }
    return c.toDataURL("image/png");
  }, { src, w, h, lpx, ink, imgData });
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, Buffer.from(data.split(",")[1], "base64"));
  await page.close();
  console.log(`vignette ${scene} ${w}x${h} in ${((Date.now() - t0) / 1000).toFixed(1)}s -> ${path.basename(out)}`);
};
if (require.main === module) {
  (async () => {
    const [scene, w, h, lpx, ink, out, image] = process.argv.slice(2);
    const browser = await chromium.launch();
    try { await module.exports(browser, { scene, w: +w, h: +h, lpx: +lpx, ink: ink || "#16302f", out, image }); }
    catch (e) { console.error(e.message); process.exitCode = 1; }
    await browser.close();
  })();
}
