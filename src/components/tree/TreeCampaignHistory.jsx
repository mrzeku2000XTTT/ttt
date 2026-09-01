import React, { useState } from "react";
import { ChevronRight, Trash2, Loader2 } from "lucide-react";

export default function TreeCampaignHistory({ campaigns, onSelect, onDelete }) {
  const [deleting, setDeleting] = useState(null);
  if (!campaigns.length) return null;

  const handleDelete = async (e, c) => {
    e.stopPropagation();
    if (!window.confirm(`Delete the campaign for "${c.product}"? This can't be undone.`)) return;
    setDeleting(c.id);
    try { await onDelete?.(c); } finally { setDeleting(null); }
  };

  return (
    <div className="space-y-2">
      <p className="text-emerald-300/70 text-xs uppercase tracking-widest">Past Campaigns</p>
      {campaigns.map((c) => (
        <div
          key={c.id}
          className="group flex items-center gap-2 bg-white/5 hover:bg-emerald-500/10 border border-white/10 rounded-xl px-4 py-3 transition-colors"
        >
          <button
            onClick={() => onSelect(c)}
            className="flex-1 flex items-center justify-between text-left min-w-0"
          >
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{c.product}</p>
              <p className="text-white/40 text-xs">{(c.ads || []).length} ads · {c.status}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0" />
          </button>
          {onDelete && (
            <button
              onClick={(e) => handleDelete(e, c)}
              disabled={deleting === c.id}
              title="Delete campaign"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0 disabled:opacity-50"
            >
              {deleting === c.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}