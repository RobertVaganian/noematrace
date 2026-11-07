"""Geometry and timing for the illustrative Quick Tour canvas; no review state."""
import math

DURATION = 4
WORKSPACE = (12, 12, 336, 104)
WORKFLOW = (0, 0, 284, 52)
PAN = (26, 10)
HOME = (180, 108)
FIT_BUTTON = (80, 130, 74, 32)
FIT_POINT = (117, 146)


def ease(t):
    return (1 - math.cos(math.pi * max(0, min(1, t)))) / 2


def loop_focus(t, start=.45, enter=.25, release=3.55, leave=.45):
    return ease((t - start) / enter) * (1 - ease((t - release) / leave))


def row_opacity(available, content_bottom, padding=6, fade=4):
    """Fade a row before its measured text could reach the lower border."""
    return ease((available - content_bottom - padding) / fade)


def inspection_frame(t):
    t = max(0, min(DURATION, t))
    home, target = (114, 140), (126, 102)
    travel = ease((t-.2)/.35) * (1-ease((t-1.2)/.45))
    return {"cursor": tuple(a+(b-a)*travel for a,b in zip(home,target)),
            "open": loop_focus(t, .62, .28),
            "press": max(0, 1-abs(t-.62)/.13)}


def fit_translation(bounds, viewport):
    x, y, width, height = bounds
    vx, vy, vw, vh = viewport
    return (vx + (vw - width) / 2 - x, vy + (vh - height) / 2 - y)


def navigation_frame(t):
    t = max(0, min(DURATION, t))
    drag = ease((t - .4) / .5)
    fit = ease((t - 1.72) / .45)
    baseline = fit_translation(WORKFLOW, WORKSPACE)
    offset = tuple(p * drag * (1 - fit) for p in PAN)
    position = tuple(b + d for b, d in zip(baseline, offset))
    end_drag = tuple(h + p for h, p in zip(HOME, PAN))
    if t <= .9:
        cursor = tuple(h + p * drag for h, p in zip(HOME, PAN))
    elif t <= 1.15:
        cursor = end_drag
    elif t <= 1.6:
        progress = ease((t - 1.15) / .45)
        cursor = tuple(a + (b - a) * progress for a, b in zip(end_drag, FIT_POINT))
    elif t <= 2.5:
        cursor = FIT_POINT
    else:
        progress = ease((t - 2.5) / .9)
        cursor = tuple(a + (b - a) * progress for a, b in zip(FIT_POINT, HOME))
    return {
        "position": position,
        "cursor": cursor,
        "symbol": "hand" if t < 1.15 or t >= 3.4 else "cursor",
        "press": max(0, 1 - abs(t - 1.72) / .14),
        "centered": ease((t - 2.17) / .18) * (1 - ease((t - 3.5) / .25)),
    }

TOUR_KINDS = ("mismatch", "navigate", "inspect", "workspace", "review", "decision", "freshness")

def workspace_frame(t):
    """A bounded, view-only example of the two real panel dividers."""
    t = max(0, min(DURATION, t))
    reset = 1 - ease((t - 2.3) / .35)
    vertical = ease((t - .3) / .45) * reset
    horizontal = ease((t - 1.25) / .45) * reset
    inspector = 80 + 32 * vertical
    log = 30 + 20 * horizontal
    vertical_x = 346 - inspector
    horizontal_y = 140 - log
    if t < .9:
        cursor = (vertical_x, 62)
    elif t < 1.2:
        p = ease((t - .9) / .3)
        cursor = (vertical_x + (140 - vertical_x) * p, 62 + (horizontal_y - 62) * p)
    elif t < 2.65:
        cursor = (140, horizontal_y)
    else:
        p = ease((t - 2.65) / .75)
        cursor = (140 + 126 * p, horizontal_y + (62 - horizontal_y) * p)
    kind = "resize-x" if .3 <= t <= .8 else "resize-y" if 1.25 <= t <= 1.8 or 2.1 <= t <= 2.65 else "cursor"
    return {"inspector": inspector, "log": log, "vertical_x": vertical_x, "horizontal_y": horizontal_y, "cursor": cursor, "cursor_kind": kind}
