# NoemaTrace interface tour media

Generated UI illustrations, not screenshots or live review results. Regenerate from the repository root with `python3 scripts/create-tour-media.py`.

The four-second loops use the existing Inter font and Phosphor icons. Motion eases in and out, with pauses to read each example and matching loop endpoints. Artwork is 720 × 352 px. H.264 MP4 at 60 fps provides smooth playback and actual frame pause/resume. GIF alternatives use 20 ms frames (50 fps before identical-frame optimization); PNG posters provide meaningful reduced-motion stills. GIF fallback pause uses the poster. Each theme has all seven examples and all three formats.

Dependencies: Pillow with WOFF2 font support, Node, installed frontend dependencies, sharp and ffmpeg with libx264. No review data is read or modified. Phosphor attribution is in PHOSPHOR-LICENSE.txt.

The pointer uses the installed Phosphor cursor silhouette with a solid white fill and crisp dark outline; the pan hand uses the same neutral treatment. No glow or colored cursor trail.

The seven topics are mismatch, navigation/Fit, source evidence, resizing the workspace, read-only test checks, Finance decisions with version history, and stale source evidence. New view-only examples use the same Inter/Phosphor style and four-second timing. `workspace` illustrates both dividers and their reset; `decision` shows version-specific correction approval; the accompanying tour text and accessible description distinguish it from payment execution; `freshness` retains the tested snapshot while a newer ERP version requires fresh review.

Regenerate selected examples with `python3 scripts/create-tour-media.py workspace decision freshness`. Tour media uses the `minimal-4s-v29` asset revision. All seven illustrations were revised in iteration28; the last three were simplified in iteration29; native video pause/resume remains the primary path, with GIF/PNG fallbacks.

Iteration28 uses a consistent reading rhythm, a real minus/plus/Fit group, a cursor clear of comparison labels, explicit read-only test/pending states, version-specific decisions and preserved historical snapshots. Numeric values and status labels stay legible while their surrounding emphasis changes. The workspace example derives its event-row opacity from the actual Inter text bounds and remaining space, and clips all log contents inside the panel. The row disappears while there is still bottom padding, rather than crossing the border. A pixel regression scans every encoded workspace GIF frame below that border.

Iteration29 removes redundant footer explanations from review, decision and freshness artwork. The last three panels share quieter spacing. Decision shows v1/v2 with statuses and small icons, without test IDs, version counts or a wide approval fill. Freshness retains both compared versions and an inline result, without a second outlined warning banner. All explanatory and payment-boundary details remain in tour copy and accessible descriptions. Step4 clipping and timing are unchanged.
