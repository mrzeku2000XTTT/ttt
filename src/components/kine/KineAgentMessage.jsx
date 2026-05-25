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
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-zinc-900 px-4 py-2.5 text-white text-sm leading-relaxed shadow-sm">
          {message.content}
        </div>
        <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200/60 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-zinc-500" />
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
      <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center flex-shrink-0 shadow-sm">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 max-w-[85%]">
        {message.status === "enhancing" && (
          <div className="rounded-2xl rounded-tl-sm bg-white border border-zinc-200/70 px-4 py-3 flex items-center gap-2.5 text-sm text-zinc-600 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-zinc-400 animate-pulse" />
            <span>Enhancing your prompt…</span>
          </div>
        )}

        {message.status === "generating" && (
          <div className="space-y-2">
            <div className="rounded-2xl rounded-tl-sm bg-white border border-zinc-200/70 px-4 py-3 text-sm shadow-sm">
              <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-400 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> Enhanced Prompt
              </div>
              <p className="text-zinc-700 leading-relaxed italic">{message.content}</p>
            </div>
            <div className="rounded-2xl bg-zinc-50 border border-zinc-200/70 px-4 py-3 flex items-center gap-2.5 text-sm">
              <Loader2 className="w-4 h-4 text-zinc-500 animate-spin flex-shrink-0" />
              <div>
                <div className="text-zinc-900 font-semibold">Generating your video…</div>
                <div className="text-zinc-500 text-[11px]">{message.hint || "30-60 seconds"}</div>
              </div>
            </div>
          </div>
        )}

        {message.status === "done" && message.videoUrl && (
          <div className="space-y-2">
            <div className="rounded-2xl rounded-tl-sm bg-white border border-zinc-200/70 px-4 py-3 text-sm shadow-sm">
              <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-400 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> Generated From
                {message.matchedLabel && (
                  <span className="ml-auto px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-500 text-[9px] tracking-wider">
                    {message.matchedLabel}
                  </span>
                )}
              </div>
              <p className="text-zinc-700 leading-relaxed italic">{message.content}</p>
            </div>
            <div className="rounded-2xl overflow-hidden bg-black border border-zinc-200/70 shadow-lg shadow-zinc-900/10">
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
                className="flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </a>
              <a
                href={message.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-white hover:bg-zinc-50 border border-zinc-200/70 text-zinc-700 text-xs font-semibold transition-colors"
              >
                <Film className="w-3.5 h-3.5" />
                Open
              </a>
            </div>
          </div>
        )}

        {message.status === "custom_ready" && (
          <div className="space-y-2">
            <div className="rounded-2xl rounded-tl-sm bg-white border border-zinc-200/70 px-4 py-3 text-sm shadow-sm">
              <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-400 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> Custom Prompt Ready
              </div>
              <p className="text-zinc-700 leading-relaxed italic">{message.content}</p>
            </div>
            <div className="rounded-2xl bg-amber-50 border border-amber-200/70 px-4 py-3 text-sm text-amber-800">
              No preset was used. This custom request is ready for real video generation when a video provider is connected.
            </div>
          </div>
        )}

        {message.status === "error" && (
          <div className="rounded-2xl rounded-tl-sm bg-red-50 border border-red-200/70 px-4 py-3 flex items-start gap-2.5 text-sm">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-red-700 font-semibold">Generation failed</div>
              <div className="text-red-600/70 text-[11px] mt-0.5">{message.error}</div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}