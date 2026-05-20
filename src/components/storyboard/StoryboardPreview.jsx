import React from "react";
import { Download, Sparkles } from "lucide-react";

export default function StoryboardPreview({ imageUrl, title }) {
  return (
    <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-3 shadow-xl shadow-zinc-200/60">
      <div className="flex min-h-[360px] items-center justify-center overflow-hidden rounded-2xl bg-zinc-100">
        {imageUrl ? (
          <img src={imageUrl} alt={title || "Generated storyboard"} className="h-full w-full object-contain" />
        ) : (
          <div className="px-6 text-center text-zinc-500">
            <Sparkles className="mx-auto mb-3 h-10 w-10 text-zinc-900" />
            <p className="text-sm font-semibold">Your quick storyboard sheet will appear here.</p>
          </div>
        )}
      </div>
      {imageUrl && (
        <a href={imageUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-full bg-zinc-950 px-4 py-2 text-sm font-black text-white hover:bg-zinc-800">
          <Download className="h-4 w-4" /> Open / Download
        </a>
      )}
    </div>
  );
}