# NoemaTrace interface-tour media

The tour uses UI illustrations drawn by the media scripts. They explain gestures and review states; they do not read or modify review data.

Each of the seven topics has light and dark variants: mismatch, navigation/Fit, source evidence, workspace resizing, test checks, Finance decisions and source freshness. The illustrations use Inter and Phosphor icons. Phosphor attribution is in [PHOSPHOR-LICENSE.txt](PHOSPHOR-LICENSE.txt).

## Formats and behavior

Artwork is 720 × 352 px. Four-second loops use eased movement and reading pauses. H.264 MP4 at 60 fps is the primary format and supports pause/resume. GIF alternatives use 20 ms frames; PNG posters provide static examples for reduced motion and paused GIF fallback.

The workspace example keeps log rows inside the panel while the divider moves. The decision example distinguishes returned and approved versions. The freshness example keeps the tested snapshot beside the newer source version. Tour copy and accessible descriptions explain the approval scope.

The current asset revision is `minimal-4s-v29`. Regenerate MP4, GIF and PNG files together when changing an illustration.

## Regeneration

Run from the repository root after installing the frontend dependencies. Additional requirements are Pillow with WOFF2 support, sharp and ffmpeg with libx264.

```sh
python3 scripts/create-tour-media.py
npm run test:media
```

To regenerate only selected topics:

```sh
python3 scripts/create-tour-media.py workspace decision freshness
```

Media tests cover timing, Fit bounds, divider limits, click targets and log-row clipping. Inspect both themes after regeneration.
