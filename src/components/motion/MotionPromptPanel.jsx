import React from "react";
import { Sparkles, Loader2, Wand2, RotateCcw } from "lucide-react";

export default function MotionPromptPanel({
  prompt,
  setPrompt,
  onGenerate,
  generating,
  onReset,
}) {
  return (
    <div className="flex flex-col h-full bg-zinc-950 border-r border-white/10">
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
            <Wand2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-white text-sm font-bold">Vibe Prompt</h2>
            <p className="text-white/40 text-[10px]">Describe your landing page</p>
          </div>
        </div>
        <button
          onClick={onReset}
          className="text-white/50 hover:text-white text-[11px] flex items-center gap-1"
          title="Reset prompt"
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the landing page you want to generate…"
          className="w-full h-full min-h-[400px] bg-black/40 border border-white/10 rounded-xl p-4 text-[12px] text-white/90 font-mono leading-relaxed resize-none focus:outline-none focus:border-cyan-500/50"
        />
      </div>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={onGenerate}
          disabled={generating || !prompt.trim()}
          className="w-full h-11 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Generating…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" /> Generate Landing Page
            </>
          )}
        </button>
        <p className="text-[10px] text-white/40 mt-2 text-center">
          Outputs a single self-contained React component
        </p>
      </div>
    </div>
  );
}