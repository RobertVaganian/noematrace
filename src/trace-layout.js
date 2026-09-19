import { tourPreferencesEnabled } from "./onboarding.js";

export const traceLayoutKey = "noematrace.trace-layout.v1";
export const defaultLogHeight = 277;
export const traceDividerHeight = 9;

export function logHeightBounds(available) {
  return { min: 140, max: Number.isFinite(available) && available > 0 ? Math.max(140, Math.floor(available) - 300 - traceDividerHeight) : defaultLogHeight };
}

export function clampLogHeight(value, bounds) {
  const height = Number.isFinite(value) ? value : defaultLogHeight;
  return Math.round(Math.max(bounds.min, Math.min(bounds.max, height)));
}

export function logHeightFromKey(key, current, bounds, accelerated = false) {
  const step = accelerated ? 64 : 24;
  const targets = { ArrowUp: current + step, ArrowDown: current - step, Home: bounds.min, End: bounds.max, Enter: defaultLogHeight };
  return Object.hasOwn(targets, key) ? clampLogHeight(targets[key], bounds) : null;
}

export function readTraceHeight(storage, search) {
  if (!tourPreferencesEnabled(search)) return defaultLogHeight;
  try {
    const value = JSON.parse(storage.getItem(traceLayoutKey));
    return value?.version === 1 && Number.isFinite(value.height) && value.height >= 140 ? value.height : defaultLogHeight;
  } catch { return defaultLogHeight; }
}

export function saveTraceHeight(storage, search, height) {
  if (!tourPreferencesEnabled(search) || !Number.isFinite(height) || height < 140) return false;
  try {
    storage.setItem(traceLayoutKey, JSON.stringify({ version: 1, height }));
    return true;
  } catch { return false; }
}
