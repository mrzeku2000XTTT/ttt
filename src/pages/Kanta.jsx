import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Mic, Music, Loader2, Copy, Check, Download, BookOpen, Sparkles, RefreshCw } from "lucide-react";

// Kanta — real lyrics generator powered by TTT's built-in AI.
// Strict monochrome: pure black background, white text only. No other colors.

export default function Kanta() {
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showDocs, setShowDocs] = useState(true);

  const genLyrics = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("kantaGenerate", { prompt });
      setTitle(res.title || "Untitled");
      setLyrics(res.lyrics || "");
      setTags(res.tags || "");
    } catch (e) {
      setError(e?.message || "Lyrics generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const copyLyrics = async () => {
    try {
      await navigator.clipboard.writeText(`${title}\n\n${lyrics}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const downloadLyrics = () => {
    const blob = new Blob([`${title}\n\n${lyrics}`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]+/gi, "_").toLowerCase() || "kanta_lyrics"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export in the exact format the HeartMuLa heartlib repo reads:
  // assets/lyrics.txt (section-tagged lyrics) and assets/tags.txt (comma-separated, no spaces).
  // Drop both into your local heartlib/assets/ folder and run:
  //   python ./examples/run_music_generation.py --model_path=./ckpt --version="3B"
  const downloadHeartMula = () => {
    const save = (filename, content) => {
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    };
    save("lyrics.txt", lyrics);
    setTimeout(() => save("tags.txt", tags), 300);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
              <Mic className="w-6 h-6 text-black" />
            </div>
            <div className="leading-tight">
              <h1 className="text-xl font-extrabold tracking-tight">Kanta</h1>
              <p className="text-[11px] text-white/50 -mt-0.5">AI Lyrics Writer</p>
            </div>
          </div>
          <button
            onClick={() => setShowDocs((s) => !s)}
            className="flex items-center gap-1.5 text-xs font-medium text-white/70 hover:text-white border border-white/15 rounded-full px-3 py-1.5 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            {showDocs ? "Hide docs" : "Docs"}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-6 space-y-6">
        {/* Docs */}
        {showDocs && (
          <section className="space-y-4 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-white" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-white/60">About Kanta</h2>
            </div>
            <p className="text-sm text-white/80 leading-relaxed">
              Kanta writes original song lyrics from a single prompt. Powered by TTT's built-in AI,
              it drafts a titled, structured lyric sheet — verses, chorus, bridge, outro — that you
              can edit, copy, or download and use anywhere.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="border border-white/10 rounded-xl p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-white/50 mb-1">1 · Write</p>
                <p className="text-sm text-white/80">Describe a vibe, story, or feeling.</p>
              </div>
              <div className="border border-white/10 rounded-xl p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-white/50 mb-1">2 · Generate</p>
                <p className="text-sm text-white/80">Kanta drafts titled, structured lyrics + style tags.</p>
              </div>
              <div className="border border-white/10 rounded-xl p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-white/50 mb-1">3 · HeartMuLa</p>
                <p className="text-sm text-white/80">Export lyrics.txt + tags.txt for the open-source heartlib repo.</p>
              </div>
            </div>
            <p className="text-[11px] text-white/40 pt-1">
              Kanta runs inside the TTT super app on the Kaspa network. Lyrics are generated by TTT's
              own AI — no external keys or quotas. Export drops the exact files the{" "}
              <a href="https://github.com/HeartMuLa/heartlib" target="_blank" rel="noreferrer" className="underline text-white/60 hover:text-white">
                HeartMuLa heartlib
              </a>{" "}
              repo reads (assets/lyrics.txt + assets/tags.txt) so you can generate the full song locally with{" "}
              <code className="text-white/50">python ./examples/run_music_generation.py --model_path=./ckpt --version="3B"</code>.
            </p>
          </section>
        )}

        {/* Prompt */}
        <section className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-widest text-white/60">Prompt for lyrics</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. A love-at-first-sight song about falling for an AI"
            rows={3}
            className="w-full bg-transparent border border-white/15 rounded-xl p-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/50 resize-none"
          />
          <button
            onClick={genLyrics}
            disabled={loading || !prompt.trim()}
            className="flex items-center gap-2 bg-white text-black font-semibold text-sm px-4 py-2.5 rounded-full disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/90 transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? "Writing lyrics…" : "Generate lyrics"}
          </button>
        </section>

        {/* Error */}
        {error && (
          <p className="text-sm text-white border border-white/20 rounded-xl p-3">{error}</p>
        )}

        {/* Lyrics result */}
        {(title || lyrics) && (
          <section className="space-y-3 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Music className="w-4 h-4 text-white/70 flex-shrink-0" />
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="flex-1 min-w-0 bg-transparent border-b border-white/10 pb-1 text-base font-bold text-white focus:outline-none focus:border-white/40"
                />
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={genLyrics}
                  disabled={loading}
                  title="Regenerate"
                  className="flex items-center justify-center w-8 h-8 rounded-full border border-white/15 text-white/60 hover:text-white hover:border-white/40 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={copyLyrics}
                  title="Copy"
                  className="flex items-center justify-center w-8 h-8 rounded-full border border-white/15 text-white/60 hover:text-white hover:border-white/40 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={downloadLyrics}
                  title="Download"
                  className="flex items-center justify-center w-8 h-8 rounded-full border border-white/15 text-white/60 hover:text-white hover:border-white/40 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <textarea
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              rows={14}
              className="w-full bg-transparent border border-white/10 rounded-xl p-3 text-sm text-white/90 focus:outline-none focus:border-white/40 resize-none whitespace-pre-wrap leading-relaxed"
            />
            <p className="text-[11px] text-white/40">Edit freely — these are your lyrics to keep.</p>

            {/* HeartMuLa tags — comma-separated, no spaces (assets/tags.txt format) */}
            <div className="pt-2 space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/60 flex items-center gap-1.5">
                <Music className="w-3 h-3" /> HeartMuLa tags
              </label>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="piano,happy,wedding,synthesizer,romantic"
                className="w-full bg-transparent border border-white/15 rounded-xl p-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/50 font-mono"
              />
              <p className="text-[11px] text-white/40">
                Comma-separated, no spaces. These are the style tags the HeartMuLa heartlib repo reads from assets/tags.txt.
              </p>
            </div>

            <button
              onClick={downloadHeartMula}
              disabled={!lyrics || !tags}
              className="w-full flex items-center justify-center gap-2 border border-white/20 text-white font-semibold text-sm px-4 py-2.5 rounded-full disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download for HeartMuLa (lyrics.txt + tags.txt)
            </button>
          </section>
        )}

        <div className="h-8" />
      </main>
    </div>
  );
}