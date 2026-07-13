import React, { useState } from "react";
import { Loader2, Scissors } from "lucide-react";

export default function KlipzInput({ onAnalyze, loading }) {
  const [url, setUrl] = useState("");

  return (
    <div className="max-w-2xl mx-auto px-4" style={{ fontFamily: "monospace" }}>
      <form
        onSubmit={(e) => { e.preventDefault(); if (url.trim()) onAnalyze(url.trim()); }}
        className="flex gap-2"
      >
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="PASTE A YOUTUBE VIDEO OR LIVE STREAM LINK"
          className="flex-1 bg-black border border-zinc-700 px-4 py-3.5 text-xs text-white placeholder:text-zinc-600 focus:border-cyan-400 focus:outline-none"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="px-5 py-3.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black text-[11px] font-bold tracking-[0.15em] transition-colors whitespace-nowrap flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Scissors className="w-3.5 h-3.5" />}
          {loading ? "SCANNING…" : "FIND CLIPS"}
        </button>
      </form>
      <p className="mt-2 text-center text-[9px] text-zinc-600 tracking-widest uppercase">
        AI scans the content and drafts the moments worth posting
      </p>
    </div>
  );
}