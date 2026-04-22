import React from "react";
import { Info, Terminal, Download } from "lucide-react";

export default function KleerProcessingInfo() {
  return (
    <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
      <div className="flex items-center gap-2">
        <Info className="w-4 h-4 text-cyan-400" />
        <h3 className="text-white font-bold text-sm">How to run the command</h3>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="p-3 bg-black/40 border border-white/5 rounded-xl">
          <p className="text-cyan-400 text-[10px] font-bold uppercase tracking-wider mb-1">1. Install FFmpeg</p>
          <p className="text-white/60 text-xs leading-relaxed">
            Mac: <code className="text-cyan-300 bg-black/60 px-1 rounded">brew install ffmpeg</code><br />
            Windows: <a href="https://ffmpeg.org/download.html" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">ffmpeg.org</a><br />
            Linux: <code className="text-cyan-300 bg-black/60 px-1 rounded">apt install ffmpeg</code>
          </p>
        </div>
        <div className="p-3 bg-black/40 border border-white/5 rounded-xl">
          <p className="text-cyan-400 text-[10px] font-bold uppercase tracking-wider mb-1">2. Paste command</p>
          <p className="text-white/60 text-xs leading-relaxed">
            Open a terminal in the folder with your video file. Paste the generated command and run it.
          </p>
        </div>
        <div className="p-3 bg-black/40 border border-white/5 rounded-xl">
          <p className="text-cyan-400 text-[10px] font-bold uppercase tracking-wider mb-1">3. Get clean video</p>
          <p className="text-white/60 text-xs leading-relaxed">
            FFmpeg outputs a new file with <code className="text-cyan-300 bg-black/60 px-1 rounded">_clean</code> suffix — watermark removed via pixel interpolation.
          </p>
        </div>
      </div>

      <p className="text-white/30 text-[10px] leading-relaxed pt-1">
        <strong className="text-white/50">Note:</strong> Kleer uses FFmpeg's <code className="text-white/60 bg-black/40 px-1 rounded">delogo</code> filter — the same method used in most open-source watermark removers on GitHub. Works best for semi-transparent logos and solid watermarks. Only remove watermarks from content you own or have the right to modify.
      </p>
    </div>
  );
}