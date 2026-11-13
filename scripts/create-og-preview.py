"""Open Graph card using an actual UI capture, local fonts."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import sys
root=Path(__file__).resolve().parent.parent
source=root/(sys.argv[1] if len(sys.argv)>1 else 'qa/v30/03-trace-dark.jpg')
out=root/'public/og/noematrace.jpg'
out.parent.mkdir(parents=True,exist_ok=True)
frame=Image.new('RGB',(1200,630),'#14161b')
d=ImageDraw.Draw(frame)
font=root/'node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2'
f=lambda size:ImageFont.truetype(str(font),size)
mark=Image.open(root/'public/brand/noematrace-mark.png').convert('RGBA')
mark=mark.crop(mark.getchannel('A').getbbox())
mark.thumbnail((30,30),Image.Resampling.LANCZOS)
logo=Image.new('RGBA',mark.size,'#edf0f5');logo.putalpha(mark.getchannel('A'))
frame.paste(logo,(40,48),logo)
d.text((82,46),'NoemaTrace',font=f(28),fill='#edf0f5')
d.text((40,148),'Resolve the\nexception.',font=f(36),fill='#edf0f5',spacing=7)
d.text((40,270),'Keep the evidence.',font=f(23),fill='#aeb9cb')
d.text((40,500),'Workflow review',font=f(17),fill='#aeb9cb')
d.text((40,533),'Robert Vaganian',font=f(17),fill='#edf0f5')
shot=Image.open(source).convert('RGB')
# Complete graph/inspector context; the surrounding app is visible in the film.
shot=shot.crop((229,54,1363,900))
shot.thumbnail((820,558),Image.Resampling.LANCZOS)
x=1200-shot.width-24;y=(630-shot.height)//2
d.rounded_rectangle((x-1,y-1,x+shot.width+1,y+shot.height+1),radius=10,fill='#3e4652')
frame.paste(shot,(x,y))
frame.save(out,quality=95)
print(out)
