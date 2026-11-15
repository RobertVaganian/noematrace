"""Refresh current product media from complete 2x browser captures.

Only surrounding canvas is cropped. Historical Before assets are retained.
Usage: python scripts/refresh-current-media.py /absolute/capture-directory
"""
from pathlib import Path
from PIL import Image
import json, shutil, sys
root=Path(__file__).resolve().parents[1]
source=Path(sys.argv[1])
shots=root/'docs/screenshots';shots.mkdir(parents=True,exist_ok=True)
scenes=['trace','comparison','finance','history','stale']
for theme in ['light','dark']:
    out=root/'public/case'/theme
    out.mkdir(parents=True,exist_ok=True)
    for i,scene in enumerate(scenes):
        full=Image.open(source/f'{scene}-{theme}-full.jpg').convert('RGB')
        assert full.size==(2790,1888), (scene,full.size)
        view=full.crop((32,32,2758,1856))
        view.crop((0,0,2726,1800)).save(shots/f'{scene}-{theme}.jpg',quality=95,subsampling=0)
        view.resize((1363,912),Image.Resampling.LANCZOS).crop((0,0,1363,900)).save(out/f'state-{i+1}.jpg',quality=95,subsampling=0)
        if scene=='trace':
            view.crop((458,380,2040,1816)).save(out/'canvas-current-context.webp',quality=95)
            if theme=='light':view.save(root/'public/case/workspace-light.jpg',quality=95,subsampling=0)
    review=Image.open(source/f'review-{theme}-full.jpg').crop((32,32,2758,1856))
    review.save(shots/f'review-{theme}.jpg',quality=95,subsampling=0)
    review.crop((352,64,2376,1808)).save(out/'review-current-context.webp',quality=95)
    bounds=json.loads((source/f'match-{theme}-bounds.json').read_text())
    box=tuple(round(32+bounds[k]*2) for k in ['left','top','right','bottom'])
    match=Image.open(source/f'match-{theme}-full.jpg').crop(box)
    assert match.width==2160 and match.height>1800
    match.save(out/'order-match.jpg',quality=96,subsampling=0)
    match.save(shots/f'order-match-{theme}.jpg',quality=96,subsampling=0)
# Root aliases continue to show the current dark prototype.
for name in ['canvas-current-context.webp','review-current-context.webp',*[f'state-{i}.jpg' for i in range(1,6)]]:
    shutil.copyfile(root/'public/case/dark'/name,root/'public/case'/name)
for name in ['canvas-current','review-current']:
    shutil.copyfile(root/'public/case'/f'{name}-context.webp',root/'public/case'/f'{name}.webp')
shutil.copyfile(shots/'trace-dark.jpg',shots/'overview.jpg')
print('Refreshed current captures in both themes; retained historical Before files.')
