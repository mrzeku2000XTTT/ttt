import React, { useRef } from "react";
import { Film, Upload, X } from "lucide-react";

export default function SingleVideoPicker({ video, onSet, onClear }) {
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      alert("Please choose a video file.");
      return;
    }
    onSet({
      id: `video_${Date.now()}`,
      url: URL.createObjectURL(file),
      name: file.name,
      file,
      type: "video",
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-white/60">One video slide</div>
        {video && (
          <button onClick={onClear} className="w-7 h-7 rounded-full bg-white/10 hover:bg-red-500 text-white/70 hover:text-white flex items-center justify-center">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }} />
      {!video ? (
        <button onClick={() => inputRef.current?.click()} className="w-full aspect-video rounded-2xl border-2 border-dashed border-white/15 hover:border-fuchsia-400/60 hover:bg-fuchsia-400/5 transition-colors flex flex-col items-center justify-center gap-2 text-white/45 hover:text-fuchsia-300">
          <Upload className="w-8 h-8" />
          <div className="text-sm font-black">Upload one short video</div>
          <div className="text-[11px] text-white/35">BeatCut edits the first 10 seconds</div>
        </button>
      ) : (
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-black ring-1 ring-white/10">
          <video src={video.url} className="w-full h-full object-cover" muted playsInline />
          <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center gap-2 text-white">
              <Film className="w-4 h-4 text-fuchsia-300" />
              <div className="text-xs font-bold truncate">{video.name}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}