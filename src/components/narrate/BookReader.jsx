import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Play, Pause, Square, SkipBack, SkipForward, X, Gauge, Loader2, Volume2 } from "lucide-react";

// Split text into reasonably sized sentence chunks for stable TTS + highlighting.
function splitSentences(text) {
  if (!text) return [];
  const clean = String(text).replace(/\r/g, "").replace(/\u0000/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  const parts = clean.split(/(?<=[.!?])\s+|\n+/);
  const out = [];
  for (let p of parts) {
    p = p.trim();
    if (!p) continue;
    if (p.length > 280) {
      const sub = p.split(/(?<=,)\s+/);
      let buf = "";
      for (const s of sub) {
        if ((buf + " " + s).trim().length > 280 && buf) { out.push(buf.trim()); buf = s; }
        else buf = (buf ? buf + " " : "") + s;
      }
      if (buf.trim()) out.push(buf.trim());
    } else {
      out.push(p);
    }
  }
  return out;
}

export default function BookReader({ text, title, author, onClose }) {
  const sentences = useMemo(() => splitSentences(text), [text]);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [voices, setVoices] = useState([]);
  const [voiceURI, setVoiceURI] = useState(null);
  const [wordRange, setWordRange] = useState(null);
  const [supported] = useState(() => typeof window !== "undefined" && "speechSynthesis" in window);

  const synthRef = useRef(window.speechSynthesis);
  const playingRef = useRef(false);
  const idxRef = useRef(0);
  const rateRef = useRef(1);
  const voiceRef = useRef(null);

  useEffect(() => { idxRef.current = idx; }, [idx]);
  useEffect(() => { rateRef.current = rate; }, [rate]);
  useEffect(() => { voiceRef.current = voices.find((v) => v.voiceURI === voiceURI) || null; }, [voiceURI, voices]);

  // Load voices (async on some browsers)
  useEffect(() => {
    if (!supported) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null; };
  }, [supported]);

  // Default to a natural English voice
  useEffect(() => {
    if (!voices.length || voiceURI) return;
    const preferred =
      voices.find((v) => /en[-_]?US/i.test(v.lang) && /samantha|google|natural|aria|jenny/i.test(v.name)) ||
      voices.find((v) => /en[-_]?US/i.test(v.lang)) ||
      voices.find((v) => /^en/i.test(v.lang)) ||
      voices[0];
    if (preferred) setVoiceURI(preferred.voiceURI);
  }, [voices, voiceURI]);

  const speakFrom = useCallback((i) => {
    const synth = synthRef.current;
    if (!synth) return;
    synth.cancel();
    if (i < 0 || i >= sentences.length) { playingRef.current = false; setPlaying(false); setWordRange(null); return; }
    setIdx(i);
    idxRef.current = i;
    const u = new SpeechSynthesisUtterance(sentences[i]);
    u.rate = rateRef.current;
    u.pitch = 1;
    if (voiceRef.current) u.voice = voiceRef.current;
    u.onboundary = (e) => {
      if (e.name === "word" || !e.name) {
        setWordRange({ start: e.charIndex, end: e.charIndex + (e.charLength || 0) });
      }
    };
    u.onend = () => {
      setWordRange(null);
      if (!playingRef.current) return;
      const next = i + 1;
      if (next < sentences.length) speakFrom(next);
      else { playingRef.current = false; setPlaying(false); }
    };
    u.onerror = () => setWordRange(null);
    synth.speak(u);
  }, [sentences]);

  const togglePlay = () => {
    const synth = synthRef.current;
    if (!supported) return;
    if (playingRef.current) {
      playingRef.current = false;
      synth.cancel();
      setPlaying(false);
      setWordRange(null);
    } else {
      playingRef.current = true;
      setPlaying(true);
      speakFrom(idxRef.current);
    }
  };

  const stop = () => {
    playingRef.current = false;
    if (supported) synthRef.current.cancel();
    setPlaying(false);
    setIdx(0);
    idxRef.current = 0;
    setWordRange(null);
  };

  const jump = (delta) => {
    const n = Math.max(0, Math.min(sentences.length - 1, idxRef.current + delta));
    const wasPlaying = playingRef.current;
    playingRef.current = false;
    if (supported) synthRef.current.cancel();
    setWordRange(null);
    setIdx(n);
    idxRef.current = n;
    if (wasPlaying) { playingRef.current = true; speakFrom(n); }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      playingRef.current = false;
      try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch {}
    };
  }, []);

  // Auto-scroll current sentence into view
  const currentRef = useRef(null);
  useEffect(() => {
    if (currentRef.current) currentRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [idx]);

  const progress = sentences.length ? ((idx + (playing ? 1 : 0)) / sentences.length) * 100 : 0;

  const renderSentence = (s, i) => {
    const isCurrent = i === idx;
    if (!isCurrent) {
      return <p className="text-white/35 text-[15px] leading-relaxed">{s}</p>;
    }
    if (wordRange && wordRange.end > wordRange.start) {
      const before = s.slice(0, wordRange.start);
      const word = s.slice(wordRange.start, wordRange.end);
      const after = s.slice(wordRange.end);
      return (
        <p className="text-white text-[19px] sm:text-[21px] leading-relaxed font-medium">
          {before}
          <span className="bg-white text-black rounded px-0.5">{word}</span>
          {after}
        </p>
      );
    }
    return <p className="text-white text-[19px] sm:text-[21px] leading-relaxed font-medium">{s}</p>;
  };

  const windowStart = Math.max(0, idx - 1);
  const windowEnd = Math.min(sentences.length, idx + 3);
  const visible = sentences.slice(windowStart, windowEnd).map((s, k) => ({ s, i: windowStart + k }));

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
        <div className="min-w-0 flex-1 px-3 text-center">
          <div className="text-[13px] font-semibold truncate">{title}</div>
          {author && <div className="text-[11px] text-white/45 truncate">{author}</div>}
        </div>
        <div className="w-9 h-9 flex items-center justify-center text-white/50 flex-shrink-0">
          <Volume2 className="w-4 h-4" />
        </div>
      </div>

      {/* Caption area */}
      <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-8 max-w-2xl w-full mx-auto">
        {sentences.length === 0 ? (
          <div className="text-center text-white/50 py-20 text-[14px]">No readable text.</div>
        ) : (
          <div className="space-y-5">
            {visible.map(({ s, i }) => (
              <div key={i} ref={i === idx ? currentRef : null}>
                {renderSentence(s, i)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="px-5 sm:px-8 max-w-2xl w-full mx-auto">
        <div className="h-1 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-white transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center justify-between mt-1.5 text-[10px] text-white/40">
          <span>Sentence {Math.min(idx + 1, sentences.length)} of {sentences.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 py-4 pb-6 border-t border-white/10" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1.25rem)" }}>
        {!supported && (
          <div className="text-center text-[12px] text-amber-400/80 mb-3">Voice playback isn't supported in this browser — captions still work.</div>
        )}
        <div className="max-w-md mx-auto">
          {/* Voice + speed row */}
          <div className="flex items-center gap-3 mb-4">
            <select
              value={voiceURI || ""}
              onChange={(e) => setVoiceURI(e.target.value)}
              className="flex-1 min-w-0 h-9 px-2 rounded-lg bg-white/5 border border-white/10 text-[12px] text-white outline-none"
            >
              {voices.length === 0 && <option>Default voice</option>}
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI} className="bg-black text-white">
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2 px-3 h-9 rounded-lg bg-white/5 border border-white/10">
              <Gauge className="w-3.5 h-3.5 text-white/50" />
              <input
                type="range"
                min={0.5}
                max={2}
                step={0.1}
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="w-20 accent-white"
              />
              <span className="text-[11px] text-white/60 w-8">{rate.toFixed(1)}x</span>
            </div>
          </div>

          {/* Playback buttons */}
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => jump(-1)} className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" title="Previous sentence">
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={togglePlay}
              disabled={!supported || sentences.length === 0}
              className="w-16 h-16 rounded-full bg-white text-black hover:bg-white/90 flex items-center justify-center transition-colors disabled:opacity-40"
              title={playing ? "Pause" : "Play"}
            >
              {playing ? <Pause className="w-6 h-6" fill="black" /> : <Play className="w-6 h-6 ml-0.5" fill="black" />}
            </button>
            <button onClick={() => jump(1)} className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" title="Next sentence">
              <SkipForward className="w-4 h-4" />
            </button>
            <button onClick={stop} className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" title="Stop">
              <Square className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}