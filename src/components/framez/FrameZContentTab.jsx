import React from "react";
import { FileText } from "lucide-react";

/**
 * Content tab — shows generated slides from the chat agent.
 */
export default function FrameZContentTab({ deck }) {
  if (!deck) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8 bg-zinc-50">
        <div className="w-12 h-12 rounded-2xl bg-zinc-200 flex items-center justify-center mb-3">
          <FileText className="w-5 h-5 text-zinc-500" />
        </div>
        <div className="text-base font-bold text-zinc-700 mb-1">Content</div>
        <div className="text-xs text-zinc-400">Slides will appear here as the agent generates them.</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-50 px-4 py-4">
      <h2 className="text-lg font-black text-zinc-900 mb-3 px-1">{deck.title}</h2>
      <div className="space-y-3">
        {(deck.slides || []).map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-sm">
            <div className="text-[10px] font-black tracking-widest text-zinc-400 uppercase mb-1">
              Slide {i + 1}
            </div>
            <div className="text-sm font-bold text-zinc-900 mb-1.5">{s.heading}</div>
            <div className="text-xs text-zinc-600 leading-relaxed">{s.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}