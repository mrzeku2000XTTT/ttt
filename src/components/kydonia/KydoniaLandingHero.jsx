import React, { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import KydoniaAscii from "./KydoniaAscii";

export default function KydoniaLandingHero({ hasWallet, loading, error, onConnect, onSeed }) {
  const [url, setUrl] = useState("");

  const submit = (event) => {
    event.preventDefault();
    const value = url.trim();
    if (!value) return;
    onSeed(value);
  };

  return (
    <section className="kyd-grid-bg border-b border-[#23262d]">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:py-20">
        <div className="flex flex-col justify-center">
          <span className="kyd-chip w-fit">Mars-class text retrieval</span>

          <h1 className="mt-6 text-[34px] leading-[1.08] sm:text-[46px]">
            Every page you paste,
            <br />
            <span className="kyd-grad-text">queryable in seconds.</span>
          </h1>

          <p className="kyd-sans mt-5 max-w-lg text-[14px] leading-relaxed text-[#a29d94]">
            KYDONIA fetches a page once, folds it into an inverted index on your device, and ranks
            every answer with BM25 — deterministic, offline, with the source of each hit attached.
          </p>

          <form onSubmit={submit} className="mt-8 max-w-lg">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                className="kyd-input"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="paste any url — https://example.com/article"
                aria-label="Paste a URL to index"
              />
              <button type="submit" className="kyd-btn kyd-btn-primary shrink-0" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                Index it
              </button>
            </div>
            <p className="kyd-sans mt-3 text-[12px] text-[#7d7871]">
              Fetched once, indexed on your device, never shared.
            </p>
            {error && <p className="kyd-sans mt-2 text-[12px] text-[#ff9d7a]">{error}</p>}
          </form>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button type="button" className="kyd-btn" onClick={() => (hasWallet ? onSeed() : onConnect())}>
              {hasWallet ? "Enter the catalogue" : "Connect Scorpion"}
            </button>
            <span className="kyd-dim text-[11px] tracking-[0.08em] uppercase">
              {hasWallet ? "Wallet connected" : "Wallet gate opens once, at the door"}
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <div className="kyd-panel overflow-hidden p-4">
            <div className="kyd-row mb-3 text-[10px] tracking-[0.14em] text-[#7d7871] uppercase">
              <span>Terrain survey</span>
              <span className="kyd-mono-num">Cydonia · 74 × 44 cells</span>
            </div>
            <KydoniaAscii rows={44} cols={74} />
            <div className="kyd-row mt-3 border-t border-[#23262d] pt-3 text-[10px] tracking-[0.1em] text-[#7d7871] uppercase">
              <span>Rendered in characters, live</span>
              <span>Index builds in your browser</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}