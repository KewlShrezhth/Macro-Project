"""Prepare source photos for engraving: isolate the sitter, frame to the vignette window (1.4:1),
put them on a graded engraver's backdrop, and boost local contrast. Run: python3 generator/portraits/prep.py"""
import os, numpy as np
from PIL import Image, ImageFilter, ImageOps, ImageDraw
from ai_edge_litert.interpreter import Interpreter

HERE = os.path.dirname(os.path.abspath(__file__))
SRC, OUT = os.path.join(HERE, "src"), HERE
MODEL = os.path.join(HERE, "..", "models", "selfie_multiclass.tflite")
ASPECT = 584 / 418      # landscape scenes (back vignettes)
OVAL = 296 / 370        # portrait ovals on the fronts
OUT_H = 900

seg = Interpreter(model_path=MODEL); seg.allocate_tensors()

def person_mask(img):
    """MediaPipe selfie-multiclass: channel 0 is background; everything else is the person.
    The photo is letterboxed to a square so the sitter is not distorted."""
    S = max(img.size); sq = Image.new("RGB", (S, S), (128, 128, 128)); ox, oy = (S - img.width) // 2, (S - img.height) // 2
    sq.paste(img.convert("RGB"), (ox, oy))
    x = np.asarray(sq.resize((256, 256), Image.BILINEAR), dtype=np.float32)[None] / 255.
    seg.set_tensor(seg.get_input_details()[0]["index"], x); seg.invoke()
    out = seg.get_tensor(seg.get_output_details()[0]["index"])[0]
    e = np.exp(out - out.max(-1, keepdims=True)); prob = e / e.sum(-1, keepdims=True)
    bg = prob[..., 0]
    p = np.clip(((1 - bg) - .35) / .3, 0, 1)
    m = Image.fromarray((p * 255).astype("uint8")).resize((S, S), Image.BILINEAR).crop((ox, oy, ox + img.width, oy + img.height))
    return m.filter(ImageFilter.GaussianBlur(1.2))

def backdrop(w, h, centre=(.5, .3)):
    """Engraver's portrait ground: mid-dark, a little lighter behind the head."""
    y, x = np.mgrid[0:h, 0:w][0] / h, np.mgrid[0:h, 0:w][1] / h
    d = np.sqrt((x - centre[0] * w / h) ** 2 + (y - centre[1]) ** 2)
    lum = np.clip(.62 - .45 * d, .3, .62)
    return Image.fromarray((lum * 255).astype("uint8"))

def frame(img, box, pad_bg=None, aspect=ASPECT):
    """box = (cx, top, height) in source px; returns crop at the given aspect, padding with pad_bg outside the source."""
    cx, top, hgt = box
    wid = hgt * aspect
    x0, y0 = int(round(cx - wid / 2)), int(round(top))
    canvas = Image.new(img.mode, (int(round(wid)), int(round(hgt))), pad_bg)
    canvas.paste(img, (-x0, -y0))
    return canvas

def tone(gray, amount=1.0):
    gray = ImageOps.autocontrast(gray, cutoff=1)
    return gray.filter(ImageFilter.UnsharpMask(radius=max(2, gray.height // 60), percent=int(90 * amount), threshold=0))

def person(name, box, blur=0.0, centre=(.5, .38), dark_in=None, not_white=False, keep_x=None):
    """dark_in: polygon (source px) inside which dark pixels count as the sitter (dark suits the model misses).
    not_white: studio shot on white, so any pixel that is not near-white is the sitter."""
    img = Image.open(os.path.join(SRC, name)).convert("RGB")
    g = img.convert("L")
    if blur: g = g.filter(ImageFilter.GaussianBlur(blur))
    m = person_mask(img)
    a = np.asarray(g, dtype=np.float32)
    extra = np.zeros_like(a)
    if dark_in:
        poly = Image.new("L", img.size, 0); ImageDraw.Draw(poly).polygon(dark_in, fill=255)
        extra = np.maximum(extra, (np.asarray(poly) > 0) * np.clip((120 - a) / 40, 0, 1))
    if not_white:
        extra = np.maximum(extra, np.clip((238 - a) / 20, 0, 1))
    if dark_in or not_white:
        e = Image.fromarray((extra * 255).astype("uint8")).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.GaussianBlur(1))
        m = Image.fromarray(np.maximum(np.asarray(m), np.asarray(e)))
    if keep_x:   # drop stray background pieces outside the sitter's horizontal span
        ma = np.asarray(m).copy(); ma[:, :keep_x[0]] = 0; ma[:, keep_x[1]:] = 0; m = Image.fromarray(ma)
    g, m = frame(g, box, 0, OVAL), frame(m, box, 0, OVAL)
    size = (int(OUT_H * OVAL), OUT_H)
    g, m = g.resize(size, Image.LANCZOS), m.resize(size, Image.LANCZOS)
    g = tone(g)
    out = Image.composite(g, backdrop(*g.size, centre), m)
    return out

def oval(name, cx, cy, rx, ry, blur):
    """Cut an oval engraving out of a scan and set it centred on the backdrop."""
    img = Image.open(os.path.join(SRC, name)).convert("L").filter(ImageFilter.GaussianBlur(blur))
    hgt = ry * 2 * 1.02
    g = frame(img, (cx, cy - hgt / 2, hgt), 0, OVAL)
    m = Image.new("L", g.size, 0)
    ImageDraw.Draw(m).ellipse([g.width / 2 - rx, g.height / 2 - ry, g.width / 2 + rx, g.height / 2 + ry], fill=255)
    m = m.filter(ImageFilter.GaussianBlur(3))
    size = (int(OUT_H * OVAL), OUT_H)
    g, m = tone(g.resize(size, Image.LANCZOS), .6), m.resize(size, Image.LANCZOS)
    return Image.composite(g, backdrop(*size, (.5, .5)), m)

def scene(name, box, blur=.6, gamma=.6):
    img = Image.open(os.path.join(SRC, name)).convert("L").filter(ImageFilter.GaussianBlur(blur))
    g = frame(img, box, 128).resize((int(OUT_H * ASPECT), OUT_H), Image.LANCZOS)
    g = tone(g, .5)
    return g.point(lambda v: int(255 * (v / 255) ** gamma))     # dark oil painting -> open up the shadows

jobs_src = Image.open(os.path.join(SRC, "jobs.png"))
outputs = {
    "one-front": oval("washington-bill.png", 341, 163, 63, 81, .7),
    "one-back": scene("delaware.png", (380, 0, 422)),
    "five-front": person("hill.png", (186, 74, 250)),
    "ten-front": person("jobs.png", (180, 0, 411), not_white=True),
    "hundred-front": person("dicaprio.png", (229, 138, 330), keep_x=(110, 340)),
    "fifty-front": person("drake.png", (370, 15, 370), dark_in=[(300, 185), (250, 210), (228, 300), (222, 452), (482, 452), (472, 300), (452, 210), (405, 185)], keep_x=(215, 495)),
}
for k, im in outputs.items():
    im.save(os.path.join(OUT, k + ".png")); print("prepared", k, im.size)
