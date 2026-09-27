import { tokenize } from "./tokenize";

// Field weights — a term in the title counts three times, a heading twice.
// Exported so the ranking explainer can show the real numbers.
export const FIELD_WEIGHTS = { title: 3, headings: 2, body: 1 };

const MAX_POSITIONS = 96;

/**
 * Builds an inverted index over the user's sources.
 * postings: term -> Map(docId -> { tf, positions })
 * docs:     [{ id, length }]  — length is the body token count
 */
export function buildIndex(sources) {
  const postings = new Map();
  const docs = [];
  let totalLength = 0;

  for (const source of sources || []) {
    const docId = source.id;
    const bodyTokens = tokenize(source.text || "");
    const headingTokens = tokenize((source.headings || []).join(" \n "));
    const titleTokens = tokenize(source.title || "");

    const frequencies = new Map();
    const positions = new Map();

    const absorb = (tokens, weight, trackPositions) => {
      tokens.forEach((term, i) => {
        frequencies.set(term, (frequencies.get(term) || 0) + weight);
        if (!trackPositions) return;
        if (!positions.has(term)) positions.set(term, []);
        const list = positions.get(term);
        if (list.length < MAX_POSITIONS) list.push(i);
      });
    };

    absorb(bodyTokens, FIELD_WEIGHTS.body, true);
    absorb(headingTokens, FIELD_WEIGHTS.headings, false);
    absorb(titleTokens, FIELD_WEIGHTS.title, false);

    for (const [term, tf] of frequencies) {
      if (!postings.has(term)) postings.set(term, new Map());
      postings.get(term).set(docId, { tf, positions: positions.get(term) || null });
    }

    const length = bodyTokens.length || 1;
    docs.push({ id: docId, length });
    totalLength += length;
  }

  return {
    postings,
    docs,
    docCount: docs.length,
    avgdl: docs.length ? totalLength / docs.length : 1,
    termCount: postings.size,
    builtAt: Date.now(),
  };
}