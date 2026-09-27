import React from "react";
import { ExternalLink } from "lucide-react";
import { K1, B, PHRASE_BONUS } from "@/lib/kydonia/bm25";
import { FIELD_WEIGHTS } from "@/lib/kydonia/buildIndex";

export default function KydoniaRankExplainer({ result, source }) {
  if (!result || !source) {
    return (
      <div className="kyd-panel-2 p-5">
        <p className="text-[11px] tracking-[0.12em] text-[#7d7871] uppercase">Ranking explainer</p>
        <p className="kyd-sans mt-3 text-[12px] leading-relaxed text-[#8f8a83]">
          Select a result to see the per-term maths behind its score.
        </p>
        <div className="mt-4 space-y-1 border-t border-[#23262d] pt-4 text-[11px] text-[#7d7871]">
          <p>k1 = {K1} · b = {B}</p>
          <p>phrase bonus = {PHRASE_BONUS}</p>
          <p>
            fields = title ×{FIELD_WEIGHTS.title} · headings ×{FIELD_WEIGHTS.headings} · body ×
            {FIELD_WEIGHTS.body}
          </p>
        </div>
      </div>
    );
  }

  const maxContribution = Math.max(...result.hits.map((hit) => hit.contribution), 0.0001);

  return (
    <div className="kyd-panel-2 flex h-full min-h-0 flex-col p-5">
      <p className="text-[11px] tracking-[0.12em] text-[#7d7871] uppercase">Ranking explainer</p>

      <div className="mt-4 flex items-baseline justify-between">
        <span className="kyd-dim text-[11px] uppercase">Total score</span>
        <span className="kyd-mono-num text-[18px] text-[#ff7a45]">{result.score.toFixed(3)}</span>
      </div>

      <div className="kyd-scroll mt-4 min-h-0 flex-1 space-y-3 pr-1">
        {result.hits.map((hit) => (
          <div key={hit.term}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[12px] text-[#e8dcc8]">{hit.term}</span>
              <span className="kyd-mono-num text-[11px] text-[#ff7a45]">{hit.contribution.toFixed(3)}</span>
            </div>
            <div className="mt-1 h-[3px] w-full overflow-hidden rounded-full bg-[#1c2026]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#d1471f] to-[#ff7a45]"
                style={{ width: `${Math.max(3, (hit.contribution / maxContribution) * 100)}%` }}
              />
            </div>
            <p className="kyd-mono-num mt-1 text-[10px] text-[#7d7871]">
              tf {hit.tf} · idf {hit.idf.toFixed(3)} · k1 {K1} · b {B}
            </p>
          </div>
        ))}

        {result.bonus > 0 && (
          <div className="border-t border-[#23262d] pt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-[12px] text-[#e8dcc8]">phrase bonus</span>
              <span className="kyd-mono-num text-[11px] text-[#ff7a45]">+{result.bonus.toFixed(3)}</span>
            </div>
            <p className="kyd-sans mt-1 text-[11px] text-[#7d7871]">
              Quoted terms found on adjacent positions.
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 border-t border-[#23262d] pt-4">
        <p className="text-[11px] text-[#e8dcc8]">{source.title || source.host}</p>
        <p className="kyd-sans mt-1 text-[11px] text-[#8f8a83]">
          {source.host} · {source.char_count?.toLocaleString?.() || 0} chars ·{" "}
          {source.token_count?.toLocaleString?.() || 0} terms
        </p>
        <a
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className="kyd-sans mt-2 inline-flex items-center gap-1 text-[11px] text-[#ff7a45] hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          Open the source
        </a>
      </div>
    </div>
  );
}