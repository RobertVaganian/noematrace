"""Frame genuine UI captures with readable integrated explanations.

This is an edited screen walkthrough, not a recording of live user actions.
The title and explanatory rail never overlap the screenshot. No cursor overlays.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import subprocess
import tempfile
import sys

ROOT = Path(__file__).resolve().parent.parent
THEME = sys.argv[1] if len(sys.argv) > 1 else 'dark'
assert THEME in ('light', 'dark')
OUT = ROOT / 'public/case' / THEME
COLORS = ('#f8f9fb', '#242831', '#626d7d', '#d8dde5') if THEME == 'light' else ('#111317', '#f0f2f6', '#bac3d1', '#343943')
BG, TEXT, MUTED, BORDER = COLORS
mark = Image.open(ROOT / 'public/brand/noematrace-mark.png').convert('RGBA')
mark = mark.crop(mark.getchannel('A').getbbox())
mark.thumbnail((27, 27), Image.Resampling.LANCZOS)
logo = Image.new('RGBA', mark.size, TEXT)
logo.putalpha(mark.getchannel('A'))
W, H = 1600, 1000
FONT = ROOT / 'node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2'
chapters = [
    ('Find the mismatch', 'EUR 12,480 on the invoice. EUR 1,248 on the order.', 'The run pauses before payment preparation.'),
    ('Test the correction', 'Supplier, currency, total and line items must agree.', 'This read-only test skips payment actions.'),
    ('Review the evidence', 'Finance reviews one submitted version and its test.', 'A decision records a note about that evidence.'),
    ('Keep the history', 'Returned v1 and approved v2 retain separate tests.', 'Correction approval does not execute a payment.'),
    ('Catch source changes', 'Changed source data makes earlier evidence outdated.', 'The snapshot stays; a new test and review are required.'),
]
fonts = {s: ImageFont.truetype(str(FONT), s) for s in (18, 21, 26, 28)}
for font in fonts.values(): font.set_variation_by_axes([450])
with tempfile.TemporaryDirectory(prefix='noematrace-film-') as folder:
    folder = Path(folder)
    for i, (title, first, second) in enumerate(chapters):
        frame = Image.new('RGB', (W,H), BG)
        d = ImageDraw.Draw(frame)
        frame.paste(logo, (36,24), logo)
        d.text((74,24), 'NoemaTrace', font=fonts[21], fill=TEXT)
        d.text((W-36,25), f'0{i+1} / 05', font=fonts[18], fill=MUTED, anchor='ra')
        # Complete screen establishes context. Caption rail stays below the image.
        shot = Image.open(OUT / f'state-{i+1}.jpg').convert('RGB')
        shot.thumbnail((1528, 760), Image.Resampling.LANCZOS)
        x, y = (W-shot.width)//2, 72+(760-shot.height)//2
        frame.paste(shot, (x,y))
        d.rectangle((x-1,y-1,x+shot.width,y+shot.height), outline=BORDER, width=1)
        d.line((36,851,W-36,851), fill=BORDER, width=1)
        d.text((36,876), title, font=fonts[28], fill=TEXT)
        d.text((36,923), first+' '+second, font=fonts[21], fill=MUTED)
        # Live progress is rendered by the page, not baked into the screen.

        frame.save(folder/f'frame-{i}.png')
        frame.save(OUT/f'chapter-{i+1}.jpg', quality=95)
        subprocess.run(['ffmpeg','-y','-loglevel','error','-loop','1','-framerate','60','-i',str(folder/f'frame-{i}.png'),'-t','7','-an','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-threads','2','-movflags','+faststart',str(folder/f'chapter-{i+1}.mp4')],check=True)
        (folder/f'chapter-{i+1}.mp4').replace(OUT/f'chapter-{i+1}.mp4')
        if i==0: frame.save(OUT/'overview-poster.jpg', quality=95)
    args=['ffmpeg','-y','-loglevel','error']
    for i in range(5): args += ['-loop','1','-framerate','60','-t','7.24','-i',str(folder/f'frame-{i}.png')]
    filters=[f'[{i}:v]setsar=1,format=yuv420p,settb=AVTB[v{i}]' for i in range(5)]
    # Crossfades start after each seven-second chapter boundary; seeking to the
    # boundary therefore has the right explanation, without passing stale text.
    for i in range(1,5): filters.append(f'[{"v0" if i==1 else "f"+str(i-1)}][v{i}]xfade=transition=fade:duration=0.24:offset={7*i}[f{i}]')
    args += ['-filter_complex',';'.join(filters),'-map','[f4]','-t','35',
      '-c:v','libx264','-preset','fast','-crf','19','-threads','2','-filter_complex_threads','1',
      '-an','-movflags','+faststart',str(OUT/'overview.mp4')]
    subprocess.run(args,check=True)
print(f'{THEME}: 35-second 1600×1000 film; integrated captions, no audio, 60 fps.')
