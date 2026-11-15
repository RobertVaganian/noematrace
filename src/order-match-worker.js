import { MATCH_MODEL } from './order-match.js';
let extractor;
const dot = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0);
self.onmessage = async ({ data }) => {
  if (data.type !== 'match') return;
  const { requestId, fingerprint, phrases, documents } = data;
  const send = message => self.postMessage({ ...message, requestId });
  try {
    if (!extractor) {
      const { pipeline, env } = await import(/* @vite-ignore */ MATCH_MODEL.runtime);
      env.allowLocalModels = false;
      env.useBrowserCache = true;
      env.backends.onnx.wasm.numThreads = 1;
      let last = 0;
      extractor = await pipeline('feature-extraction', MATCH_MODEL.id, {
        revision: MATCH_MODEL.revision, device: 'wasm', dtype: 'q8',
        progress_callback: p => {
          if (p.status === 'progress' && performance.now() - last > 180) {
            last = performance.now();
            send({ type: 'status', phase: 'loading', message: p.file?.endsWith('.onnx') ? 'Loading model weights…' : 'Loading model files…', progress: Math.min(100, Math.max(0, Math.round(p.progress || 0))) });
          }
        },
      });
      send({ type: 'ready' });
    }
    send({ type: 'status', phase: 'matching', message: 'Comparing the wording of each invoice item…' });
    const texts = [...phrases, phrases.join('. '), ...documents.flatMap(d => [d.text, ...d.lines])];
    const vectors = (await extractor(texts, { pooling: 'mean', normalize: true })).tolist();
    let offset = phrases.length + 1;
    const scores = documents.map(doc => {
      const context = vectors[offset++];
      const lineVectors = vectors.slice(offset, offset + doc.lines.length);
      offset += doc.lines.length;
      const pairs = phrases.map((_, queryIndex) => {
        const lineScores = lineVectors.map(v => dot(vectors[queryIndex], v));
        const score = Math.max(...lineScores);
        return { queryIndex, lineIndex: lineScores.indexOf(score), score };
      });
      const coverage = pairs.reduce((sum, p) => sum + p.score, 0) / pairs.length;
      return { id: doc.id, score: coverage * .6 + dot(vectors[phrases.length], context) * .4, pairs };
    });
    send({ type: 'complete', fingerprint, scores });
  } catch { send({ type: 'error' }); }
};
