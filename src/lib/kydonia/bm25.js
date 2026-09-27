import { parseQuery } from "./tokenize";

// The standard BM25 parameters, exported so the UI can state them honestly.
export const K1 = 1.2;
export const B = 0.75;
export const PHRASE_BONUS = 2.5;

function matchesPhrase(hits, phrase) {
  const byTerm = new Map(hits.map((hit) => [hit.term, hit.positions]));
  const starts = byTerm.get(phrase[0]);
  if (!starts) return false;
  for (const start of starts) {
    let ok = true;
    for (let i = 1; i < phrase.length; i += 1) {
      const list = byTerm.get(phrase[i]);
      if (!list || !list.includes(start + i)) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  return false;
}

/**
 * Ranks documents against a query.
 * Returns [{ docId, score, bonus, hits: [{ term, tf, idf, contribution }] }],
 * best first. Deterministic — the same index and query always rank the same.
 */
export function search(index, query, limit = 40) {
  if (!index || !index.docCount) return [];
  const { terms, phrases } = parseQuery(query);

  const allTerms = [...terms];
  for (const phrase of phrases) {
    for (const term of phrase) if (!allTerms.includes(term)) allTerms.push(term);
  }
  if (!allTerms.length) return [];

  const docById = new Map(index.docs.map((doc) => [doc.id, doc]));
  const scored = new Map();

  for (const term of allTerms) {
    const postings = index.postings.get(term);
    if (!postings) continue;
    const df = postings.size;
    const idf = Math.log(1 + (index.docCount - df + 0.5) / (df + 0.5));

    postings.forEach(({ tf, positions }, docId) => {
      const doc = docById.get(docId);
      if (!doc) return;
      const norm = 1 - B + B * (doc.length / (index.avgdl || 1));
      const contribution = idf * ((tf * (K1 + 1)) / (tf + K1 * norm));
      let entry = scored.get(docId);
      if (!entry) {
        entry = { docId, score: 0, bonus: 0, hits: [] };
        scored.set(docId, entry);
      }
      entry.score += contribution;
      entry.hits.push({ term, tf, idf, contribution, positions: positions || null });
    });
  }

  for (const entry of scored.values()) {
    for (const phrase of phrases) {
      if (matchesPhrase(entry.hits, phrase)) {
        entry.score += PHRASE_BONUS;
        entry.bonus += PHRASE_BONUS;
      }
    }
    entry.hits.sort((a, b) => b.contribution - a.contribution);
  }

  return [...scored.values()].sort((a, b) => b.score - a.score).slice(0, limit);
}