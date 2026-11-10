# NoemaTrace case media provenance — palette refresh

Current assets use actual cloud-Chrome captures at 1363×936 CSS px, with synthetic records. No interface region is redrawn. The pointer is parked at the lower-right, outside public compositions.

## Two genuine themes

The active case uses `light/` or `dark/`, selected by the page theme. Both include five actual screens, five independent seven-second H.264 clips with matching posters, full 35-second overview, and Before/After images. Poster, clip, frame enlargement and refinement enlargement use the same theme.

| Public asset in each theme directory | Current source / framing |
| --- | --- |
| canvas-current-context.webp | qa/v30/03-trace-THEME.jpg; x229 y190 w791 h718 |
| review-current-context.webp | qa/v30/04-review-THEME.jpg; x176 y32 w1012 h872 |
| state-1.jpg … state-5.jpg | qa/v30/03-trace,05-comparison,06-finance,07-history,08-stale-THEME.jpg; complete 1363px width, upper 900px |

The review After opens at the top of the evidence workspace, with all candidates visible and the persistent context and footer inside the complete dialog. No payment runs. The outer dialog is never cropped.

Both Before themes were re-rendered from the earlier source at commit `0b85a0843333b8ff5fbbd2c6ef16f8486fb3937d` (v0.10.0), using the current exception palette and demo run reference. The earlier layout and interactions are retained; screenshots are not recoloured or retouched. Captures are `qa/v30/10-canvas-earlier-THEME.jpg` and `qa/v30/12-review-earlier-THEME.jpg`. Earlier/current labels describe interface iterations, not a participant study.

## Film

`chapter-1.mp4` through `chapter-5.mp4` are independent seven-second 1600×1000 H.264 clips at 60 fps. These are edited actual screen compositions, not a continuous live interaction recording. Captions occupy their own lower rail. The original NoemaTrace mark appears in the upper brand rail; there is no decorative cursor, audio, autoplay or native subtitle overlay.

The page holds the outgoing poster underneath the incoming clip until it is ready, then fades in over 180ms. Reduced motion disables the fade. Paused chapter selection stays paused. Only explicit Play enables sequential advancement. Progress uses five live noninteractive segments, with no byte-range seek bar. A duplicate desktop description below the video has been removed; a readable text equivalent remains available to assistive technology and on small screens.

Root-level media paths remain compatible copies of the current dark compositions. Earlier small crops, VTT and workspace-light.jpg are archival and unused by the current markup.

Regenerate with `node scripts/create-case-media.mjs qa/v30`. Dependencies: sharp, Python/Pillow with WOFF2 support, ffmpeg/libx264. Source captures are included in the downloadable kit for reproduction. Generate the 1200×630 branded link preview with `python3 scripts/create-og-preview.py qa/v30/03-trace-dark.jpg`.
