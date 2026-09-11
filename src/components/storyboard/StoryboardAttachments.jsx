import React from "react";
import { X, FileText, Loader2 } from "lucide-react";

// Chips showing the files/images attached to the storyboard prompt box.
// Images show a live thumbnail; other files show a file icon.
export default function StoryboardAttachments({ attachments, onRemove }) {
  if (!attachments.length) return null;
  return (
    <div className="mb-3 flex flex-wrap gap-2 px-1">
      {attachments.map((a) => (
        <div
          key={a.id}
          className="relative flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 py-1.5 pl-1.5 pr-7"
        >
          {a.preview ? (
            <img src={a.preview} alt={a.name} className="h-9 w-9 rounded-lg object-cover" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
              <FileText className="h-4 w-4 text-white/50" />
            </div>
          )}
          <div className="min-w-0 max-w-[140px]">
            <p className="truncate text-[11px] font-semibold text-white/85">{a.name}</p>
            <p className="text-[10px] text-white/40">{a.url ? "Attached" : "Uploading…"}</p>
          </div>
          {!a.url && <Loader2 className="h-3.5 w-3.5 animate-spin text-white/40" />}
          {a.url && (
            <button
              onClick={() => onRemove(a.id)}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white/70 transition hover:text-white"
              title={`Remove ${a.name}`}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}