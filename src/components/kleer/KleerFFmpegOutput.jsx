import React, { useState } from "react";
import { Copy, Check, Download, Terminal, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function KleerFFmpegOutput({ box, videoDims, remoteUrl, originalName }) {
  const [copied, setCopied] = useState(false);

  const safeName = (originalName || "video.mp4").replace(/[^a-zA-Z0-9._-]/g, "_");
  const outName = safeName.replace(/(\.[^.]+)?$/, "_clean$1");

  // Build FFmpeg delogo command. delogo interpolates from surrounding pixels.
  const cmd = `ffmpeg -i "${safeName}" -vf "delogo=x=${box.x}:y=${box.y}:w=${box.w}:h=${box.h}:show=0" -c:a copy "${outName}"`;

  // Alt: inpaint-style using removelogo requires a mask. delogo is the most practical.
  const altCmd = `ffmpeg -i "${safeName}" -vf "delogo=x=${box.x}:y=${box.y}:w=${box.w}:h=${box.h}:show=0,boxblur=luma_radius=min(h\\,w)/80:luma_power=1" -c:a copy "${outName}"`;

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Command copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      {/* Uploaded video link */}
      <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <Download className="w-4 h-4 text-green-400" />
          <p className="text-green-300 text-sm font-semibold">Video uploaded to cloud</p>
        </div>
        <a
          href={remoteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-400 hover:text-green-300 text-xs break-all underline inline-flex items-center gap-1"
        >
          {remoteUrl} <ExternalLink className="w-3 h-3 flex-shrink-0" />
        </a>
      </div>

      {/* Main FFmpeg command */}
      <div className="p-4 bg-black border border-cyan-500/30 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <p className="text-white font-bold text-sm">FFmpeg Command</p>
          </div>
          <button
            onClick={() => copy(cmd)}
            className="flex items-center gap-1 px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 rounded-full text-xs text-cyan-300 font-semibold transition-all"
          >
            {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
          </button>
        </div>
        <pre className="text-cyan-300 text-xs font-mono bg-black/60 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all">
{cmd}
        </pre>
        <p className="text-white/40 text-[10px] mt-2">
          Region: x={box.x}, y={box.y}, w={box.w}, h={box.h} ({videoDims.width}×{videoDims.height})
        </p>
      </div>

      {/* Alt command with blur */}
      <details className="group">
        <summary className="cursor-pointer text-white/50 hover:text-white/80 text-xs font-semibold flex items-center gap-1 select-none">
          <span className="group-open:rotate-90 transition-transform">▶</span> Alternative: delogo + blur (better for busy backgrounds)
        </summary>
        <div className="mt-2 p-3 bg-black border border-white/10 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <p className="text-white/70 text-xs font-semibold">With extra blur pass</p>
            <button
              onClick={() => copy(altCmd)}
              className="flex items-center gap-1 px-2 py-0.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] text-white/70 transition-all"
            >
              <Copy className="w-3 h-3" /> Copy
            </button>
          </div>
          <pre className="text-white/70 text-[11px] font-mono bg-black/60 rounded-lg p-2 overflow-x-auto whitespace-pre-wrap break-all">
{altCmd}
          </pre>
        </div>
      </details>
    </div>
  );
}