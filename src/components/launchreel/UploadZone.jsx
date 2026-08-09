import React, { useRef, useState } from "react";
import { UploadCloud, Film } from "lucide-react";

export default function UploadZone({ onVideo }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setError("Please upload a video file (MP4, WebM, MOV).");
      return;
    }
    setError("");
    const url = URL.createObjectURL(file);
    onVideo(url, file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFile(e.dataTransfer.files[0]);
      }}
      onClick={() => inputRef.current?.click()}
      className={`relative w-full max-w-xl mx-auto rounded-3xl border-2 border-dashed p-12 text-center cursor-pointer transition-all ${
        dragging ? "border-cyan-400 bg-cyan-500/10 scale-105" : "border-white/20 hover:border-white/40 hover:bg-white/5"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
          <UploadCloud className="w-8 h-8 text-cyan-400" />
        </div>
        <div>
          <p className="text-white font-bold text-lg">Drop your screen recording</p>
          <p className="text-white/40 text-sm mt-1">MP4, WebM, or MOV · up to 500MB</p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-white/30">
          <Film className="w-3.5 h-3.5" />
          <span>Or click to browse</span>
        </div>
      </div>
      {error && <p className="text-red-400 text-xs mt-4">{error}</p>}
    </div>
  );
}