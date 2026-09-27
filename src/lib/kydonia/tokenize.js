// KYDONIA — tokenizer. The index builder, the query parser and the snippet
// highlighter all use this one implementation, so a term always matches itself.

const STOPWORDS = new Set(
  ("a about above after again against all am an and any are as at be because been before being below between both but by can cannot could did do does doing down during each few for from further had has have having he her here hers herself him himself his how i if in into is it its itself just me more most my myself no nor not now of off on once only or other our ours ourselves out over own same she should so some such than that the their theirs them themselves then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours yourself yourselves").split(" ")
);

// Suffix stripping only — enough to fold plurals and tenses together, and it
// keeps the stem a prefix of the original word, which is what lets the snippet
// highlighter find a stemmed query term inside the raw page text.
const SUFFIXES = ["ingly", "edly", "ation", "ness", "ment", "ing", "ies", "ied", "est", "er", "ed", "ly", "es", "s"];

export function stem(word) {
  if (word.length <= 4) return word;
  for (const suffix of SUFFIXES) {
    if (word.endsWith(suffix) && word.length - suffix.length >= 3) {
      return word.slice(0, -suffix.length);
    }
  }
  return word;
}

export function tokenize(text) {
  if (!text) return [];
  const words = String(text).toLowerCase().match(/[a-z0-9\u00c0-\u024f]+/g) || [];
  const out = [];
  for (const word of words) {
    if (word.length < 2 || STOPWORDS.has(word)) continue;
    out.push(stem(word));
  }
  return out;
}

// Quoted runs become phrases (matched on adjacent positions); everything else
// is a scored term.
export function parseQuery(query) {
  const src = String(query || "");
  const phrases = [];
  const terms = [];

  for (const quoted of src.match(/"[^"]+"/g) || []) {
    const inner = tokenize(quoted.slice(1, -1));
    if (inner.length > 1) phrases.push(inner);
    else if (inner.length === 1 && !terms.includes(inner[0])) terms.push(inner[0]);
  }

  for (const term of tokenize(src.replace(/"[^"]+"/g, " "))) {
    if (!terms.includes(term)) terms.push(term);
  }

  return { terms, phrases };
}

// Every term a query actually looks for — used for highlighting and explaining.
export function queryTerms(query) {
  const { terms, phrases } = parseQuery(query);
  const all = [...terms];
  for (const phrase of phrases) {
    for (const term of phrase) if (!all.includes(term)) all.push(term);
  }
  return all;
}