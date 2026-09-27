// KYDONIA — passage extraction. Finds the densest window of query terms in the
// page text and returns it with the exact character ranges to highlight.
// Stems are prefixes of their words, so a stemmed term is found with indexOf.

const MAX_OCCURRENCES = 600;

export function bestSnippet(text, terms, radius = 190) {
  const source = String(text || "");
  if (!source) return { text: "", ranges: [], lead: false, tail: false };

  const lower = source.toLowerCase();
  const occurrences = [];
  for (const term of terms) {
    if (!term || term.length < 2) continue;
    let at = lower.indexOf(term);
    while (at !== -1 && occurrences.length < MAX_OCCURRENCES) {
      occurrences.push({ term, at });
      at = lower.indexOf(term, at + 1);
    }
  }

  if (!occurrences.length) {
    const head = source.slice(0, radius * 2);
    return { text: head, ranges: [], lead: false, tail: source.length > head.length };
  }

  let best = { at: occurrences[0].at, hits: 0 };
  for (const occurrence of occurrences) {
    const from = occurrence.at - radius;
    const to = occurrence.at + radius;
    const hits = new Set(
      occurrences.filter((o) => o.at >= from && o.at <= to).map((o) => o.term)
    ).size;
    if (hits > best.hits) best = { at: occurrence.at, hits };
  }

  let start = Math.max(0, best.at - radius);
  let end = Math.min(source.length, best.at + radius);
  if (start > 0) {
    const space = source.indexOf(" ", start);
    if (space !== -1 && space < start + 40) start = space + 1;
  }
  if (end < source.length) {
    const space = source.lastIndexOf(" ", end);
    if (space !== -1 && space > end - 40) end = space;
  }

  const slice = source.slice(start, end);
  const leadingSpace = slice.length - slice.trimStart().length;
  const body = slice.trim();
  const sliceLower = body.toLowerCase();

  const ranges = [];
  for (const term of terms) {
    if (!term || term.length < 2) continue;
    let at = sliceLower.indexOf(term);
    while (at !== -1) {
      ranges.push({ start: at, end: Math.min(body.length, at + term.length) });
      at = sliceLower.indexOf(term, at + term.length);
    }
  }
  ranges.sort((a, b) => a.start - b.start);

  const merged = [];
  for (const range of ranges) {
    const last = merged[merged.length - 1];
    if (last && range.start <= last.end) last.end = Math.max(last.end, range.end);
    else merged.push({ start: range.start, end: range.end });
  }

  return { text: body, ranges: merged, lead: start > 0, tail: end < source.length, offset: leadingSpace };
}