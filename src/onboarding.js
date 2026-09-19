export const tourStorageKey = "noematrace.tour.v1";
export const tourSteps = [
  { id: "mismatch", target: '[data-tour="conflict"]', title: "See why the workflow stopped",
    text: "The invoice and linked order have different totals. Follow the highlighted inputs to inspect the cause. Payment steps remain paused.",
    media: "mismatch", alt: "Example: the invoice is EUR 12,480.00 and the linked order is EUR 1,248.00." },
  { id: "navigate", target: '[data-tour="canvas-tools"]', title: "Explore, then find your way back",
    text: "Drag empty space to move the canvas. Use + and − to zoom. Fit brings the whole workflow back into view.",
    media: "navigate", alt: "Example: a cursor drags a small workflow, then clicks Fit to center it again." },
  { id: "evidence", target: '[data-tour="evidence"]', compactTarget: '[data-tour="details"]', title: "Check the source evidence",
    text: "Select a step to inspect its details and source documents. Check supplier, currency and line items before proposing another order.",
    compactText: "Open Details for amounts and documents. Check supplier, currency and line items before proposing another order.",
    media: "inspect", alt: "Example: selecting the comparison step reveals invoice and order amounts in the details panel." },
  { id: "workspace", target: ".inspector-divider", compactTarget: '[data-tour="details"]', title: "Make room for the evidence",
    text: "Drag the vertical divider to widen Details, or the horizontal divider to resize Execution log. Double-click either divider to reset it.",
    compactText: "On larger screens, drag the dividers to resize Details and Execution log. Here, use Details to keep the evidence within reach.",
    media: "workspace", alt: "Example: the details panel widens, the execution log grows, then both dividers return to their original positions." },
  { id: "test", target: '[data-tour="review-action"]', compactTarget: '[data-tour="guide"]', title: "Test without making a payment",
    text: "Choose a different order and explain the evidence you checked. The read-only test checks supplier, currency, total and line items. Payment steps are skipped.",
    media: "review", alt: "Example: a read-only test checks supplier, currency, total and line items. It does not execute payment steps." },
  { id: "decision", target: '[data-tour="proposals"]', title: "Keep a decision with its version",
    text: "Operations submits a tested proposal. Finance approves or requests changes with a note. The Proposals tab keeps each version, test and decision together.",
    media: "decision", alt: "Example: returned v1 keeps its decision; Finance approves correction v2 with a separate test. No payment is executed." },
  { id: "freshness", target: '[data-tour="guide"]', title: "Know when to test again",
    text: "Changed or unavailable source data makes earlier evidence insufficient. The snapshot stays in history; a fresh test and review are required.",
    media: "freshness", alt: "Example: the ERP record changes from v1.4 to v1.5. The earlier snapshot is retained, but a fresh test is required." },
];
export const tourStepCount = tourSteps.length;
export const tourMediaRevision = "minimal-4s-v29";

export function tourTargetSelectors(item, compact) {
  return [...new Set([compact && item.compactTarget, item.target, '[data-tour="guide"]'].filter(Boolean))];
}

export function tourPreferencesEnabled(search) {
  const params = new URLSearchParams(search);
  return !["showcase", "capture", "embedded"].some((key) => params.has(key));
}

export function readTour(storage) {
  try {
    const value = JSON.parse(storage.getItem(tourStorageKey));
    if (!value || ![1, 2].includes(value.version) || !["in_progress", "completed", "skipped"].includes(value.status)) return null;
    const count = value.version === 1 ? 4 : tourStepCount;
    if (!Number.isInteger(value.step) || value.step < 0 || value.step >= count) return null;
    // Keep completed/skipped tours closed; old step4 was the review handoff.
    const step = value.version === 1 && value.step === 3 ? 4 : value.step;
    return { version: 2, status: value.status, step };
  } catch {
    return null;
  }
}

export function saveTour(storage, status, step) {
  if (!["in_progress", "completed", "skipped"].includes(status) || !Number.isInteger(step) || step < 0 || step >= tourStepCount) return false;
  try {
    storage.setItem(tourStorageKey, JSON.stringify({ version: 2, status, step }));
    return true;
  } catch {
    return false;
  }
}

export function initialTourStep(search, preference, review) {
  if (!tourPreferencesEnabled(search) || new URLSearchParams(search).has("guide")) return null;
  if (preference) return preference.status === "in_progress" ? preference.step : null;
  // A new tour must not interrupt an existing draft, test or human decision.
  const pristine = review.role === "operator" && review.phase === "idle" &&
    !review.candidateId && !review.reason && !review.revision &&
    !review.sourceEpoch && !review.orderGeneration &&
    review.sourceAccess.invoice && review.sourceAccess.order &&
    review.proposals.length === 0 && review.tests.length === 0 && review.audit.length === 0;
  return pristine ? 0 : null;
}

// Place the coachmark beside its subject; clamp the card on small viewports.
export function tourPlacement(target, viewport, card) {
  const padding = 16;
  const gap = 16;
  const width = Math.min(card.width, viewport.width - padding * 2);
  const height = Math.min(card.height, viewport.height - padding * 2);
  const clamp = (n, max, size) => Math.max(padding, Math.min(n, max - size - padding));
  const centeredX = clamp(target.left + target.width / 2 - width / 2, viewport.width, width);
  const centeredY = clamp(target.top + target.height / 2 - height / 2, viewport.height, height);
  const candidates = [
    { left: target.right + gap, top: centeredY },
    { left: target.left - gap - width, top: centeredY },
    { left: centeredX, top: target.bottom + gap },
    { left: centeredX, top: target.top - gap - height },
  ];
  const fits = (p) => p.left >= padding && p.top >= padding &&
    p.left + width <= viewport.width - padding && p.top + height <= viewport.height - padding;
  return candidates.find(fits) || {
    left: centeredX,
    top: clamp(target.bottom + gap, viewport.height, height),
  };
}

export const navigationStorageKey = "noematrace.navigation.v1";
export function readNavigation(storage, search) {
  if (!tourPreferencesEnabled(search)) return false;
  try {
    const preference = JSON.parse(storage.getItem(navigationStorageKey));
    return preference?.version === 1 && preference.collapsed === true;
  } catch { return false; }
}
export function saveNavigation(storage, search, collapsed) {
  if (!tourPreferencesEnabled(search)) return false;
  try {
    storage.setItem(navigationStorageKey, JSON.stringify({ version: 1, collapsed: Boolean(collapsed) }));
    return true;
  } catch { return false; }
}
