# Local order matching

The **AI · Match order** control opens an item-matching workspace. The same entry is available beside manual order search. It compares short English descriptions with the three available synthetic purchase orders. It does not search an ERP or infer missing financial data.

Try **supplier wording** to replace the matching phrases with temperature probes, installation brackets and delivery. The invoice itself stays unchanged. You can edit up to five short phrases, one per line. Unrelated phrases can produce no close match.

## What runs

An explicit **Load model & match items** action starts a module Web Worker. Transformers.js 3.8.1 loads the quantized `Xenova/all-MiniLM-L6-v2` model at revision `751bff37182d3f1213fa05d7196b954e230abad9`. WASM runs on the CPU with one inference thread. No API key, paid inference account or WebGPU support is required.

Normalized mean-pooled embeddings compare each phrase with each order line and compare the combined phrases with the order description. The combined score uses 60% mean per-phrase similarity and 40% description similarity. A conservative wording gate requires at least 0.38 overall and 0.30 for each closest line. These are prototype thresholds, not calibrated confidence probabilities or evaluated financial accuracy.

Related orders passing all four exact source checks appear first; the remaining orders follow semantic similarity. Line links may repeat an order line: this is closest-description retrieval, not a complete accounting reconciliation. The existing ordered line-item test remains the authority on exact record equality. IDs, quantities, prices, supplier checks and totals are always read from application records.

## What changes

Nothing in the review changes during inference. **Inspect in review** explicitly selects the candidate through the existing reducer. It neither writes an explanation nor starts a test, creates a proposal or records a Finance decision. Submitted drafts and Finance roles cannot use that selection action.

Results carry a fingerprint of the source versions, availability, epoch, records and matching phrases. Changed or unavailable sources cannot reuse the result. Cancel, close, unload and timeout terminate the worker; late responses are ignored. Missing candidates, unknown IDs, invalid source-line indices and non-finite scores are rejected.

## Downloads and privacy

First use downloads approximately 50 MB, including about 23 MB of model weights. Runtime files come from jsDelivr and model files from Hugging Face. The hosts receive ordinary asset requests; phrases and records are not sent to an inference endpoint. Browser caching may support later offline use, but retained files and storage permissions vary. Unload releases the worker. Remove model files deletes this model’s entries from this site’s accessible cache; shared runtime assets may remain.

**Preview source checks** is an immediate deterministic comparison, clearly labelled **no model running**. It does not simulate an AI result.

## Implementation and checks

- `src/order-match.js`: source context, freshness, admissible matches and ranking.
- `src/order-match-worker.js`: local embeddings and closest line references.
- `src/order-match-runtime.js`: worker lifecycle, cancellation, timeout and cache removal.
- `src/OrderMatcher.jsx`: matching terms, original fields, alternatives and explicit review handoff.
- `tests/order-match.test.mjs`: stale evidence, wrong suppliers, unrelated wording, role restrictions, malformed output and worker recovery.

Upstream: [Transformers.js pipeline documentation](https://huggingface.co/docs/transformers.js/pipelines), [model files and model card](https://huggingface.co/Xenova/all-MiniLM-L6-v2), [Transformers.js source and Apache-2.0 licence](https://github.com/huggingface/transformers.js). The model repository also uses Apache-2.0. Runtime and weights are fetched on demand, not bundled in this repository.
