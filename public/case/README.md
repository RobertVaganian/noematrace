# NoemaTrace case-study media

Case-study images come from browser captures of the prototype with synthetic records. The demo Operations profile is Robert Vaganian (RV). The films arrange those captures with captions; they are edited screen walkthroughs.

## Source captures

The current source set is [qa/v31](../../qa/v31). Each image is 1363 × 912 px, captured from the upper part of a 1363 × 936 CSS px viewport after the scene heading and fonts loaded. The pointer is outside the captured area.

Both light and dark themes have their own captures. Earlier interface views were rendered from source commit `0b85a0843333b8ff5fbbd2c6ef16f8486fb3937d` (v0.10.0), with the current exception palette and run reference. Their earlier layouts and interactions are retained. Earlier/current labels identify interface iterations.

| Output in each theme directory | Source and crop |
| --- | --- |
| `canvas-current-context.webp` | `03-trace-THEME.jpg`; x229 y190 w791 h718 |
| `canvas-earlier-context.webp` | `10-canvas-earlier-THEME.jpg`; x229 y190 w791 h718 |
| `review-current-context.webp` | `04-review-THEME.jpg`; x176 y32 w1012 h872 |
| `review-earlier-context.webp` | `12-review-earlier-THEME.jpg`; x176 y32 w1012 h872 |
| `state-1.jpg` through `state-5.jpg` | Trace, comparison, Finance, history and stale-evidence captures; full width, upper 900 px |

Replace `THEME` with `light` or `dark`. The review capture includes the full dialog, candidate orders and footer.

## Films and compatibility paths

Each theme contains five seven-second chapters with matching posters and a 35-second overview. Films are 1600 × 1000 H.264 at 60 fps, with captions below the screen image and no audio or cursor overlay.

The case page uses the directory matching its active theme. Root-level media paths are compatibility copies of the dark compositions; `workspace-light.jpg` uses the light trace capture. The VTT file is retained for earlier exports and is unused by the current page.

## Regeneration

Run from the repository root after installing the frontend dependencies. Media generation also needs sharp, Python/Pillow with WOFF2 support and ffmpeg with libx264.

```sh
node scripts/create-case-media.mjs qa/v31
python3 scripts/create-og-preview.py qa/v31/03-trace-dark.jpg
npm run test:media
```

The generator checks capture dimensions and rejects nearly uniform loading screens before writing derived assets. Inspect the resulting images and films before publication.
