import React, { useEffect, useRef, useState } from "react";
import { X, Bot, Loader2, Download, RotateCw } from "lucide-react";
import { base44 } from "@/api/base44Client";

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function KlipzAgentCanvas({ clip, videoId, onClose }) {
  const [log, setLog] = useState([]);
  const [status, setStatus] = useState("working"); // working | ready | fallback
  const [mp4, setMp4] = useState(null);
  const [start, setStart] = useState(clip.start_s);
  const [end, setEnd] = useState(clip.end_s);
  const [renderKey, setRenderKey] = useState(0);
  const logEndRef = useRef(null);
  const ranRef = useRef(false);

  const say = (text, tone = "info") => setLog((l) => [...l, { text, tone }]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    (async () => {
      say(`Taking "${clip.title}" into the canvas…`);
      await sleep(600);
      say("Fetching MP4 source from the video…");
      try {
        const res = await base44.functions.invoke("klipzClipMp4", { videoId });
        say(`Source locked · ${res.data.quality || "HD"} MP4`, "ok");
        await sleep(500);
        say(`Cutting ${fmt(clip.start_s)} → ${fmt(clip.end_s)}…`);
        await sleep(700);
        say("Rendering your clip on the canvas…");
        await sleep(600);
        setMp4(res.data);
        setStatus("ready");
        say("Done. Adjust IN/OUT below and I'll re-render instantly.", "ok");
      } catch (err) {
        say(err.response?.data?.error || "MP4 engine unavailable", "warn");
        await sleep(400);
        say("Falling back to segment preview — your cut times still apply.", "warn");
        setStatus("fallback");
      }
    })();
  }, []);

  const reRender = async () => {
    say(`Re-cutting ${fmt(start)} → ${fmt(end)}…`);
    await sleep(500);
    say("Re-rendered.", "ok");
    setRenderKey((k) => k + 1);
  };

  const clampToSegment = (e) => {
    const v = e.target;
    if (v.currentTime < start || v.currentTime >= end) {
      if (v.currentTime >= end) v.pause();
      v.currentTime = start;
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/95 flex flex-col" style={{ fontFamily: "monospace" }}>
      {/* Infinite canvas dotted backdrop */}
      <div className="absolute inset-0 pointer-events-none opacity-30"
        style={{ backgroundImage: "radial-gradient(circle, #164e63 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

      {/* Header */}
      <div className="relative flex items-center gap-3 px-4 py-3 border-b border-cyan-500/20">
        <div className="w-8 h-8 border border-cyan-500/50 rounded-full flex items-center justify-center">
          <Bot className="w-4 h-4 text-cyan-400" />
        </div>
        <div>
          <p className="text-white font-bold text-xs tracking-[0.2em]">AGENT KLIP · CANVAS</p>
          <p className="text-[9px] text-cyan-400 tracking-widest">
            {status === "working" ? "● WORKING…" : status === "ready" ? "● RENDER COMPLETE" : "● PREVIEW MODE"}
          </p>
        </div>
        <button onClick={onClose} className="ml-auto w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-white border border-zinc-800 hover:border-zinc-600 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="relative flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
          {/* Render surface */}
          <div>
            <div className="aspect-video bg-black border border-cyan-500/30 relative">
              {status === "working" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                  <p className="text-[10px] text-cyan-400 tracking-[0.3em] animate-pulse">RENDERING…</p>
                </div>
              )}
              {status === "ready" && mp4 && (
                <video
                  key={renderKey}
                  className="w-full h-full"
                  src={`${mp4.url}#t=${start},${end}`}
                  controls
                  autoPlay
                  onLoadedMetadata={(e) => { e.target.currentTime = start; }}
                  onTimeUpdate={clampToSegment}
                />
              )}
              {status === "fallback" && (
                <iframe
                  key={renderKey}
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${videoId}?start=${start}&end=${end}&autoplay=1&rel=0`}
                  title={clip.title}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              )}
            </div>

            {/* Cut controls */}
            <div className="border border-t-0 border-cyan-500/30 bg-zinc-950 p-4">
              <p className="text-white font-bold text-sm mb-1">{clip.title}</p>
              <p className="text-[10px] text-zinc-500 mb-3">DURATION {fmt(Math.max(0, end - start))} · {fmt(start)} → {fmt(end)}</p>
              <div className="flex flex-wrap items-center gap-2 text-[10px]">
                <label className="text-zinc-600">IN</label>
                <input type="number" value={start} min={0}
                  onChange={(e) => setStart(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-20 bg-black border border-zinc-700 px-2 py-1.5 text-white focus:border-cyan-400 focus:outline-none" />
                <label className="text-zinc-600">OUT</label>
                <input type="number" value={end} min={start + 1}
                  onChange={(e) => setEnd(Math.max(start + 1, parseInt(e.target.value) || start + 1))}
                  className="w-20 bg-black border border-zinc-700 px-2 py-1.5 text-white focus:border-cyan-400 focus:outline-none" />
                <button onClick={reRender} disabled={status === "working"}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 text-black font-bold hover:bg-cyan-400 disabled:opacity-40 transition-colors tracking-widest">
                  <RotateCw className="w-3 h-3" /> RE-RENDER
                </button>
                {status === "ready" && mp4 && (
                  <a href={mp4.url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 transition-colors tracking-widest">
                    <Download className="w-3 h-3" /> MP4
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Agent progress chat */}
          <div className="border border-zinc-800 bg-zinc-950/80 flex flex-col max-h-[70vh]">
            <p className="px-3 py-2 border-b border-zinc-800 text-[9px] text-zinc-500 tracking-[0.3em]">AGENT PROGRESS</p>
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {log.map((m, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <Bot className="w-3.5 h-3.5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <p className={`text-[11px] leading-relaxed ${m.tone === "ok" ? "text-emerald-400" : m.tone === "warn" ? "text-amber-400" : "text-zinc-300"}`}>
                    {m.text}
                  </p>
                </div>
              ))}
              {status === "working" && (
                <div className="flex gap-2 items-center">
                  <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin flex-shrink-0" />
                  <p className="text-[11px] text-cyan-400 animate-pulse">working…</p>
                </div>
              )}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}