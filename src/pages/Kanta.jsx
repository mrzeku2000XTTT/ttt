import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Mic, Music, Loader2, Download, RefreshCw, BookOpen, Sparkles } from "lucide-react";

// Kanta — lyrics-to-song generator powered by Mureka AI.
// Strict monochrome: pure black background, white text only. No other colors.

export default function Kanta() {
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [stylePrompt, setStylePrompt] = useState("");
  const [gender, setGender] = useState("");

  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [songLoading, setSongLoading] = useState(false);
  const [audioUrls, setAudioUrls] = useState([]);
  const [error, setError] = useState("");
  const [showDocs, setShowDocs] = useState(true);

  const genLyrics = async () => {
    if (!prompt.trim()) return;
    setLyricsLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("kantaGenerate", { mode: "lyrics", prompt });
      setTitle(res.title || "");
      setLyrics(res.lyrics || "");
    } catch (e) {
      setError(e?.message || "Lyrics generation failed.");
    } finally {
      setLyricsLoading(false);
    }
  };

  const genSong = async () => {
    if (!lyrics.trim()) return;
    setSongLoading(true);
    setError("");
    setAudioUrls([]);
    try {
      const res = await base44.functions.invoke("kantaGenerate", {
        mode: "song",
        lyrics,
        stylePrompt,
        gender: gender || undefined,
      });
      setAudioUrls(res.urls || []);
    } catch (e) {
      setError(e?.message || "Song generation failed.");
    } finally {
      setSongLoading(false);
    }
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
              <p className="text-[11px] text-white/50 -mt-0.5">Lyrics → Song</p>
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
              Kanta turns words into music. Powered by the Mureka AI music engine, it writes original
              lyrics from a single prompt, then composes a full produced song around them — vocals,
              instrumentation, and all. Royalty-free output you can download and use anywhere.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="border border-white/10 rounded-xl p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-white/50 mb-1">1 · Write</p>
                <p className="text-sm text-white/80">Describe a vibe or story. Kanta drafts titled lyrics.</p>
              </div>
              <div className="border border-white/10 rounded-xl p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-white/50 mb-1">2 · Style</p>
                <p className="text-sm text-white/80">Add a genre/mood prompt and pick a vocal gender.</p>
              </div>
              <div className="border border-white/10 rounded-xl p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-white/50 mb-1">3 · Generate</p>
                <p className="text-sm text-white/80">Mureka composes your song in seconds.</p>
              </div>
              <div className="border border-white/10 rounded-xl p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-white/50 mb-1">4 · Play</p>
                <p className="text-sm text-white/80">Preview and download the audio instantly.</p>
              </div>
            </div>
            <p className="text-[11px] text-white/40 pt-1">
              Kanta runs inside the TTT super app on the Kaspa network. Music generation uses Mureka AI
              credits; each song request consumes API credits.
            </p>
          </section>
        )}

        {/* Step 1: Lyrics */}
        <section className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-widest text-white/60">Prompt for lyrics</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. A hopeful song about chasing dreams under city lights"
            rows={3}
            className="w-full bg-transparent border border-white/15 rounded-xl p-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/50 resize-none"
          />
          <button
            onClick={genLyrics}
            disabled={lyricsLoading || !prompt.trim()}
            className="flex items-center gap-2 bg-white text-black font-semibold text-sm px-4 py-2.5 rounded-full disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/90 transition-colors"
          >
            {lyricsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {lyricsLoading ? "Writing lyrics…" : "Generate lyrics"}
          </button>
        </section>

        {/* Step 2: Lyrics editor */}
        {(title || lyrics) && (
          <section className="space-y-3 border border-white/10 rounded-2xl p-4">
            {title && (
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-white/70" />
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="flex-1 bg-transparent border-b border-white/10 pb-1 text-base font-bold text-white focus:outline-none focus:border-white/40"
                />
              </div>
            )}
            <textarea
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              rows={10}
              className="w-full bg-transparent border border-white/10 rounded-xl p-3 text-sm text-white/90 focus:outline-none focus:border-white/40 resize-none whitespace-pre-wrap"
            />
            <p className="text-[11px] text-white/40">Edit the lyrics freely before generating the song.</p>
          </section>
        )}

        {/* Step 3: Style + generate song */}
        {lyrics.trim() && (
          <section className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-white/60">Style prompt (optional)</label>
            <input
              value={stylePrompt}
              onChange={(e) => setStylePrompt(e.target.value)}
              placeholder="e.g. lo-fi, chill, female vocal, dreamy"
              className="w-full bg-transparent border border-white/15 rounded-xl p-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/50"
            />
            <div className="flex items-center gap-2">
              {["", "female", "male"].map((g) => (
                <button
                  key={g || "any"}
                  onClick={() => setGender(g)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                    gender === g
                      ? "bg-white text-black border-white"
                      : "bg-transparent text-white/70 border-white/15 hover:border-white/40"
                  }`}
                >
                  {g || "any voice"}
                </button>
              ))}
            </div>
            <button
              onClick={genSong}
              disabled={songLoading}
              className="flex items-center gap-2 bg-white text-black font-semibold text-sm px-4 py-2.5 rounded-full disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/90 transition-colors"
            >
              {songLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Music className="w-4 h-4" />}
              {songLoading ? "Composing your song…" : "Generate song"}
            </button>
          </section>
        )}

        {/* Error */}
        {error && (
          <p className="text-sm text-white border border-white/20 rounded-xl p-3">{error}</p>
        )}

        {/* Results */}
        {audioUrls.length > 0 && (
          <section className="space-y-3 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/60">Your song</h3>
              <button
                onClick={genSong}
                disabled={songLoading}
                className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Regenerate
              </button>
            </div>
            {audioUrls.map((url, i) => (
              <div key={i} className="space-y-2 border border-white/10 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/50">Take {i + 1}</span>
                  <a
                    href={url}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </a>
                </div>
                <audio controls src={url} className="w-full" />
              </div>
            ))}
          </section>
        )}

        <div className="h-8" />
      </main>
    </div>
  );
}