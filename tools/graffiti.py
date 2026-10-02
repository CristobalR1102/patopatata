"""
Genera los fondos de grafiti de PatoPatata (inspirados en el mural del local).

    python tools/graffiti.py

Salida en assets/img/:
  graffiti-mobile.svg   hero en celular (vertical)
  graffiti-desktop.svg  hero en pantallas anchas (horizontal)
  graffiti-band.svg     franja que se repite en horizontal (antes del footer)

Todo es aleatorio con semilla fija: cambia SEED para otra composición.
"""
import base64
import math
import random
from pathlib import Path

SEED = 7
OUT = Path(__file__).resolve().parent.parent / "assets" / "img"

INK = "#141014"
C = {
    "blue": "#1AA0E0",
    "green": "#2FB344",
    "lime": "#63CB47",
    "magenta": "#C8187A",
    "purple": "#7A1F63",
    "pink": "#F04DA8",
    "gray": "#93A4BC",
    "white": "#F6F3EC",
    "mint": "#2FD39B",
    "red": "#D61E3C",
    "yellow": "#F9D948",
    "orange": "#FA8A2B",
}


def blob_path(cx, cy, r, rnd, n=8, wobble=0.28):
    """Mancha orgánica: puntos en círculo con radio variable, suavizados con Catmull-Rom."""
    pts = []
    for i in range(n):
        a = 2 * math.pi * i / n + rnd.uniform(-0.2, 0.2)
        rr = r * (1 + rnd.uniform(-wobble, wobble))
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    d = f"M{pts[0][0]:.1f} {pts[0][1]:.1f}"
    for i in range(n):
        p0, p1, p2, p3 = pts[i - 1], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d += f"C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {p2[0]:.1f} {p2[1]:.1f}"
    return d + "Z"


# Papas con carita dibujadas con IA (tools/fries/, generadas con tools/fries_cutout.py).
# Un SVG usado como imagen de fondo no puede cargar archivos externos, por eso van incrustadas en base64.
FRIES_DIR = Path(__file__).resolve().parent / "fries"
FRY_W, FRY_H = 58, 128
FRY_DEFS = "".join(
    f'<image id="fry-{i}" width="{FRY_W}" height="{FRY_H}" '
    f'href="data:image/webp;base64,{base64.b64encode((FRIES_DIR / f"fry-{i}.webp").read_bytes()).decode()}"/>'
    for i in range(1, 5)
)
HAPPY = ["fry-1", "fry-2", "fry-3"]   # sonrisa, guiño, lengua
X_EYES = "fry-4"

DEFS = f"""
<defs>
  <style>
    .bob {{ animation: bob 7s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }}
    @keyframes bob {{ 50% {{ transform: translateY(-10px) rotate(5deg); }} }}
    @media (prefers-reduced-motion: reduce) {{ .bob {{ animation: none; }} }}
  </style>
{FRY_DEFS}
</defs>"""


def fry(x, y, rot, scale, rnd, animate=True, variant="fry"):
    delay = rnd.uniform(0, 6)
    ref = X_EYES if variant == "fry-x" else rnd.choice(HAPPY)
    inner = f'<use href="#{ref}"/>'
    if animate:
        inner = f'<g class="bob" style="animation-delay:-{delay:.1f}s">{inner}</g>'
    return f'<g transform="translate({x} {y}) rotate({rot}) scale({scale * 1.3:.2f})">{inner}</g>'


def character(x, y, scale, body, look="front", flip=False):
    """Caja de papas con cara (los personajes rojo y verde del mural)."""
    fries = "".join(
        f'<g transform="translate({fx} {fy}) rotate({fr})"><use href="#{HAPPY[i % 3]}"/></g>'
        for i, (fx, fy, fr) in enumerate( [(-70, -150, -24), (-35, -185, -10), (0, -200, 2), (35, -185, 12), (68, -150, 24)])
    )
    if look == "front":
        eyes = f"""
        <ellipse cx="-38" cy="60" rx="26" ry="34" fill="{C['yellow']}" stroke="{INK}" stroke-width="7"/>
        <ellipse cx="38" cy="60" rx="26" ry="34" fill="{C['yellow']}" stroke="{INK}" stroke-width="7"/>
        <ellipse cx="-34" cy="66" rx="12" ry="18" fill="{INK}"/>
        <ellipse cx="34" cy="66" rx="12" ry="18" fill="{INK}"/>
        <path d="M-30 122q30 20 60 0" fill="none" stroke="{INK}" stroke-width="7" stroke-linecap="round"/>
        <path d="M-6 130q6 24 14 0Z" fill="{C['yellow']}" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/>"""
    else:
        eyes = f"""
        <ellipse cx="-30" cy="56" rx="30" ry="36" fill="{C['yellow']}" stroke="{INK}" stroke-width="7"/>
        <ellipse cx="36" cy="56" rx="30" ry="36" fill="{C['yellow']}" stroke="{INK}" stroke-width="7"/>
        <path d="M-58 56a28 30 0 0 0 44 20q-18-8-20-38Z" fill="{INK}"/>
        <path d="M8 56a28 30 0 0 0 44 20q-18-8-20-38Z" fill="{INK}"/>
        <path d="M-40 112q34 30 70 -6" fill="none" stroke="{INK}" stroke-width="7" stroke-linecap="round"/>"""
    body_d = "M-110 -10h220l-22 220h-176Z"
    flip_t = " scale(-1 1)" if flip else ""
    return f"""<g transform="translate({x} {y}) scale({scale}){flip_t}">
      <g transform="translate(-17 0)">{fries}</g>
      <path d="{body_d}" fill="{body}" stroke="{INK}" stroke-width="10" stroke-linejoin="round"/>
      <path d="M-86 10q-6 60 4 120" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="14" stroke-linecap="round"/>
      {eyes}
    </g>"""


def cloud(x, y, s, rnd):
    parts = "".join(
        f'<circle cx="{x + dx * s:.0f}" cy="{y + dy * s:.0f}" r="{r * s:.0f}"/>'
        for dx, dy, r in [(0, 0, 60), (70, -20, 70), (140, 10, 55), (60, 40, 60)]
    )
    return (f'<g fill="{C["white"]}" stroke="{INK}" stroke-width="10">{parts}</g>'
            f'<g fill="{C["white"]}">{parts}</g>')


def blobs_svg(items, rnd, wrap_w=None):
    out = []
    for cx, cy, r, color in items:
        xs = [cx] if wrap_w is None else [cx - wrap_w, cx, cx + wrap_w]
        for x in xs:
            out.append(f'<path d="{blob_path(x, cy, r, random.Random(hash((cx, cy, r)) & 0xffff))}" '
                       f'fill="{C[color]}" stroke="{INK}" stroke-width="12" stroke-linejoin="round"/>')
    return "".join(out)


def svg(w, h, body, par="xMidYMid slice"):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" preserveAspectRatio="{par}">'
            f'{DEFS}<rect width="{w}" height="{h}" fill="{C["blue"]}"/>{body}</svg>\n')


def build_mobile():
    rnd = random.Random(SEED)
    w, h = 420, 900
    body = blobs_svg([
        (40, 90, 150, "green"), (400, 40, 120, "white"), (330, 250, 120, "magenta"),
        (-30, 430, 130, "purple"), (250, 470, 150, "gray"), (440, 560, 120, "pink"),
        (210, 800, 190, "lime"), (430, 860, 110, "mint"),
    ], rnd)
    body += cloud(-40, 830, 1, rnd)
    for x, y, r, s, v in [(30, 20, -30, .7, "fry"), (300, 60, 35, .65, "fry"), (360, 360, -20, .6, "fry-x"),
                          (40, 300, 20, .55, "fry"), (200, 150, -45, .5, "fry"), (170, 600, 60, .55, "fry"),
                          (380, 660, -15, .6, "fry")]:
        body += fry(x, y, r, s, rnd, variant=v)
    body += character(95, 740, .62, C["red"])
    body += character(335, 760, .6, C["green"], look="side", flip=True)
    return svg(w, h, body)


def build_desktop():
    rnd = random.Random(SEED + 1)
    w, h = 1400, 760
    body = blobs_svg([
        (160, 110, 220, "green"), (-40, 460, 200, "purple"), (560, 40, 170, "magenta"),
        (820, 330, 250, "gray"), (1180, 470, 190, "pink"), (1400, 40, 200, "white"),
        (640, 760, 250, "lime"), (1330, 760, 170, "mint"), (360, 420, 120, "blue"),
    ], rnd)
    body += cloud(-30, 690, 1.3, rnd)
    for x, y, r, s, v in [(60, 30, -30, .8, "fry"), (470, 90, 30, .75, "fry-x"), (700, 60, -40, .7, "fry"),
                          (1020, 120, 25, .8, "fry"), (1290, 230, -25, .75, "fry"), (560, 470, 55, .7, "fry"),
                          (300, 300, -15, .6, "fry"), (1100, 610, 40, .7, "fry")]:
        body += fry(x, y, r, s, rnd, variant=v)
    body += character(180, 640, .75, C["red"])
    body += character(1240, 640, .72, C["green"], look="side", flip=True)
    return svg(w, h, body)


def build_band():
    rnd = random.Random(SEED + 2)
    w, h = 1200, 140
    body = blobs_svg([
        (80, 60, 90, "green"), (300, 110, 80, "pink"), (520, 20, 90, "gray"),
        (720, 120, 90, "magenta"), (930, 40, 90, "lime"), (1120, 110, 80, "purple"),
    ], rnd, wrap_w=w)
    for x, y, r, s in [(180, 10, 30, .55), (420, 40, -35, .5), (640, 5, 20, .55), (850, 45, -25, .5), (1060, 0, 35, .5)]:
        body += fry(x, y, r, s, rnd, animate=False)
    return svg(w, h, body, par="xMidYMid slice")


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for name, fn in [("graffiti-mobile.svg", build_mobile), ("graffiti-desktop.svg", build_desktop), ("graffiti-band.svg", build_band)]:
        data = fn()
        (OUT / name).write_text(data, encoding="utf-8")
        print(f"{name}: {len(data) / 1024:.1f} KB")
