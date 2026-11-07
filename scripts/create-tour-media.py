"""Generate precise, theme-matched looping UI previews, not product screenshots.

Requires Pillow with WOFF2 font support, Node dependencies, sharp and ffmpeg.
Run from the project root: python3 scripts/create-tour-media.py
The GIFs illustrate gestures; they never operate on the review state.
"""
import subprocess
import sys
import tempfile
from contextlib import contextmanager
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps
from tour_scene import DURATION, FIT_BUTTON, ease, navigation_frame, workspace_frame, inspection_frame, loop_focus, row_opacity, TOUR_KINDS

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public/tour"
OUT.mkdir(parents=True, exist_ok=True)
S = 2
W, H = 360, 176
FPS = 60
SECONDS = DURATION
PALETTES = {
    "light": dict(bg="#f4f6fa", surface="#ffffff", border="#c9cfda", ink="#303642", muted="#626e80", focus="#536d91", soft="#e8effa", warning="#a34d25", warning_soft="#fff1ec", pass_soft="#edf6f0", pass_= "#326b45", dot="#ccd3df"),
    "dark": dict(bg="#1a1d23", surface="#252a32", border="#4b5565", ink="#e2e6ed", muted="#b2bdcd", focus="#a8bedb", soft="#303e51", warning="#ffac8b", warning_soft="#372821", pass_soft="#24372c", pass_="#a8c9b2", dot="#3b4656"),
}

def mix(a, b, t):
    t = max(0, min(1, t))
    aa = a if isinstance(a, tuple) else tuple(bytes.fromhex(a.lstrip("#")))
    bb = b if isinstance(b, tuple) else tuple(bytes.fromhex(b.lstrip("#")))
    return tuple(round(x + (y - x) * t) for x, y in zip(aa, bb))

with tempfile.TemporaryDirectory(prefix="noematrace-tour-") as work:
    work = Path(work)
    subprocess.run(["node", str(ROOT / "scripts/tour-icons.mjs"), str(work)], cwd=ROOT, check=True)
    icons = {}
    for path in work.glob("*.svg"):
        png = path.with_suffix(".png")
        icons[path.stem] = Image.open(png).convert("RGBA").getchannel("A")
    font_path = ROOT / "node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2"
    fonts = {size: ImageFont.truetype(str(font_path), round(size * S)) for size in [10, 11, 12, 13, 14, 16, 18]}
    for font in fonts.values(): font.set_variation_by_axes([450])

    def render(kind, theme, t):
        p = PALETTES[theme]
        image = Image.new("RGB", (W * S, H * S), p["bg"])
        draw = ImageDraw.Draw(image)

        def box(x, y, w, h, fill, border=None, radius=6):
            draw.rounded_rectangle((round(x*S), round(y*S), round((x+w)*S), round((y+h)*S)), radius=round(radius*S), fill=fill, outline=border, width=S)

        def text(x, y, value, size=10, color=None, anchor=None):
            draw.text((round(x*S), round(y*S)), value, font=fonts[size], fill=color or p["ink"], anchor=anchor)

        def line(points, color=None, width=1):
            draw.line([(round(x*S),round(y*S)) for x,y in points], fill=color or p["border"], width=round(width*S), joint="curve")

        def icon(name, x, y, size=16, color=None):
            mask = icons[name].resize((round(size*S), round(size*S)), Image.Resampling.LANCZOS)
            image.paste(color or p["muted"], (round(x*S), round(y*S)), mask)

        @contextmanager
        def clipped(rect):
            nonlocal image, draw
            base_image, base_draw = image, draw
            image = Image.new("RGBA", base_image.size, (0,0,0,0))
            draw = ImageDraw.Draw(image)
            try:
                yield
            finally:
                region = tuple(round(value*S) for value in rect)
                content = image.crop(region)
                image, draw = base_image, base_draw
                image.paste(content, region[:2], content)

        def pointer(name, x, y, size):
            # Neutral system-style pointer: solid light shape, crisp dark edge, no glow.
            mask = icons[name].resize((round(size*S), round(size*S)), Image.Resampling.LANCZOS)
            mask = ImageOps.expand(mask, border=2*S, fill=0)
            outline = mask.filter(ImageFilter.MaxFilter(5))
            origin = (round(x*S)-2*S, round(y*S)-2*S)
            image.paste("#202124", origin, outline)
            image.paste("#ffffff", origin, mask)

        if kind == "mismatch":
            focus = loop_focus(t, .35, .3)
            for x, title, amount in [(16,"Invoice","12,480.00"),(188,"Linked order","1,248.00")]:
                box(x,26,156,116,mix(p["surface"],p["warning_soft"],focus),mix(p["border"],p["warning"],focus))
                text(x+14,39,title,13)
                text(x+14,75,"EUR",11,p["muted"])
                text(x+142,68,amount,18,anchor="ra")
                text(x+14,115,"INV-2048" if x == 16 else "PO-731",11,p["muted"])
            icon("warning",173,74,15,p["warning"])
            text(180,153,"EUR 11,232.00 difference",11,mix(p["bg"],p["warning"],focus),"ma")

        elif kind == "navigate":
            frame = navigation_frame(t)
            x, y = frame["position"]
            for gx in range(12,W,16):
                for gy in range(14,121,16):
                    draw.ellipse((gx*S,gy*S,gx*S+2,gy*S+2),fill=p["dot"])
            line([(x+123,y+26),(x+146,y+26)],p["focus"],2)
            line([(x+140,y+21),(x+146,y+26),(x+140,y+31)],p["focus"],2)
            for dx, width, name, symbol in [(0,123,"Invoice","file"),(146,138,"Compare totals","compare")]:
                box(x+dx,y,width,52,p["surface"],p["focus"])
                icon(symbol,x+dx+11,y+17,17)
                text(x+dx+36,y+18,name,12)
            line([(12,122),(348,122)],p["border"])
            bx,by,bw,bh = FIT_BUTTON
            box(16,by,bx+bw-16,bh,p["surface"],p["border"],6)
            icon("minus",24,by+8,16)
            icon("plus",56,by+8,16)
            line([(48,by+5),(48,by+bh-5)])
            line([(80,by+5),(80,by+bh-5)])
            if frame["press"] > 0:
                box(bx+2,by+2,bw-4,bh-4,mix(p["surface"],p["soft"],frame["press"]),None,4)
            icon("fit",bx+14,by+8,16)
            text(bx+38,by+7,"Fit",13)
            text(344,139,"All steps in view",11,mix(p["bg"],p["muted"],frame["centered"]),"ra")
            cx,cy = frame["cursor"]
            size = 22 if frame["symbol"] == "hand" else 18
            pointer(frame["symbol"],cx-size/2,cy-size/2,size)

        elif kind == "inspect":
            frame = inspection_frame(t)
            open_ = frame["open"]
            box(16,56,128,62,mix(p["surface"],p["soft"],open_),mix(p["border"],p["focus"],open_))
            icon("compare",27,70,18)
            text(51,68,"Compare",13)
            text(51,91,"Mismatch",11,p["warning"])
            fill=mix(p["bg"],p["surface"],open_)
            border=mix(p["bg"],p["border"],open_)
            ink=mix(p["bg"],p["ink"],open_)
            muted=mix(p["bg"],p["muted"],open_)
            box(162,12,182,152,fill,border)
            text(176,25,"Total check",14,ink)
            icon("file",176,50,12,muted)
            text(194,48,"Invoice · EUR",11,muted)
            text(330,68,"12,480.00",18,ink,"ra")
            line([(176,99),(330,99)],border)
            icon("database",176,108,12,muted)
            text(194,106,"Order · EUR",11,muted)
            text(330,126,"1,248.00",18,ink,"ra")
            cx,cy=frame["cursor"]
            pointer("cursor",cx,cy,18)

        elif kind == "workspace":
            frame = workspace_frame(t)
            vx, hy = frame["vertical_x"], frame["horizontal_y"]
            box(14,10,332,130,p["bg"],p["border"])
            box(vx+2,10,344-vx,130,p["surface"],p["border"],3)
            text(vx+10,23,"Details",11)
            text(vx+10,47,"Invoice",10,p["muted"])
            text(336,65,"12,480",12,anchor="ra")
            box(26,32,72,30,p["surface"],p["border"],4)
            text(36,40,"Invoice",11)
            line([(99,47),(123,47)],p["focus"],2)
            line([(117,43),(123,47),(117,51)],p["focus"],2)
            box(124,32,88,30,p["surface"],p["focus"],4)
            text(134,40,"Compare",11)
            box(14,hy+2,vx-14,138-hy,p["surface"],p["border"],3)
            # Measure the actual type, fade before the lower padding is lost,
            # and clip the complete contents to the panel's inner rectangle.
            content_bottom = 28 + fonts[10].getbbox("3 events")[3]/S
            opacity = row_opacity(frame["log"],content_bottom)
            with clipped((16,hy+3,vx-2,138)):
                text(26,hy+8,"Execution log",11)
                if opacity > 0:
                    line([(26,hy+24),(vx-12,hy+24)],mix(p["surface"],p["border"],opacity))
                    text(26,hy+28,"3 events",10,mix(p["surface"],p["muted"],opacity))
            line([(vx,11),(vx,139)],p["border"])
            line([(vx,64),(vx,84)],p["focus"],3)
            line([(15,hy),(vx-1,hy)],p["border"])
            line([(116,hy),(142,hy)],p["focus"],3)
            text(180,152,"Drag dividers · Double-click to reset",11,p["muted"],"ma")
            cx,cy = frame["cursor"]
            size = 20 if frame["cursor_kind"] != "cursor" else 18
            pointer(frame["cursor_kind"],cx-size/2,cy-size/2,size)

        elif kind == "review":
            box(16,22,328,132,p["surface"],p["border"])
            text(30,34,"Read-only test",12)
            line([(30,60),(330,60)])
            for i,name in enumerate(["Supplier","Currency","Total","Line items"]):
                y=68+i*20
                text(30,y,name,12)
                passed=loop_focus(t,.4+i*.28,.24)
                icon("check" if passed>=.5 else "circle",311,y,15,p["pass_"] if passed>=.5 else p["border"])

        elif kind == "decision":
            passed = loop_focus(t,.65,.28)
            box(16,22,328,132,p["surface"],p["border"])
            text(30,34,"Finance review",12)
            line([(30,60),(330,60)])
            text(30,75,"v1",12,p["muted"])
            text(78,75,"Changes requested",12,p["muted"])
            icon("warning",311,74,16,p["warning"])
            line([(30,104),(330,104)],mix(p["surface"],p["border"],.5))
            text(30,117,"v2",12)
            approved = passed >= .5
            text(78,117,"Correction approved" if approved else "Awaiting review",12,p["pass_"] if approved else p["muted"])
            icon("check" if approved else "circle",311,116,16,p["pass_"] if approved else p["border"])

        elif kind == "freshness":
            changed = loop_focus(t,.65,.28)
            outdated = changed >= .5
            box(16,22,328,132,p["surface"],p["border"])
            text(30,34,"Purchase order · PO-732",12)
            for x,label in [(30,"Tested snapshot"),(200,"Current source")]:
                box(x,63,130,47,p["bg"],None,4)
                text(x+10,70,label,10,p["muted"])
                text(x+10,87,"v1.5" if x==200 and outdated else "v1.4",14,p["warning"] if x==200 and outdated else p["ink"])
            line([(166,87),(192,87)],mix(p["border"],p["warning"],changed))
            line([(186,83),(192,87),(186,91)],mix(p["border"],p["warning"],changed))
            ink = p["warning"] if outdated else p["pass_"]
            text(51,128,"Fresh test required" if outdated else "Evidence current",11,ink)
            icon("warning" if outdated else "check",30,127,14,ink)

        else:
            raise ValueError(f"Unknown preview: {kind}")
        return image

    for theme in PALETTES:
        for kind in (sys.argv[1:] or TOUR_KINDS):
            if kind not in TOUR_KINDS: raise ValueError(f"Unknown preview: {kind}")
            name = f"{kind}-{theme}"
            video = subprocess.Popen(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                "-f", "rawvideo", "-pixel_format", "rgb24", "-video_size", f"{W*S}x{H*S}",
                "-framerate", str(FPS), "-i", "pipe:0", "-an", "-c:v", "libx264",
                "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
                "-movflags", "+faststart", str(OUT/f"{name}.mp4")], stdin=subprocess.PIPE)
            for i in range(FPS*SECONDS): video.stdin.write(render(kind,theme,i/FPS).tobytes())
            video.stdin.close()
            if video.wait(): raise RuntimeError(f"Video encoding failed: {name}")
            poster=render(kind,theme,3.35 if kind == "navigate" else 1.9 if kind == "workspace" else 2.6)
            temporary=OUT/f".{name}.png"
            poster.save(temporary,optimize=True)
            temporary.replace(OUT/f"{name}.png")
            frames=[render(kind,theme,i*.02) for i in range(50*SECONDS)]
            samples=Image.new("RGB",(W*S*3,H*S))
            for i, frame in enumerate([frames[0],poster,frames[60]]): samples.paste(frame,(i*W*S,0))
            palette=samples.quantize(colors=96,method=Image.Quantize.MEDIANCUT)
            indexed=[frame.quantize(palette=palette,dither=Image.Dither.NONE) for frame in frames]
            temporary=OUT/f".{name}.gif"
            indexed[0].save(temporary,save_all=True,append_images=indexed[1:],duration=20,loop=0,optimize=True,disposal=1)
            with Image.open(temporary) as check:
                check.verify()
            temporary.replace(OUT/f"{name}.gif")
            print(f"{name}: video {(OUT/f'{name}.mp4').stat().st_size} bytes", flush=True)
