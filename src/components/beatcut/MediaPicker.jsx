import React, { useRef } from "react";
import { Upload, X, Image as ImageIcon, Video, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MediaPicker({ clips, onAdd, onRemove }) {
  const inputRef = useRef(null);

  const handleFiles = (fileList) => {
    Array.from(fileList || []).forEach((file) => {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      if (!isImage && !isVideo) return;
      onAdd({
        id: `clip_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        url: URL.createObjectURL(file),
        type: isImage ? "image" : "video",
        name: file.name,
        file,
      });
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-white/60">Media · {clips.length}</div>
        <button onClick={() => inputRef.current?.click()} className="flex items-center gap-1 px-2.5 h-7 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white/80 text-[11px] font-bold">
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
      {clips.length === 0 ? (
        <button onClick={() => inputRef.current?.click()} className="w-full aspect-[3/2] rounded-xl border-2 border-dashed border-white/15 hover:border-fuchsia-400/60 hover:bg-fuchsia-400/5 transition-colors flex flex-col items-center justify-center gap-2 text-white/40 hover:text-fuchsia-300">
          <Upload className="w-7 h-7" />
          <div className="text-[11px] font-bold">Tap to add photos / videos</div>
          <div className="text-[10px] text-white/30">Pick at least 3 for the best auto-cut</div>
        </button>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          <AnimatePresence>
            {clips.map((c, idx) => (
              <motion.div key={c.id} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="relative aspect-square rounded-lg overflow-hidden bg-white/5 ring-1 ring-white/10 group">
                {c.type === "image" ? <img src={c.url} alt={c.name} className="w-full h-full object-cover" /> : <video src={c.url} className="w-full h-full object-cover" muted />}
                <div className="absolute top-0.5 left-0.5 px-1 py-0.5 rounded bg-black/60 backdrop-blur text-[8px] font-bold text-white">{idx + 1}</div>
                <div className="absolute bottom-0.5 left-0.5 w-4 h-4 rounded-full bg-black/60 backdrop-blur flex items-center justify-center">
                  {c.type === "image" ? <ImageIcon className="w-2.5 h-2.5 text-white" /> : <Video className="w-2.5 h-2.5 text-white" />}
                </div>
                <button onClick={(e) => { e.stopPropagation(); onRemove(c.id); }} className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 hover:bg-red-500 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-3 h-3 text-white" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          <button onClick={() => inputRef.current?.click()} className="aspect-square rounded-lg border-2 border-dashed border-white/15 hover:border-fuchsia-400/60 hover:bg-fuchsia-400/5 transition-colors flex items-center justify-center text-white/40 hover:text-fuchsia-300">
            <Plus className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}