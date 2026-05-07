import React, { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RefreshCw, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import DoomSearch from "@/components/doom/DoomSearch";
import DoomCard from "@/components/doom/DoomCard";

/**
 * Doom — search any topic, fall into an infinite scroll of dark facts
 * pulled from Grokipedia, each visualized with a haunting AI image.
 */
export default function DoomPage() {
  const [query, setQuery] = useState(null);
  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [facts, setFacts] = useState([]); // { fact, image_prompt }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const containerRef = useRef(null);

  const fetchFacts = useCallback(async (q, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("doomScrollFacts", { query: q, count: 10 });
      const data = res?.data || {};
      if (!data.found) {
        setError(data.message || `No knowledge found for "${q}".`);
        setLoading(false);
        return;
      }
      if (append) {
        setFacts((prev) => [...prev, ...(data.facts || [])]);
      } else {
        setTitle(data.title || q);
        setSourceUrl(data.source_url || "");
        setFacts(data.facts || []);
      }
    } catch (e) {
      setError(e.message || "Failed to fall.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const handleSearch = (q) => {
    setQuery(q);
    fetchFacts(q, false);
  };

  const reset = () => {
    setQuery(null);
    setFacts([]);
    setTitle("");
    setError(null);
  };

  // Infinite scroll: when user nears the bottom, fetch more facts on the same topic.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !query || facts.length === 0) return;
    const onScroll = () => {
      if (loadingMore || loading) return;
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (scrollTop + clientHeight >= scrollHeight - clientHeight * 1.5) {
        fetchFacts(query, true);
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [query, facts.length, loadingMore, loading, fetchFacts]);

  // ── Search screen ─────────────────────────────────────────────────────
  if (!query) {
    return (
      <>
        <DoomSearch onSearch={handleSearch} loading={loading} />
        <Link
          to="/AppStoreV2"
          className="fixed top-4 left-4 z-50 flex items-center gap-1.5 px-3 h-9 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-white/60 hover:text-white text-xs font-bold backdrop-blur"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Link>
      </>
    );
  }

  // ── Loading first batch ───────────────────────────────────────────────
  if (loading && facts.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-4" />
        <div className="text-red-400/80 text-[10px] font-bold tracking-[0.4em] uppercase mb-2">Descending</div>
        <div className="text-white/60 text-sm">Pulling truths about "{query}"…</div>
      </div>
    );
  }

  // ── Error / empty ─────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white px-6">
        <div className="text-red-500 text-xs font-bold tracking-widest uppercase mb-4">Void</div>
        <div className="text-white/70 text-center text-sm mb-6 max-w-md">{error}</div>
        <button
          onClick={reset}
          className="px-5 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-bold"
        >
          Try another topic
        </button>
      </div>
    );
  }

  // ── Infinite feed ─────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black overflow-y-scroll snap-y snap-mandatory overscroll-contain"
      style={{ scrollbarWidth: "none" }}
    >
      <style>{`div::-webkit-scrollbar { display: none; }`}</style>

      {/* Top header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black via-black/70 to-transparent">
        <button
          onClick={reset}
          className="flex items-center gap-1.5 px-3 h-9 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white text-xs font-bold backdrop-blur"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> New
        </button>
        <div className="text-white/80 text-xs font-bold tracking-widest uppercase truncate max-w-[60%]">
          ▼ {title}
        </div>
        <button
          onClick={() => fetchFacts(query, false)}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white"
          title="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {facts.map((f, i) => (
        <DoomCard
          key={`${query}-${i}`}
          fact={f.fact}
          imagePrompt={f.image_prompt}
          sourceUrl={sourceUrl}
          index={i}
        />
      ))}

      {/* Loader at the bottom while fetching more */}
      {loadingMore && (
        <div className="w-full h-32 flex items-center justify-center bg-black text-white/50 text-xs gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Falling deeper…
        </div>
      )}
    </div>
  );
}