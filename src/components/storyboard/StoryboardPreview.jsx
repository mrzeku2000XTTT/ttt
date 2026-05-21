import React from "react";
import { Download, Sparkles } from "lucide-react";

export default function StoryboardPreview({ imageUrl, title, isDark = false }) {
  return (
    <div className={`rounded-[1.5rem] border p-3 backdrop-blur-2xl transition ${isDark ? "border-white/10 bg-white/[0.07] shadow-2xl shadow-black/40" : "border-zinc-200 bg-white shadow-xl shadow-zinc-200/60"}`}>
      <div className={`flex min-h-[360px] items-center justify-center overflow-hidden rounded-2xl transition ${isDark ? "bg-black/40" : "bg-zinc-100"}`}>
        {imageUrl ? (
          <img src={imageUrl} alt={title || "Generated storyboard"} className="h-full w-full object-contain" />
        ) : (
          <div className={`px-6 text-center ${isDark ? "text-white/45" : "text-zinc-500"}`}>
            <Sparkles className={`mx-auto mb-3 h-10 w-10 ${isDark ? "text-white" : "text-zinc-900"}`} />
            <p className="text-sm font-semibold">Your quick storyboard sheet will appear here.</p>
          </div>
        )}
      </div>
      {imageUrl && (
        <a href={imageUrl} target="_blank" rel="noreferrer" className={`mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black transition ${isDark ? "bg-white text-black hover:bg-white/90" : "bg-zinc-950 text-white hover:bg-zinc-800"}`}>
          <Download className="h-4 w-4" /> Open / Download
        </a>
      )}
    </div>
  );
}