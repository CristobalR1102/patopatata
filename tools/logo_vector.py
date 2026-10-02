"""
Logo de PatoPatata redibujado en vector (fondo transparente).

    python tools/logo_vector.py

Salida: assets/img/logo-patopatata.svg
El texto usa Baloo 2 ExtraBold (tools/fonts/Baloo2.ttf, licencia OFL) convertido a trazos,
así el SVG no depende de que cargue ninguna fuente.
Requiere: pip install fonttools
"""
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

HERE = Path(__file__).resolve().parent
OUT = HERE.parent / "assets" / "img" / "logo-patopatata.svg"

INK = "#3A2330"          # contorno café-morado del logo
ORANGE = "#F4693D"
ORANGE_DARK = "#D94F2B"
YELLOW = "#F9D948"
YELLOW_LIGHT = "#FCE77E"
FRY = "#F5B321"
FRY_LIGHT = "#FFD54A"
SIDE = "#D9A24C"

font = instantiateVariableFont(TTFont(HERE / "fonts" / "Baloo2.ttf"), {"wght": 800})
glyphs = font.getGlyphSet()
cmap = font.getBestCmap()
hmtx = font["hmtx"]
CAP = font["OS/2"].sCapHeight


def word_path(word, x0, y0, x1, y1, tracking=-10):
    """Ajusta la palabra a la caja (x0,y0)-(x1,y1): ancho y alto de mayúsculas."""
    names = [cmap[ord(ch)] for ch in word]
    widths = [hmtx[n][0] for n in names]
    total = sum(widths) + tracking * (len(names) - 1)
    sx = (x1 - x0) / total
    sy = (y1 - y0) / CAP
    pen = SVGPathPen(glyphs)
    cursor = 0
    for n, w in zip(names, widths):
        # y invertida: la línea base queda en y1
        glyphs[n].draw(TransformPen(pen, (sx, 0, 0, -sy, x0 + cursor * sx, y1)))
        cursor += w + tracking
    return pen.getCommands()


def fry(x, y, h, angle):
    return (f'<g transform="rotate({angle} {x + 11} {y + h})">'
            f'<rect x="{x}" y="{y}" width="22" height="{h}" rx="4" fill="{FRY}" stroke="{INK}" stroke-width="6"/>'
            f'<rect x="{x + 4}" y="{y + 5}" width="7" height="{h - 10}" rx="3" fill="{FRY_LIGHT}"/></g>')


def build():
    text = (
        f'<path d="{word_path("PATO", 62, 160, 296, 222)}"/>'
        f'<path d="{word_path("PATATA", 10, 234, 330, 294)}"/>'
    )

    fries = "".join(fry(*a) for a in [
        (338, 44, 110, -16), (366, 22, 130, -7), (396, 8, 150, 2), (426, 26, 130, 9),
        (452, 46, 110, 16), (382, 52, 110, -2), (414, 58, 100, 5),
    ])

    box = f"""
      <path d="M478 102 L512 88 L518 270 L486 290 Z" fill="{SIDE}" stroke="{INK}" stroke-width="6.5" stroke-linejoin="round"/>
      <rect x="326" y="100" width="162" height="192" rx="20" fill="{YELLOW}" stroke="{INK}" stroke-width="6.5"/>
      <path d="M340 118 q60 -8 128 0 v28 q-70 -10 -128 4 Z" fill="{YELLOW_LIGHT}" opacity=".8"/>
    """

    face = f"""
      <ellipse cx="380" cy="166" rx="8" ry="11" fill="#3A2A6A"/>
      <ellipse cx="426" cy="162" rx="8" ry="11" fill="#3A2A6A"/>
      <circle cx="383" cy="161" r="3" fill="#fff"/>
      <circle cx="429" cy="157" r="3" fill="#fff"/>
      <path d="M312 226 C 336 196, 410 184, 452 196 C 460 214, 444 236, 406 242 C 370 248, 326 246, 312 226 Z"
            fill="{ORANGE}" stroke="{INK}" stroke-width="7" stroke-linejoin="round"/>
      <path d="M326 230 C 370 236, 424 226, 448 208" fill="none" stroke="{ORANGE_DARK}" stroke-width="5" stroke-linecap="round"/>
      <ellipse cx="352" cy="212" rx="12" ry="4" fill="#FF9A74" transform="rotate(-12 366 206)"/>
    """

    wing = f"""
      <path d="M474 150 C 500 118, 552 116, 570 142 C 588 168, 578 204, 556 222
               C 548 234, 532 236, 526 226 C 518 238, 500 236, 496 224 C 486 230, 470 222, 474 206 Z"
            fill="{YELLOW}" stroke="{INK}" stroke-width="6.5" stroke-linejoin="round"/>
      <path d="M500 150 C 528 140, 556 150, 562 170" fill="none" stroke="{YELLOW_LIGHT}" stroke-width="6.5" stroke-linecap="round"/>
      <path d="M526 226 C 530 212, 540 204, 552 202 M496 224 C 500 210, 510 204, 520 202" fill="none" stroke="{INK}" stroke-width="5" stroke-linecap="round"/>
    """

    def foot(cx):
        return (f'<g transform="translate({cx} 300) scale(1.35) translate({-cx} -300)">'
                f'<path d="M{cx - 6} 288 v12 M{cx + 6} 288 v12" stroke="{INK}" stroke-width="7" stroke-linecap="round"/>'
                f'<path d="M{cx - 30} 330 C {cx - 34} 314, {cx - 16} 300, {cx} 300 C {cx + 16} 300, {cx + 34} 314, {cx + 30} 330 '
                f'C {cx + 22} 338, {cx + 14} 330, {cx + 10} 334 C {cx + 4} 342, {cx - 4} 342, {cx - 10} 334 '
                f'C {cx - 14} 330, {cx - 22} 338, {cx - 30} 330 Z" fill="{ORANGE}" stroke="{INK}" stroke-width="5.5" stroke-linejoin="round"/></g>')

    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 385" role="img" aria-label="PatoPatata">
  <g fill="{ORANGE}">{text}</g>
  <g transform="rotate(-4 420 190)">
    {fries}
    {foot(372)}{foot(446)}
    {box}
    {face}
    {wing}
  </g>
</svg>
"""


if __name__ == "__main__":
    svg = build()
    OUT.write_text(svg, encoding="utf-8")
    print(f"{OUT.name}: {len(svg) / 1024:.1f} KB")
