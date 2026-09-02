import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Search, X, Play, Loader2, ChevronDown, Film } from "lucide-react";

const fmtDur = (s) => {
  s = Math.max(0, Math.round(s || 0));
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m}:${ss < 10 ? "0" : ""}${ss}`;
};
const fmtViews = (n) => {
  n = n || 0;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M views`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K views`;
  return `${n} views`;
};

function IFilmLogo({ size = 22 }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center justify-center bg-white" style={{ width: size, height: size, borderRadius: 5 }}>
        <Play className="w-[58%] h-[58%] text-black" fill="black" />
      </div>
      <span className="text-white font-bold tracking-tight" style={{ fontSize: size * 0.82, fontFamily: "'Inter', system-ui, sans-serif" }}>
        i<span style={{ fontWeight: 800 }}>Film</span>
      </span>
    </div>
  );
}

export default function IFilm() {
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [page, setPage] = useState(1);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(null);
  const [playing, setPlaying] = useState(null);
  const [channelInfo, setChannelInfo] = useState(null);
  const [channels, setChannels] = useState([]);
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const suggestTimer = useRef(null);
  const searchInputRef = useRef(null);

  const runSearch = async (q, pg = 1, append = false) => {
    if (append) setLoadingMore(true); else setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("ifilmSearch", { query: q, page: pg, limit: 24 });
      const data = res?.data ?? res;
      if (data?.error) throw new Error(data.error);
      const list = data?.videos || [];
      setVideos((prev) => append ? [...prev, ...list] : list);
      setHasMore(!!data?.hasMore && list.length > 0);
      if (!append) {
        setChannelInfo(data?.mode === "channel" ? data.channel : null);
        setChannels(data?.mode === "search" ? (data.channels || []) : []);
      }
      setPage(pg);
    } catch (e) {
      setError(e?.message || "Search failed. Try again.");
      if (!append) setVideos([]);
    } finally {
      setLoading(false); setLoadingMore(false);
    }
  };

  useEffect(() => { runSearch(""); }, []); // default trending feed

  // Live autocomplete while typing
  useEffect(() => {
    const q = query.trim();
    if (!focused || !q || q.startsWith("@")) { setSuggestions([]); return; }
    clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(async () => {
      setSuggestLoading(true);
      try {
        const res = await base44.functions.invoke("ifilmSearch", { suggest: true, query: q });
        const data = res?.data ?? res;
        setSuggestions(data?.suggestions || []);
      } catch { setSuggestions([]); }
      finally { setSuggestLoading(false); }
    }, 250);
    return () => clearTimeout(suggestTimer.current);
  }, [query, focused]);

  const pickSuggestion = (s) => {
    setQuery(s); setActiveQuery(s); runSearch(s, 1);
    setFocused(false); setSuggestions([]);
    searchInputRef.current?.blur();
  };

  const submit = (e) => {
    e?.preventDefault();
    const q = query.trim();
    setActiveQuery(q);
    runSearch(q, 1);
    setFocused(false); setSuggestions([]);
    searchInputRef.current?.blur();
  };

  const loadMore = () => runSearch(activeQuery, page + 1, true);

  const openChannel = (username) => {
    const q = `@${username}`;
    setQuery(q);
    setActiveQuery(q);
    runSearch(q, 1);
    window.scrollTo({ top: 0 });
  };

  const onKey = (e) => { if (e.key === "Escape") setPlaying(null); };
  useEffect(() => {
    window.addEventListener("keydown", onKey);
    const orig = document.body.style.overflow;
    if (playing) document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = orig; };
  }, [playing]);

  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-black/85 backdrop-blur-xl border-b border-white/10" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}>
        <Link to="/" className="active:opacity-60">
          <IFilmLogo size={22} />
        </Link>
        <div className="flex-1 mx-3 max-w-md">
          <form onSubmit={submit} className="relative">
            <input
              ref={searchInputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              placeholder="Search videos or @channel…"
              className="w-full h-9 pl-9 pr-9 rounded-full bg-white/10 border border-white/15 text-[13px] text-white placeholder-white/40 outline-none focus:border-white/40 focus:bg-white/15 transition-colors"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
            {query && (
              <button type="button" onClick={() => { setQuery(""); setActiveQuery(""); runSearch(""); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>
        <Link to="/AppStoreV2" className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" title="Exit to Store">
          <X className="w-4 h-4" />
        </Link>
      </div>

      {/* Autocomplete suggestions */}
      {focused && query.trim() && !query.trim().startsWith("@") && (suggestions.length > 0 || suggestLoading) && (
        <div className="fixed inset-0 z-30" onMouseDown={() => setFocused(false)}>
          <div
            className="absolute left-0 right-0 bg-[#121212] border-b border-white/10 shadow-2xl"
            style={{ top: "calc(env(safe-area-inset-top, 0px) + 3.7rem)", maxHeight: "60vh", overflowY: "auto" }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {suggestLoading && suggestions.length === 0 ? (
              <div className="px-4 py-3 text-[12px] text-white/40 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching…
              </div>
            ) : (
              suggestions.map((s, i) => (
                <button
                  key={i}
                  onMouseDown={(e) => { e.preventDefault(); pickSuggestion(s); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5"
                >
                  <Search className="w-4 h-4 text-white/40 flex-shrink-0" />
                  <span className="text-[13px] text-white/85 truncate">{s}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      <div className="max-w-[1100px] mx-auto px-3 sm:px-5 pt-20 pb-24">
        {/* Section label */}
        <div className="flex items-center justify-between mb-3 mt-1">
          <div className="text-[11px] tracking-[0.2em] text-white/45">
            {channelInfo ? "CHANNEL" : activeQuery ? `RESULTS · ${activeQuery.toUpperCase()}` : "TRENDING NOW"}
          </div>
          {!loading && videos.length > 0 && <div className="text-[11px] text-white/35">{videos.length} videos</div>}
        </div>

        {/* Channel header */}
        {channelInfo && !loading && (
          <div className="flex items-start gap-3 mb-4 p-3 rounded-xl border border-white/10 bg-white/[0.03]">
            {channelInfo.avatar ? (
              <img src={channelInfo.avatar} alt={channelInfo.screenname} className="w-14 h-14 rounded-full object-cover border border-white/20 flex-shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-white/10 flex-shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <div className="text-white font-semibold text-[15px] truncate">{channelInfo.screenname}</div>
              <div className="text-white/40 text-[12px] truncate">@{channelInfo.username} · {channelInfo.videos_total} videos</div>
              {channelInfo.description && <div className="text-white/55 text-[12px] mt-1 line-clamp-2">{channelInfo.description}</div>}
            </div>
          </div>
        )}

        {/* Channel suggestions */}
        {channels.length > 0 && !channelInfo && !loading && !error && (
          <div className="mb-4">
            <div className="text-[11px] tracking-[0.18em] text-white/45 mb-2">CHANNELS</div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {channels.map((c) => (
                <button key={c.username} onClick={() => openChannel(c.username)} className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex-shrink-0">
                  {c.avatar ? <img src={c.avatar} alt={c.screenname} className="w-7 h-7 rounded-full object-cover" /> : <div className="w-7 h-7 rounded-full bg-white/10" />}
                  <div className="text-left min-w-0">
                    <div className="text-[12px] text-white/90 truncate max-w-[120px]">{c.screenname}</div>
                    <div className="text-[10px] text-white/40">{c.videos_total} videos</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading grid */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-lg overflow-hidden border border-white/10">
                <div className="aspect-video bg-white/5 animate-pulse" />
                <div className="p-2 space-y-1.5">
                  <div className="h-3 bg-white/10 rounded animate-pulse w-11/12" />
                  <div className="h-2.5 bg-white/10 rounded animate-pulse w-2/5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="text-center py-16">
            <div className="text-[14px] text-white/70 mb-1">Couldn’t load videos.</div>
            <div className="text-[12px] text-white/40 mb-4">{error}</div>
            <button onClick={() => runSearch(activeQuery, 1)} className="text-[13px] px-4 py-2 rounded-full bg-white text-black font-medium">Retry</button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && videos.length === 0 && (
          <div className="text-center py-20">
            <Film className="w-8 h-8 text-white/30 mx-auto mb-3" />
            <div className="text-[14px] text-white/60">No videos found. Try a different search.</div>
          </div>
        )}

        {/* Grid */}
        {!loading && !error && videos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {videos.map((v) => (
              <button key={v.id} onClick={() => setPlaying(v)} className="text-left group">
                <div className="relative rounded-lg overflow-hidden border border-white/10 bg-white/5 aspect-video">
                  {v.thumbnail ? (
                    <img src={v.thumbnail} alt={v.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Film className="w-6 h-6 text-white/30" /></div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-4 h-4 text-black ml-0.5" fill="black" />
                    </div>
                  </div>
                  {v.duration > 0 && (
                    <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[10px] text-white font-medium">{fmtDur(v.duration)}</div>
                  )}
                </div>
                <div className="mt-1.5 px-0.5">
                  <div className="text-[12.5px] leading-snug text-white/90 line-clamp-2">{v.title}</div>
                  <div className="text-[11px] text-white/45 mt-0.5 truncate">{v.channel || "iFilm"} · {fmtViews(v.views)}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Load more */}
        {hasMore && !loading && !error && (
          <div className="flex justify-center mt-6">
            <button onClick={loadMore} disabled={loadingMore} className="flex items-center gap-2 h-10 px-5 rounded-full bg-white/10 hover:bg-white/20 text-[13px] font-medium disabled:opacity-50 transition-colors">
              {loadingMore ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading…</> : <><ChevronDown className="w-4 h-4" /> Load more</>}
            </button>
          </div>
        )}
      </div>

      {/* Player overlay */}
      {playing && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col" onClick={() => setPlaying(null)}>
          <div className="flex items-center justify-between px-4 py-3" onClick={(e) => e.stopPropagation()}>
            <div className="min-w-0 flex-1 pr-3">
              <div className="text-[14px] text-white truncate">{playing.title}</div>
              <div className="text-[11px] text-white/45 truncate">{playing.channel || "iFilm"} · {fmtViews(playing.views)}</div>
            </div>
            <button onClick={() => setPlaying(null)} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 flex items-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-full max-w-[960px] mx-auto px-3">
              <div className="relative w-full bg-black" style={{ aspectRatio: "16 / 9" }}>
                <iframe
                  src={`${playing.embed}?autoplay=1`}
                  title={playing.title}
                  className="absolute inset-0 w-full h-full"
                  frameBorder="0"
                  allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                  allowFullScreen
                />
              </div>
              {playing.description && (
                <div className="mt-3 text-[12.5px] leading-relaxed text-white/60 line-clamp-3">{playing.description}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}