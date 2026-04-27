import React, { useState } from "react";
import { Download, ExternalLink, Copy, Check, Loader2, ImageOff, Globe } from "lucide-react";
import World360Viewer from "@/components/rmx/World360Viewer";

export default function NodeImageOutput({ url }) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [errored, setErrored] = useState(false);
  const [world, setWorld] = useState(false);

  if (!url) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(url, { mode: "cors" });
      const blob = await res.blob();
      const ext = (blob.type.split("/")[1] || "png").split(";")[0];
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `noda-image-${Date.now()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch {
      // Fallback: open in new tab so user can right-click → save
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="rounded-lg overflow-hidden border border-cyan-500/20 bg-black/40">
      <div className="relative aspect-square w-full bg-zinc-900 flex items-center justify-center">
        {errored ? (
          <div className="flex flex-col items-center gap-2 text-white/40 text-xs">
            <ImageOff className="w-6 h-6" />
            <span>Image failed to load</span>
          </div>
        ) : (
          <img
            src={url}
            alt="Generated"
            onError={() => setErrored(true)}
            className="w-full h-full object-contain"
          />
        )}
      </div>

      <button
        onClick={() => setWorld(true)}
        disabled={errored}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border-t border-cyan-500/30 text-cyan-200 text-xs font-black tracking-wider disabled:opacity-40"
      >
        <Globe className="w-3.5 h-3.5" /> ENTER 360° WORLD
      </button>

      <div className="grid grid-cols-3 divide-x divide-white/10 border-t border-white/10">
        <button
          onClick={handleDownload}
          disabled={downloading || errored}
          className="flex items-center justify-center gap-1.5 py-2 text-cyan-300 hover:bg-cyan-500/10 disabled:opacity-50 text-[11px] font-bold"
        >
          {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          Save
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 py-2 text-white/70 hover:bg-white/5 text-[11px] font-bold"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Open
        </a>
        <button
          onClick={handleCopy}
          className="flex items-center justify-center gap-1.5 py-2 text-white/70 hover:bg-white/5 text-[11px] font-bold"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "URL"}
        </button>
      </div>

      {world && <World360Viewer imageUrl={url} onClose={() => setWorld(false)} />}
    </div>
  );
}