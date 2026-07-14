import React, { useRef, useState } from "react";
import { Upload, Sparkles, Film, ImageIcon, Music, Loader2, Plus, Wand2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const uid = () => `k_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export default function KuttAssets({ assets, onAddAssets, onAddToTimeline }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [genPrompt, setGenPrompt] = useState("");
  const [genMode, setGenMode] = useState("image");
  const [generating, setGenerating] = useState(false);

  const handleFiles = async (files) => {
    setUploading(true);
    try {
      const created = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        const type = file.type.startsWith("video") ? "video" : file.type.startsWith("audio") ? "audio" : "image";
        created.push({ id: uid(), type, url: file_url, name: file.name, duration: type === "image" ? 4 : 8 });
      }
      onAddAssets(created);
    } finally {
      setUploading(false);
    }
  };

  const generate = async () => {
    if (!genPrompt.trim() || generating) return;
    setGenerating(true);
    try {
      if (genMode === "video") {
        const { url } = await base44.integrations.Core.GenerateVideo({ prompt: genPrompt, duration: 6, aspect_ratio: "16:9" });
        onAddAssets([{ id: uid(), type: "video", url, name: genPrompt.slice(0, 40), duration: 6 }]);
      } else {
        const { url } = await base44.integrations.Core.GenerateImage({ prompt: genPrompt });
        onAddAssets([{ id: uid(), type: "image", url, name: genPrompt.slice(0, 40), duration: 4 }]);
      }
      setGenPrompt("");
    } finally {
      setGenerating(false);
    }
  };

  const TypeIcon = ({ type }) => type === "video" ? <Film className="w-3 h-3" /> : type === "audio" ? <Music className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />;

  return (
    <div className="h-full flex flex-col bg-black/40">
      <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
        <span className="text-white/80 text-[11px] font-black tracking-widest uppercase">Assets</span>
        <button
          data-agent-id="kutt-import"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1 px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-white/80 text-[10px] font-bold"
        >
          {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />} Import
        </button>
        <input ref={fileRef} type="file" multiple accept="video/*,image/*,audio/*" className="hidden"
          onChange={(e) => { if (e.target.files?.length) handleFiles([...e.target.files]); e.target.value = ""; }} />
      </div>

      {/* Generative media */}
      <div className="px-3 py-2 border-b border-white/10 space-y-1.5">
        <div className="flex items-center gap-1">
          {["image", "video"].map((m) => (
            <button key={m} onClick={() => setGenMode(m)}
              className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${genMode === m ? "bg-fuchsia-500/30 text-fuchsia-200 border border-fuchsia-500/50" : "bg-white/5 text-white/40 border border-white/10"}`}>
              {m}
            </button>
          ))}
          <span className="text-white/30 text-[9px] font-bold ml-auto flex items-center gap-1"><Sparkles className="w-2.5 h-2.5" /> AI Media</span>
        </div>
        <div className="flex gap-1">
          <input
            data-agent-id="kutt-gen-prompt"
            value={genPrompt}
            onChange={(e) => setGenPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generate()}
            placeholder={`Generate ${genMode}…`}
            className="flex-1 min-w-0 bg-black/50 border border-white/10 focus:border-fuchsia-400/50 rounded-md px-2 py-1.5 text-white text-[11px] outline-none"
          />
          <button data-agent-id="kutt-generate" onClick={generate} disabled={generating || !genPrompt.trim()}
            className="px-2 py-1.5 bg-gradient-to-r from-fuchsia-500 to-cyan-500 disabled:opacity-40 rounded-md text-white">
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Library grid */}
      <div className="flex-1 overflow-y-auto p-2 grid grid-cols-2 gap-2 content-start">
        {assets.length === 0 && (
          <p className="col-span-2 text-white/25 text-[10px] text-center py-8">Import media, generate with AI,<br />or ask the Director agent →</p>
        )}
        {assets.map((a) => (
          <button
            key={a.id}
            onClick={() => onAddToTimeline(a)}
            title={`${a.name} — click to add to timeline`}
            className="group relative aspect-video rounded-lg overflow-hidden border border-white/10 hover:border-cyan-400/60 bg-zinc-900 text-left"
          >
            {a.type === "image" && <img src={a.url} alt={a.name} className="w-full h-full object-cover" loading="lazy" />}
            {a.type === "video" && <video src={a.url} muted preload="metadata" className="w-full h-full object-cover" />}
            {a.type === "audio" && <div className="w-full h-full flex items-center justify-center"><Music className="w-6 h-6 text-emerald-400" /></div>}
            <div className="absolute inset-x-0 bottom-0 bg-black/70 px-1.5 py-0.5 flex items-center gap-1">
              <TypeIcon type={a.type} />
              <span className="text-white/80 text-[8px] truncate flex-1">{a.name}</span>
            </div>
            <div className="absolute inset-0 bg-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Plus className="w-5 h-5 text-white drop-shadow" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}