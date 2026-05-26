import React, { useEffect, useRef, useState } from "react";
import { Upload, Video, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

const STORAGE_KEY = "ttt_landing_loop_video";

export default function LandingVideoUploader() {
  const inputRef = useRef(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setVideoUrl(localStorage.getItem(STORAGE_KEY) || "");
  }, []);

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    localStorage.setItem(STORAGE_KEY, file_url);
    setVideoUrl(file_url);
    setUploading(false);
  };

  const clearVideo = () => {
    localStorage.removeItem(STORAGE_KEY);
    setVideoUrl("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <>
      {videoUrl && (
        <video
          src={videoUrl}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-55"
        />
      )}

      <div className="absolute bottom-5 right-5 z-30 flex items-center gap-2 rounded-full border border-white/15 bg-black/45 p-2 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          onChange={handleUpload}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 rounded-full bg-emerald-400 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-black transition hover:bg-emerald-300 disabled:opacity-60"
        >
          {uploading ? <Video className="h-4 w-4 animate-pulse" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Uploading" : "Upload Loop"}
        </button>
        {videoUrl && (
          <button
            type="button"
            onClick={clearVideo}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Remove landing video"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </>
  );
}