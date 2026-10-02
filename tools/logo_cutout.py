"""
Quita el fondo de cuadros (dibujado por la IA) del logo en alta resolución.

    python tools/logo_cutout.py <imagen-de-entrada>

Salida: assets/img/logo-patopatata.png (fondo transparente, recortado al contenido)

Criterio: un píxel es "fondo" si es claro y casi sin color (blanco/gris del patrón).
Se eliminan las zonas de fondo grandes (exterior y huecos de letras); las zonas
pequeñas (brillos de los ojos) se conservan.
Requiere: pip install pillow numpy scipy
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

OUT = Path(__file__).resolve().parent.parent / "assets" / "img" / "logo-patopatata.png"
MIN_HOLE = 400        # px: zonas de fondo menores a esto se conservan (brillos)
MAX_WIDTH = 1200
TEXT_ZONE_X = 0.585  # fracción del ancho donde termina el texto "PATATA"

src = Image.open(sys.argv[1]).convert("RGB")
rgb = np.asarray(src).astype(np.int16)
mx, mn = rgb.max(axis=2), rgb.min(axis=2)
bg_like = (mn >= 175) & ((mx - mn) <= 22)

labels, n = ndimage.label(bg_like)
sizes = ndimage.sum(bg_like, labels, index=np.arange(1, n + 1))
# En la zona del texto (izquierda) se quita cualquier hueco, incluso los triángulos de las "A";
# en la zona del personaje solo los grandes, para conservar los brillos de los ojos.
cx = ndimage.center_of_mass(bg_like, labels, index=np.arange(1, n + 1))
text_zone = np.array([c[1] < TEXT_ZONE_X * rgb.shape[1] for c in cx])
remove = np.zeros(n + 1, dtype=bool)
remove[1:] = (sizes >= MIN_HOLE) | (text_zone & (sizes >= 15))
bg = remove[labels]

# Borde suave: dilata 1px el fondo para comerse el halo claro y difumina el canal alfa
bg = ndimage.binary_dilation(bg, iterations=1)
alpha = (~bg).astype(np.float32)
alpha = ndimage.gaussian_filter(alpha, 0.7)
alpha = np.clip((alpha - 0.15) / 0.7, 0, 1)

rgba = np.dstack([rgb.astype(np.uint8), (alpha * 255).astype(np.uint8)])
img = Image.fromarray(rgba, "RGBA")

# Limpia manchas sueltas: solo conserva los componentes grandes (texto + personaje)
solid = np.asarray(img)[..., 3] > 128
lab2, n2 = ndimage.label(solid)
sz2 = ndimage.sum(solid, lab2, index=np.arange(1, n2 + 1))
keep = np.zeros(n2 + 1, dtype=bool)
keep[1:] = sz2 >= 150
keep_mask = ndimage.binary_dilation(keep[lab2], iterations=2)
a = np.asarray(img).copy()
a[..., 3] = np.where(keep_mask, a[..., 3], 0)
img = Image.fromarray(a, "RGBA")

img = img.crop(img.getchannel("A").getbbox())
if img.width > MAX_WIDTH:
    img = img.resize((MAX_WIDTH, round(img.height * MAX_WIDTH / img.width)), Image.LANCZOS)
img.save(OUT, optimize=True)
print(f"{OUT.name}: {img.size}, {OUT.stat().st_size / 1024:.0f} KB")
