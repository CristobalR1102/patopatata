"""
Recorta las papas con carita (generadas con IA sobre fondo blanco) en archivos separados.

    python tools/fries_cutout.py tools/fries-ia-fuente.png

Salida: tools/fries/fry-1.webp ... fry-N.webp (fondo transparente, ordenadas de izquierda a derecha)
graffiti.py las incrusta dentro de los SVG del grafiti.
Requiere: pip install pillow numpy scipy
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

OUT = Path(__file__).resolve().parent / "fries"
HEIGHT = 260   # px de alto de cada papa (se muestran a ~130px, así quedan nítidas en pantallas retina)

rgb = np.asarray(Image.open(sys.argv[1]).convert("RGB")).astype(np.int16)
mn, mx = rgb.min(axis=2), rgb.max(axis=2)
white = (mn >= 225) & ((mx - mn) <= 30)

# Fondo = blanco conectado con los bordes
labels, _ = ndimage.label(white)
edge_labels = set(np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))) - {0}
bg = np.isin(labels, list(edge_labels))
bg = ndimage.binary_dilation(bg, iterations=1)
alpha = ndimage.gaussian_filter((~bg).astype(np.float32), 0.8)
alpha = np.clip((alpha - 0.2) / 0.6, 0, 1)

# Cada papa es un componente conectado grande
solid = alpha > 0.5
comp, n = ndimage.label(solid)
sizes = ndimage.sum(solid, comp, index=np.arange(1, n + 1))
boxes = ndimage.find_objects(comp)
fries = sorted((boxes[i] for i in range(n) if sizes[i] > 2000), key=lambda b: b[1].start)

OUT.mkdir(exist_ok=True)
rgba = np.dstack([rgb.astype(np.uint8), (alpha * 255).astype(np.uint8)])
for i, (ys, xs) in enumerate(fries, 1):
    pad = 4
    crop = rgba[max(0, ys.start - pad):ys.stop + pad, max(0, xs.start - pad):xs.stop + pad]
    img = Image.fromarray(crop, "RGBA")
    img = img.resize((round(img.width * HEIGHT / img.height), HEIGHT), Image.LANCZOS)
    path = OUT / f"fry-{i}.webp"
    img.save(path, "WEBP", quality=90, method=6)
    print(path.name, img.size, f"{path.stat().st_size / 1024:.1f} KB")
