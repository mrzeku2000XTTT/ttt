import React, { useEffect, useMemo, useState } from "react";
import { Home as HomeIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { buildIndex } from "@/lib/kydonia/buildIndex";
import { search } from "@/lib/kydonia/bm25";
import { queryTerms, tokenize } from "@/lib/kydonia/tokenize";
import KydoniaMark from "./KydoniaMark";
import KydoniaSourcePanel from "./KydoniaSourcePanel";
import KydoniaSearchPanel from "./KydoniaSearchPanel";

const URL_LIKE = /^(https?:\/\/|www\.)/i;

function extractUrls(raw) {
  return raw
    .split(/[\s,]+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .filter((token) => URL_LIKE.test(token) || /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(token));
}

export default function KydoniaStudio({ onHome, initialUrl }) {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState([]);
  const [query, setQuery] = useState("");
  const [hostFilter, setHostFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await base44.entities.KydoniaSource.list("-created_date", 500);
        if (active) setSources(list);
      } catch (error) {
        if (active) {
          setQueue((items) => [
            ...items,
            { url: "your catalogue", status: "failed", error: error?.message || "Could not load sources" },
          ]);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const index = useMemo(() => buildIndex(sources), [sources]);

  const byId = useMemo(() => new Map(sources.map((source) => [source.id, source])), [sources]);

  const { results, ms } = useMemo(() => {
    const started = performance.now();
    const ranked = search(index, query);
    return { results: ranked, ms: Math.max(1, Math.round(performance.now() - started)) };
  }, [index, query]);

  const filtered = useMemo(
    () => (hostFilter === "all" ? results : results.filter((result) => byId.get(result.docId)?.host === hostFilter)),
    [results, hostFilter, byId]
  );

  const terms = useMemo(() => queryTerms(query), [query]);

  const indexUrl = async (rawUrl) => {
    const url = rawUrl.trim();
    if (!url) return;
    if (sources.some((source) => source.url === url || source.url === `https://${url}`)) {
      setQueue((items) => [...items, { url, status: "duplicate", error: "Already in your catalogue" }]);
      return;
    }

    setQueue((items) => [...items, { url, status: "fetching" }]);

    const settle = (status, error) =>
      setQueue((items) => items.map((item) => (item.url === url && item.status === "fetching" ? { ...item, status, error } : item)));

    try {
      const response = await base44.functions.invoke("kydoniaUrlFetch", { url });
      const data = response?.data || {};

      if (data.status !== "ready" || !data.text) {
        settle(data.status === "blocked" ? "blocked" : "failed", data.error || "Nothing readable on that page");
        return;
      }

      const created = await base44.entities.KydoniaSource.create({
        url: data.url || url,
        host: data.host || "",
        title: data.title || data.host || url,
        description: data.description || "",
        headings: data.headings || [],
        text: data.text,
        char_count: data.text.length,
        token_count: tokenize(data.text).length,
        content_hash: data.contentHash || "",
        robots_allowed: data.robotsAllowed !== false,
        truncated: !!data.truncated,
        status: "ready",
        error: "",
      });

      setSources((items) => [created, ...items]);
      settle("ready");
      setTimeout(() => setQueue((items) => items.filter((item) => item.url !== url)), 2500);
    } catch (error) {
      const message =
        error?.response?.status === 401
          ? "Sign in to index pages — the fetcher needs an account."
          : error?.response?.data?.error || error?.message || "Could not index that URL";
      settle("failed", message);
    }
  };

  const addUrls = async (raw) => {
    const urls = extractUrls(raw);
    for (const url of urls) {
      // Sequential and slow on purpose — one polite request per page.
      // eslint-disable-next-line no-await-in-loop
      await indexUrl(url);
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  };

  useEffect(() => {
    if (initialUrl) addUrls(initialUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!queue.some((item) => item.status === "fetching")) return undefined;
    const started = Date.now();
    const timer = setInterval(() => setElapsed(((Date.now() - started) / 1000).toFixed(1)), 200);
    return () => clearInterval(timer);
  }, [queue]);

  const removeSource = async (id) => {
    setSources((items) => items.filter((source) => source.id !== id));
    if (selectedId === id) setSelectedId(null);
    try {
      await base44.entities.KydoniaSource.delete(id);
    } catch {
      const list = await base44.entities.KydoniaSource.list("-created_date", 500);
      setSources(list);
    }
  };

  const fetching = queue.filter((item) => item.status === "fetching").length;

  return (
    <div className="kydonia-page kyd-studio">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-[#23262d] bg-[#0b0d11] px-4 py-3">
        <div className="flex items-center gap-3">
          <KydoniaMark />
          <div className="leading-tight">
            <p className="text-[13px] tracking-[0.16em]">KYDONIA</p>
            <p className="kyd-mono-num text-[10px] text-[#7d7871]">
              {index.docCount} sources · {index.termCount} terms · index built locally
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {fetching > 0 && (
            <span className="kyd-mono-num text-[11px] text-[#ff7a45]">
              fetching {fetching} · {elapsed}s
            </span>
          )}
          <button type="button" className="kyd-btn" onClick={onHome}>
            <HomeIcon className="h-3.5 w-3.5" />
            Landing
          </button>
        </div>
      </header>

      <div className="kyd-studio-body">
        <KydoniaSourcePanel
          sources={sources}
          queue={queue}
          loading={loading}
          onAdd={addUrls}
          onDelete={removeSource}
          hostFilter={hostFilter}
          onPickHost={setHostFilter}
        />

        <KydoniaSearchPanel
          query={query}
          onQueryChange={setQuery}
          terms={terms}
          results={filtered}
          byId={byId}
          selectedId={selectedId}
          onSelect={setSelectedId}
          hostFilter={hostFilter}
          indexStats={{ docs: index.docCount, terms: index.termCount, ms }}
        />
      </div>
    </div>
  );
}