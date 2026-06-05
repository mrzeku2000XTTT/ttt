import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, Search, Sparkles } from "lucide-react";
import { STORYBOARD_PRESETS } from "@/components/storyboard/storyboardPresets";

export default function PresetDropdown({ onPick }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const list = STORYBOARD_PRESETS.slice(0, 200).filter((p) =>
    !query.trim() || p.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
      >
        <Sparkles className="h-3.5 w-3.5 text-violet-500" />
        1000+ Kaspa Presets
        <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-[320px] max-w-[80vw] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl shadow-black/20">
          <div className="flex items-center gap-2 border-b border-black/5 px-3 py-2.5">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search presets…"
              className="w-full bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
            />
          </div>
          <div className="max-h-[320px] overflow-y-auto py-1">
            {list.length === 0 && <p className="px-3 py-4 text-center text-sm text-gray-400">No presets found.</p>}
            {list.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => { onPick(p); setOpen(false); setQuery(""); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-violet-50 hover:text-violet-700"
              >
                <span className="text-xs font-bold text-violet-400">{p.id.replace("preset-", "#")}</span>
                <span className="truncate">{p.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}