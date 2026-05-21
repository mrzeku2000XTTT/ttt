import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

export default function ViralXTool({ storageKey = "moodboard_viral_x_tool" }) {
  const saved = (() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "{}");
    } catch {
      return {};
    }
  })();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(saved.input || "");
  const [output, setOutput] = useState(saved.output || "");
  const [loading, setLoading] = useState(false);

  const saveSession = (nextInput, nextOutput) => {
    localStorage.setItem(storageKey, JSON.stringify({ input: nextInput, output: nextOutput }));
  };

  const generatePost = async () => {
    if (!input.trim()) return;
    setLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an elite viral X post strategist. Ingest this long-form idea fully, preserve its power, emotion, intent, and core message, then compress and restructure it into a high-impact viral X post optimized for hooks, retention, engagement, replies, reposts, and shareability. Keep it sharp, human, emotionally charged, and algorithm-friendly. Return one polished post only, no explanations.\n\nLONG IDEA:\n${input}`
    });
    setOutput(result);
    saveSession(input, result);
    setLoading(false);
  };

  return (
    <div className="mt-3 rounded-3xl border border-white/10 bg-white/[0.06] p-3 backdrop-blur-2xl">
      <button
        onClick={() => setOpen(!open)}
        className="w-full rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold tracking-tight text-white/90 shadow-inner shadow-white/10 backdrop-blur-2xl transition hover:bg-white/15"
      >
        Viral X Post Tool
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              saveSession(e.target.value, output);
            }}
            placeholder="Paste a massive prompt or long idea here..."
            className="min-h-36 w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-sm font-medium leading-6 text-white outline-none placeholder:text-white/35 focus:border-white/25"
          />
          <Button onClick={generatePost} disabled={loading || !input.trim()} className="w-full rounded-full border border-white/15 bg-white/10 font-semibold tracking-tight text-white shadow-inner shadow-white/10 backdrop-blur-2xl hover:bg-white/15">
            {loading ? "Writing Viral Post..." : "Compress Into X Post"}
          </Button>
          {output && (
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm font-medium leading-6 text-white/80 whitespace-pre-wrap">
              {output}
            </div>
          )}
        </div>
      )}
    </div>
  );
}