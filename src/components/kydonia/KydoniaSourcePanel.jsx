import React, { useState } from "react";
import { AlertTriangle, Check, Loader2, Plus, Trash2 } from "lucide-react";

const STATUS_ICON = {
  fetching: <Loader2 className="h-3.5 w-3.5 animate-spin text-[#ff7a45]" />,
  ready: <Check className="h-3.5 w-3.5 text-[#7ad19b]" />,
  failed: <AlertTriangle className="h-3.5 w-3.5 text-[#ff9d7a]" />,
  blocked: <AlertTriangle className="h-3.5 w-3.5 text-[#e0b74a]" />,
  duplicate: <AlertTriangle className="h-3.5 w-3.5 text-[#7d7871]" />,
};

export default function KydoniaSourcePanel({
  sources,
  queue,
  loading,
  onAdd,
  onDelete,
  hostFilter,
  onPickHost,
}) {
  const [value, setValue] = useState("");

  const submit = (event) => {
    event.preventDefault();
    const raw = value.trim();
    if (!raw) return;
    setValue("");
    onAdd(raw);
  };

  const hosts = [...new Set(sources.map((source) => source.host).filter(Boolean))].sort();

  return (
    <aside className="flex min-h-0 flex-col border-r border-[#23262d] bg-[#0b0d11]">
      <div className="border-b border-[#23262d] p-4">
        <form onSubmit={submit} className="flex flex-col gap-2">
          <textarea
            className="kyd-input resize-none"
            rows={2}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) submit(event);
            }}
            placeholder="paste one URL, or several — one per line"
            aria-label="Paste URLs to index"
          />
          <button type="submit" className="kyd-btn kyd-btn-primary w-full">
            <Plus className="h-3.5 w-3.5" />
            Index
          </button>
        </form>

        {hosts.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className={`kyd-chip ${hostFilter === "all" ? "is-active" : ""}`}
              onClick={() => onPickHost("all")}
            >
              All hosts
            </button>
            {hosts.slice(0, 6).map((host) => (
              <button
                key={host}
                type="button"
                className={`kyd-chip ${hostFilter === host ? "is-active" : ""}`}
                onClick={() => onPickHost(host)}
              >
                {host.replace(/^www\./, "")}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="kyd-row border-b border-[#23262d] px-4 py-3 text-[10px] tracking-[0.14em] text-[#7d7871] uppercase">
        <span>Sources</span>
        <span className="kyd-mono-num">{sources.length}</span>
      </div>

      <div className="kyd-scroll min-h-0 flex-1 p-3">
        {queue.map((item) => (
          <div key={`${item.url}-${item.status}`} className="kyd-panel-2 mb-2 p-3">
            <div className="flex items-center gap-2">
              {STATUS_ICON[item.status] || STATUS_ICON.fetching}
              <span className="truncate text-[11px] text-[#e8dcc8]">{item.url}</span>
            </div>
            {item.error && <p className="kyd-sans mt-2 text-[11px] text-[#ff9d7a]">{item.error}</p>}
          </div>
        ))}

        {loading && <p className="kyd-sans p-2 text-[12px] text-[#8f8a83]">Loading your catalogue…</p>}

        {!loading && !sources.length && !queue.length && (
          <div className="kyd-panel-2 p-4">
            <p className="text-[12px] text-[#e8dcc8]">Nothing indexed yet</p>
            <p className="kyd-sans mt-2 text-[11px] leading-relaxed text-[#8f8a83]">
              Paste a URL above. It is fetched once, cleaned, and indexed on your device — then it
              becomes queryable.
            </p>
          </div>
        )}

        {sources.map((source) => (
          <div key={source.id} className="kyd-panel-2 group mb-2 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[12px] text-[#e8dcc8]" title={source.title}>
                  {source.title || source.host}
                </p>
                <p className="truncate text-[10px] text-[#7d7871]">{source.host}</p>
              </div>
              <button
                type="button"
                onClick={() => onDelete(source.id)}
                className="shrink-0 text-[#7d7871] opacity-0 transition-opacity group-hover:opacity-100 hover:text-[#ff9d7a]"
                title="Remove from the index"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="kyd-mono-num mt-2 text-[10px] text-[#7d7871]">
              {source.char_count?.toLocaleString?.() || 0} chars ·{" "}
              {source.token_count?.toLocaleString?.() || 0} terms
              {source.truncated ? " · truncated" : ""}
            </p>
          </div>
        ))}
      </div>
    </aside>
  );
}