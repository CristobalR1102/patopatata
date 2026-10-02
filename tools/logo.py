"""
Recorta el fondo blanco del logo y lo vectoriza.

    python tools/logo.py

Entrada:  assets/img/logopatopatata.jpg (150x150, fondo blanco)
Salida:   assets/img/logo-patopatata.svg  (vector, fondo transparente)
          assets/img/logo-patopatata.png  (1200px, fondo transparente, para redes/og:image)

Requiere: pip install pillow vtracer
"""
from collections import deque
from pathlib import Path

import vtracer
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent / "assets" / "img"
SRC = ROOT / "logopatopatata.jpg"
SCALE = 8            # 150px -> 1200px antes de vectorizar
WHITE_TOL = 42       # qué tan "casi blanco" cuenta como fondo


def upscale(img):
    big = img.resize((img.width * SCALE, img.height * SCALE), Image.LANCZOS)
    # Suaviza artefactos JPEG y re-afila los bordes
    return big.filter(ImageFilter.MedianFilter(5)).filter(ImageFilter.UnsharpMask(radius=3, percent=120, threshold=3))


def remove_background(img):
    """Relleno por inundación desde los bordes: solo el blanco conectado al exterior se vuelve transparente,
    así los brillos blancos dentro del dibujo se conservan."""
    img = img.convert("RGBA")
    px = img.load()
    w, h = img.size
    is_bg = lambda p: min(p[:3]) >= 255 - WHITE_TOL
    seen = bytearray(w * h)
    q = deque()
    for x in range(w):
        q.extend([(x, 0), (x, h - 1)])
    for y in range(h):
        q.extend([(0, y), (w - 1, y)])
    while q:
        x, y = q.popleft()
        i = y * w + x
        if seen[i]:
            continue
        seen[i] = 1
        if not is_bg(px[x, y]):
            continue
        px[x, y] = (255, 255, 255, 0)
        if x > 0: q.append((x - 1, y))
        if x < w - 1: q.append((x + 1, y))
        if y > 0: q.append((x, y - 1))
        if y < h - 1: q.append((x, y + 1))
    return img


def crop_to_content(img, pad=12):
    bbox = img.getchannel("A").getbbox()
    x0, y0, x1, y1 = bbox
    return img.crop((max(0, x0 - pad), max(0, y0 - pad), min(img.width, x1 + pad), min(img.height, y1 + pad)))


if __name__ == "__main__":
    img = crop_to_content(remove_background(upscale(Image.open(SRC).convert("RGB"))))
    png_path = ROOT / "logo-patopatata.png"
    img.save(png_path, optimize=True)

    svg_path = ROOT / "logo-patopatata.svg"
    vtracer.convert_image_to_svg_py(
        str(png_path), str(svg_path),
        colormode="color", hierarchical="stacked", mode="spline",
        filter_speckle=24, color_precision=6, layer_difference=24,
        corner_threshold=60, length_threshold=4.0, splice_threshold=45, path_precision=2,
    )
    print(f"{png_path.name}: {img.size}, {png_path.stat().st_size / 1024:.0f} KB")
    print(f"{svg_path.name}: {svg_path.stat().st_size / 1024:.0f} KB")
