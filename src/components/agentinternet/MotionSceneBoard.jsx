import React, { useState } from "react";
import { Loader2, Download, Copy, Check, ImageOff } from "lucide-react";

function SceneCard({ scene, index, spec, onOpen }) {
  const [copied, setCopied] = useState(false);

  const copyPrompt = () => {
    navigator.clipboard.writeText(scene.prompt || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const download = async () => {
    if (!scene.url) return;
    const res = await fetch(scene.url);
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `scene-${index + 1}.png`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
      {scene.url ? (
        <button onClick={() => onOpen?.({ url: scene.url, title: scene.title, detail: scene.shot })} className="block w-full">
          <img src={scene.url} alt={scene.title} className="w-full object-cover max-h-64" />
        </button>
      ) : (
        <div className="h-28 flex items-center justify-center gap-2 text-white/35 text-[10px] font-mono">
          <ImageOff className="w-3.5 h-3.5" /> frame didn't render
        </div>
      )}
      <div className="p-3">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-cyan-300/80">Scene {index + 1}</span>
          <span className="text-white text-xs font-semibold">{scene.title}</span>
        </div>
        <p className="text-[11px] text-white/60 mt-1 leading-snug">{scene.shot}</p>
        {scene.copy && (
          <p className="mt-1.5 text-[11px] text-cyan-200/90 font-mono">“{scene.copy}”</p>
        )}
        <p className="mt-2 text-[10px] text-white/40 font-mono leading-relaxed line-clamp-4">{scene.prompt}</p>
        <div className="flex items-center gap-1.5 mt-2.5">
          <button
            onClick={copyPrompt}
            className="flex items-center gap-1 px-2.5 h-7 rounded-full border border-white/15 text-[10px] font-mono text-white/70 hover:border-white/35 hover:text-white transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? "copied" : "prompt"}
          </button>
          {scene.url && (
            <button
              onClick={download}
              className="flex items-center gap-1 px-2.5 h-7 rounded-full border border-white/15 text-[10px] font-mono text-white/70 hover:border-white/35 hover:text-white transition-colors"
            >
              <Download className="w-3 h-3" /> save
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MotionSceneBoard({ motion, onOpen }) {
  if (motion.stage === "run") {
    return (
      <div className="mt-3 flex items-center gap-2 text-white/60 text-xs font-mono py-2">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
        {motion.progress || "working"}…
      </div>
    );
  }

  if (motion.stage === "error") {
    return <div className="mt-3 text-red-400 text-[11px] font-mono">couldn't build the scenes — try again with the site url</div>;
  }

  const { scenes = [], brand, concept, spec } = motion;

  return (
    <div className="mt-3 space-y-3">
      <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-white text-xs font-semibold">
            {brand?.name || motion.url || "Motion"} — {spec?.duration}s {spec?.aspect_ratio}
          </span>
          <span className="text-[9px] font-mono text-white/40">{scenes.length} scenes</span>
        </div>
        {concept && <p className="text-[11px] text-white/60 mt-1 leading-snug">{concept}</p>}
        {brand?.description && <p className="text-[10px] text-white/40 mt-1.5 leading-snug">{brand.description}</p>}
      </div>

      {scenes.map((s, i) => (
        <SceneCard key={i} scene={s} index={i} spec={spec} onOpen={onOpen} />
      ))}
    </div>
  );
}