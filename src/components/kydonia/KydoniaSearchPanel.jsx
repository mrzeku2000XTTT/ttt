import React from "react";
import { Search } from "lucide-react";
import { bestSnippet } from "@/lib/kydonia/snippets";
import KydoniaRankExplainer from "./KydoniaRankExplainer";

function Snippet({ text, ranges, lead, tail }) {
  const parts = [];
  let cursor = 0;
  ranges.forEach((range, index) => {
    if (range.start > cursor) parts.push(<span key={`t${index}`}>{text.slice(cursor, range.start)}</span>);
    parts.push(<mark key={`m${index}`}>{text.slice(range.start, range.end)}</mark>);
    cursor = range.end;
  });
  if (cursor < text.length) parts.push(<span key="tail">{text.slice(cursor)}</span>);

  return (
    <p className="kyd-sans mt-2 text-[12px] leading-relaxed text-[#b6b0a8]">
      {lead && "… "}
      {parts}
      {tail && " …"}
    </p>
  );
}

export default function KydoniaSearchPanel({
  query,
  onQueryChange,
  terms,
  results,
  byId,
  selectedId,
  onSelect,
  indexStats,
  hostFilter,
}) {
  const selected = results.find((result) => result.docId === selectedId) || null;

  return (
    <section className="kyd-search-split min-h-0">
      <div className="flex min-h-0 flex-col">
        <div className="border-b border-[#23262d] p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#7d7871]" />
            <input
              className="kyd-input pl-9"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder='search your catalogue — try "algorithm" or a "quoted phrase"'
              aria-label="Search the index"
            />
          </div>
          <div className="kyd-row mt-3 text-[10px] tracking-[0.1em] text-[#7d7871] uppercase">
            <span className="kyd-mono-num">
              {indexStats.docs} sources · {indexStats.terms} terms
              {hostFilter !== "all" ? ` · ${hostFilter}` : ""}
            </span>
            <span className="kyd-mono-num">
              {query ? `${results.length} hit${results.length === 1 ? "" : "s"} · ${indexStats.ms} ms` : "ready"}
            </span>
          </div>
        </div>

        <div className="kyd-scroll min-h-0 flex-1 p-4">
          {!query && (
            <div className="kyd-panel-2 p-5">
              <p className="text-[12px] text-[#e8dcc8]">Query the catalogue</p>
              <p className="kyd-sans mt-2 text-[12px] leading-relaxed text-[#8f8a83]">
                Terms are stemmed, weighted by field, and scored with BM25. Wrap words in quotes to
                require them adjacent. Select a result to see its maths.
              </p>
            </div>
          )}

          {query && !results.length && (
            <div className="kyd-panel-2 p-5">
              <p className="text-[12px] text-[#e8dcc8]">No matches for “{query}”</p>
              <p className="kyd-sans mt-2 text-[12px] text-[#8f8a83]">
                Nothing in your indexed pages contains those terms.
              </p>
            </div>
          )}

          {results.map((result) => {
            const source = byId.get(result.docId);
            if (!source) return null;
            const snippet = bestSnippet(source.text, terms);
            const isSelected = result.docId === selectedId;

            return (
              <button
                key={result.docId}
                type="button"
                onClick={() => onSelect(isSelected ? null : result.docId)}
                className={`mb-3 block w-full rounded-[12px] border p-4 text-left transition-colors ${
                  isSelected
                    ? "border-[#ff7a45]/50 bg-[#16110d]"
                    : "border-[#23262d] bg-[#101216] hover:border-[#33383f]"
                }`}
              >
                <div className="kyd-row">
                  <span className="truncate text-[12px] text-[#e8dcc8]">{source.title || source.host}</span>
                  <span className="kyd-score shrink-0">{result.score.toFixed(3)}</span>
                </div>
                <p className="mt-1 text-[10px] tracking-[0.08em] text-[#7d7871] uppercase">
                  {source.host} · {result.hits.length} term{result.hits.length === 1 ? "" : "s"} matched
                  {result.bonus > 0 ? " · phrase" : ""}
                </p>
                <Snippet {...snippet} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 border-t border-[#23262d] p-4 lg:border-t-0 lg:border-l">
        <KydoniaRankExplainer result={selected} source={selected ? byId.get(selected.docId) : null} />
      </div>
    </section>
  );
}