import React from "react";
import { motion } from "framer-motion";
import { Bot, User, Loader2, Download, Sparkles, Film, AlertCircle } from "lucide-react";

export default function KineAgentMessage({ message }) {
  if (message.role === "user") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3 justify-end"
      >
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-fuchsia-500 to-violet-600 px-4 py-2.5 text-white text-sm leading-relaxed shadow-lg shadow-fuchsia-500/20">
          {message.content}
        </div>
        <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-white/70" />
        </div>
      </motion.div>
    );
  }

  // Agent message
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3"
    >
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-fuchsia-500 via-violet-500 to-cyan-400 flex items-center justify-center flex-shrink-0 shadow-lg shadow-fuchsia-500/40">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 max-w-[85%]">
        {message.status === "enhancing" && (
          <div className="rounded-2xl rounded-tl-sm bg-white/5 border border-white/10 px-4 py-3 flex items-center gap-2.5 text-sm text-white/80">
            <Sparkles className="w-3.5 h-3.5 text-fuchsia-300 animate-pulse" />
            <span>Enhancing your prompt…</span>
          </div>
        )}

        {message.status === "generating" && (
          <div className="space-y-2">
            <div className="rounded-2xl rounded-tl-sm bg-white/5 border border-white/10 px-4 py-3 text-sm">
              <div className="text-[10px] font-bold tracking-widest uppercase text-fuchsia-300 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> Enhanced Prompt
              </div>
              <p className="text-white/85 leading-relaxed italic">{message.content}</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-r from-fuchsia-500/10 via-violet-500/10 to-cyan-500/10 border border-fuchsia-500/20 px-4 py-3 flex items-center gap-2.5 text-sm">
              <Loader2 className="w-4 h-4 text-fuchsia-300 animate-spin flex-shrink-0" />
              <div>
                <div className="text-white font-semibold">Generating your video…</div>
                <div className="text-white/50 text-[11px]">{message.hint || "30-60 seconds"}</div>
              </div>
            </div>
          </div>
        )}

        {message.status === "done" && message.videoUrl && (
          <div className="space-y-2">
            <div className="rounded-2xl rounded-tl-sm bg-white/5 border border-white/10 px-4 py-3 text-sm">
              <div className="text-[10px] font-bold tracking-widest uppercase text-fuchsia-300 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> Generated From
              </div>
              <p className="text-white/85 leading-relaxed italic">{message.content}</p>
            </div>
            <div className="rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl shadow-fuchsia-500/10">
              <video
                src={message.videoUrl}
                controls
                autoPlay
                loop
                muted
                playsInline
                className="w-full aspect-video bg-black"
              />
            </div>
            <div className="flex items-center gap-2">
              <a
                href={message.videoUrl}
                download={`kine-${Date.now()}.mp4`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </a>
              <a
                href={message.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-xs font-bold"
              >
                <Film className="w-3.5 h-3.5" />
                Open
              </a>
            </div>
          </div>
        )}

        {message.status === "error" && (
          <div className="rounded-2xl rounded-tl-sm bg-red-500/10 border border-red-500/30 px-4 py-3 flex items-start gap-2.5 text-sm">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-red-300 font-semibold">Generation failed</div>
              <div className="text-white/60 text-[11px] mt-0.5">{message.error}</div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}