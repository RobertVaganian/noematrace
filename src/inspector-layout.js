import { tourPreferencesEnabled } from "./onboarding.js";

export const inspectorLayoutKey = "noematrace.inspector-layout.v1";
export function inspectorBounds(available) {
  return { min: 296, max: Math.max(296, Math.min(480, Math.floor(available || 745) - 449)) };
}
export function defaultInspectorWidth(viewport) {
  return viewport > 1250 ? 342 : viewport > 1050 ? 304 : 296;
}
export function clampInspectorWidth(value, bounds) {
  return Math.round(Math.max(bounds.min, Math.min(bounds.max, value)));
}
export function inspectorWidthFromKey(key, current, bounds, initial, accelerated = false) {
  const step = accelerated ? 64 : 24;
  const targets = { ArrowLeft: current + step, ArrowRight: current - step, Home: bounds.min, End: bounds.max, Enter: initial };
  return Object.hasOwn(targets, key) ? clampInspectorWidth(targets[key], bounds) : null;
}
export function readInspectorWidth(storage, search) {
  if (!tourPreferencesEnabled(search)) return null;
  try {
    const value = JSON.parse(storage.getItem(inspectorLayoutKey));
    return value?.version === 1 && Number.isFinite(value.width) && value.width >= 296 && value.width <= 480 ? value.width : null;
  } catch { return null; }
}
export function saveInspectorWidth(storage, search, width) {
  if (!tourPreferencesEnabled(search) || (width !== null && (!Number.isFinite(width) || width < 296 || width > 480))) return false;
  try { storage.setItem(inspectorLayoutKey, JSON.stringify({ version: 1, width })); return true; }
  catch { return false; }
}
