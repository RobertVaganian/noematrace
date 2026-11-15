import { MATCH_MODEL, rankOrders } from './order-match.js';

export function createMatchRuntime(onChange, { workerFactory = () => new Worker(new URL('./order-match-worker.js', import.meta.url), { type: 'module' }), deadline = 120000 } = {}) {
  let worker = null, timer = null, epoch = 0;
  const value = { phase: 'idle', loaded: false, progress: null, message: '', result: null };
  const emit = () => onChange({ ...value });
  function stop(message = 'Model unloaded. Downloaded files may remain in the browser cache.') {
    ++epoch; clearTimeout(timer); worker?.terminate(); worker = null;
    Object.assign(value, { phase: 'idle', loaded: false, progress: null, result: null, message }); emit();
  }
  function fail(message) { stop(message); value.phase = 'error'; emit(); }
  function match(input) {
    if (!input.available || !input.valid || ['loading', 'matching', 'removing'].includes(value.phase)) return false;
    const requestId = ++epoch;
    Object.assign(value, { phase: value.loaded ? 'matching' : 'loading', progress: null, result: null, message: value.loaded ? 'Comparing item descriptions…' : 'Loading the local model…' }); emit();
    try {
      worker ||= workerFactory();
      const active = worker;
      worker.onmessage = ({ data }) => {
        if (epoch !== requestId || active !== worker || data.requestId !== requestId) return;
        if (data.type === 'ready') { value.loaded = true; return; }
        if (data.type === 'status') { Object.assign(value, { phase: data.phase, progress: data.progress ?? null, message: data.message }); emit(); }
        if (data.type === 'complete') {
          clearTimeout(timer);
          const rows = rankOrders(input, data.scores);
          if (data.fingerprint !== input.fingerprint || rows.length !== input.candidates.length) { fail('The matching result was incomplete. Try again.'); return; }
          Object.assign(value, { phase: 'complete', progress: null, message: 'Compared on this device.', result: { fingerprint: data.fingerprint, phrases: [...input.phrases], rows } }); emit();
        }
        if (data.type === 'error') fail('The local model could not run here. Check your connection or preview the source checks.');
      };
      worker.onerror = () => { if (epoch === requestId) fail('This browser could not run the model. The source checks remain available.'); };
      timer = setTimeout(() => { if (epoch === requestId) fail('The local run took too long and was stopped. You can retry.'); }, deadline);
      worker.postMessage({ type: 'match', requestId, fingerprint: input.fingerprint, phrases: input.phrases, documents: input.documents });
      return true;
    } catch { fail('This browser could not start the local worker. Preview the source checks instead.'); return false; }
  }
  async function removeModel() {
    stop('Removing downloaded model files…'); value.phase = 'removing'; emit();
    try {
      if (!globalThis.caches) throw new Error('Cache unavailable');
      for (const name of await caches.keys()) {
        const cache = await caches.open(name);
        for (const request of await cache.keys()) if (decodeURIComponent(request.url).includes(`${MATCH_MODEL.id}/resolve/`)) await cache.delete(request);
      }
      value.message = 'Model files removed from this site’s cache. Shared runtime files may remain.';
    } catch { value.message = 'Model unloaded. Clear the browser’s site data to remove any retained files.'; }
    value.phase = 'idle'; emit();
  }
  return { value, match, stop, removeModel };
}
