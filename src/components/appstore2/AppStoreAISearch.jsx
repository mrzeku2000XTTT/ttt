import React, { useState, useEffect, useRef } from "react";
import { Search, Sparkles, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { APPS } from "./appCatalog";

/**
 * LLM-powered app search.
 *
 * Strategy:
 *  1. On every keystroke, run an instant local substring filter so results
 *     appear immediately (matches name, description, category).
 *  2. After a short debounce, send the query + full app catalog (names +
 *     descriptions) to the LLM. The LLM returns semantically matched app
 *     names — so "image to html" finds MetaMimic ("Images & files to HTML
 *     clones") even though no words overlap.
 *  3. Results are cached per-query so repeat searches are instant.
 *
 * Props:
 *  - value / onSearchChange: controlled text value (string)
 *  - onResults: called with { names: string[], mode: 'instant'|'ai' } | null
 */
export default function AppStoreAISearch({ value, onSearchChange, onResults }) {
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const reqIdRef = useRef(0);
  const cacheRef = useRef(new Map());

  // Build the catalog text once — used in every LLM prompt.
  const catalogText = React.useMemo(
    () => APPS.map((a) => `- ${a.name}: ${a.desc}`).join("\n"),
    []
  );

  useEffect(() => {
    const query = (value || "").trim();

    // No query → clear results, show all.
    if (!query) {
      setLoading(false);
      clearTimeout(debounceRef.current);
      onResults(null);
      return;
    }

    // 1. Instant local substring filter — shows immediately.
    const q = query.toLowerCase();
    const instantNames = APPS.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.desc.toLowerCase().includes(q) ||
        (a.cat || "").toLowerCase().includes(q)
    ).map((a) => a.name);

    onResults({ names: instantNames, mode: "instant" });

    // 2. Debounced LLM semantic search.
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const cacheKey = query.toLowerCase();
      const cached = cacheRef.current.get(cacheKey);
      if (cached) {
        onResults({ names: cached, mode: "ai" });
        return;
      }
      runLLMSearch(query);
    }, 550);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const runLLMSearch = async (query) => {
    const myReqId = ++reqIdRef.current;
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:
          `A user is searching a decentralized app store. Their search query is: "${query}"\n\n` +
          `Below is the full catalog of available apps, each listed as "name: description".\n\n` +
          `${catalogText}\n\n` +
          `Your job: return the app NAMES that best match what the user is looking for, based on the descriptions.\n` +
          `Match semantically — e.g. "image to html" should match an app described as "Images & files to HTML clones".\n` +
          `"edit video" should match apps that do AI video editing. "send crypto" should match wallet/bridge/tip apps.\n` +
          `Return up to 15 results, ranked by relevance (best first). Only return app names that EXACTLY appear in the catalog above.\n` +
          `If nothing is relevant, return an empty array.`,
        response_json_schema: {
          type: "object",
          properties: {
          matches: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["matches"],
        },
      });

      // Ignore stale responses from older queries.
      if (myReqId !== reqIdRef.current) return;

      const matches = Array.isArray(res?.matches) ? res.matches : [];
      cacheRef.current.set(query.toLowerCase(), matches);
      onResults({ names: matches, mode: "ai" });
    } catch (e) {
      console.error("AI app search failed:", e);
      // Keep the instant substring results already showing.
    } finally {
      if (myReqId === reqIdRef.current) setLoading(false);
    }
  };

  return (
    <div className="relative">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
      <input
        value={value}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search apps… describe what you need"
        className="w-full h-11 pl-10 pr-10 rounded-xl bg-white ring-1 ring-zinc-200/60 text-sm outline-none focus:ring-zinc-300 placeholder-zinc-400 transition-all"
      />
      {loading ? (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />
        </div>
      ) : value ? (
        <button
          onClick={() => onSearchChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      ) : null}
    </div>
  );
}