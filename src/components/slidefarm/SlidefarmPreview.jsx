import React, { useEffect, useRef, useState } from "react";
import { renderSlide } from "./slidefarmRenderer";
import { Download, Copy, Check, Loader2 } from "lucide-react";

export default function SlidefarmPreview({ slideshow, onExport, exporting }) {
  const [previews, setPreviews] = useState([]);
  const [copied, setCopied] = useState(false);
  const didRender = useRef(false);

  useEffect(() => {
    if (!slideshow?.slides?.length) return;
    didRender.current = false;
    (async () => {
      const urls = [];
      for (const s of slideshow.slides) {
        const blob = await renderSlide(s);
        urls.push(URL.createObjectURL(blob));
      }
      setPreviews(urls);
    })();
    return () => previews.forEach((u) => URL.revokeObjectURL(u));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideshow]);

  const copyCaption = () => {
    navigator.clipboard.writeText(slideshow.caption || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!slideshow) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-[900] text-lg">Preview</h2>
        <button
          onClick={onExport}
          disabled={exporting || previews.length === 0}
          className="h-10 px-4 rounded-xl bg-white text-black text-[12px] font-[900] flex items-center gap-2 disabled:opacity-50"
        >
          {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          Export ZIP
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
        {(previews.length ? previews : slideshow.slides.map((s) => s.image_url)).map((src, i) => (
          <div key={i} className="flex-shrink-0 w-48 snap-start">
            <div className="relative rounded-xl overflow-hidden bg-zinc-900 border border-white/10" style={{ aspectRatio: "9/16" }}>
              <img src={src} alt={`Slide ${i + 1}`} className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 bg-black/70 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold text-white">
                {i + 1}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] font-bold tracking-wider text-white/50 uppercase">TikTok Caption</div>
          <button onClick={copyCaption} className="text-white/60 hover:text-white flex items-center gap-1 text-[11px]">
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">{slideshow.caption}</p>
      </div>
    </div>
  );
}