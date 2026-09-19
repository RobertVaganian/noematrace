// Preserve every character; only classify presentation tokens, never parse evidence.
export function dataTokens(value) {
  const text = String(value ?? '');
  const pattern = /\b(?:EUR|USD|GBP|AMD)\s+\d[\d,]*(?:\.\d{2})?|\b[A-Z]{2,5}-\d+(?:-v\d+)?\b|\bv\d+(?:\.\d+)*\b|\b\d{2}:\d{2}(?::\d{2})?\b|\b\d{1,2}\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{4}\b/g;
  const result = [];
  let end = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > end) result.push({ text: text.slice(end, match.index), data: false });
    result.push({ text: match[0], data: true });
    end = match.index + match[0].length;
  }
  if (end < text.length) result.push({ text: text.slice(end), data: false });
  return result;
}
