"""
Genera íconos e imagen para redes a partir de assets/img/logo-patopatata.png.

    python tools/icons.py

Salida en assets/img/:
  favicon-32.png, favicon-192.png   solo el personaje, fondo transparente
  apple-touch-icon.png              180px, personaje sobre amarillo (iOS no admite transparencia)
  og-image.jpg                      1200x630 para WhatsApp/Instagram/Facebook al compartir el link
"""
from pathlib import Path

from PIL import Image

IMG = Path(__file__).resolve().parent.parent / "assets" / "img"
YELLOW = (249, 217, 72, 255)
CHARACTER_FROM_X = 0.52   # el personaje empieza a ~52% del ancho del logo

logo = Image.open(IMG / "logo-patopatata.png").convert("RGBA")
char = logo.crop((int(logo.width * CHARACTER_FROM_X), 0, logo.width, logo.height))
char = char.crop(char.getchannel("A").getbbox())


def square(img, size, pad, bg=(0, 0, 0, 0)):
    canvas = Image.new("RGBA", (size, size), bg)
    inner = size - 2 * pad
    scale = inner / max(img.width, img.height)
    im = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
    canvas.alpha_composite(im, ((size - im.width) // 2, (size - im.height) // 2))
    return canvas


square(char, 32, 1).save(IMG / "favicon-32.png", optimize=True)
square(char, 192, 8).save(IMG / "favicon-192.png", optimize=True)
square(char, 180, 18, YELLOW).convert("RGB").save(IMG / "apple-touch-icon.png", optimize=True)

og = Image.new("RGBA", (1200, 630), YELLOW)
w = 980
im = logo.resize((w, round(logo.height * w / logo.width)), Image.LANCZOS)
og.alpha_composite(im, ((1200 - im.width) // 2, (630 - im.height) // 2))
og.convert("RGB").save(IMG / "og-image.jpg", quality=88, optimize=True)

for f in ["favicon-32.png", "favicon-192.png", "apple-touch-icon.png", "og-image.jpg"]:
    print(f, f"{(IMG / f).stat().st_size / 1024:.0f} KB")
