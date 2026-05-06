import React, { useRef, useState } from "react";
import { Music, X, Loader2, Play, Pause } from "lucide-react";
import { motion } from "framer-motion";

export default function MusicPicker({ track, onSet, onClear, analyzing, beatsData }) {
  const inputRef = useRef(null);
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      alert("Please pick an audio file (mp3, m4a, wav…)");
      return;
    }
    onSet({ url: URL.createObjectURL(file), name: file.name, file });
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-white/60">Music</div>
        {beatsData && <div className="text-[10px] text-fuchsia-300 font-mono font-bold">{beatsData.bpm} BPM · {beatsData.beats.length} beats</div>}
      </div>
      <input ref={inputRef} type="file" accept="audio/*" className="hidden" onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }} />
      {!track ? (
        <button onClick={() => inputRef.current?.click()} className="w-full h-16 rounded-xl border-2 border-dashed border-white/15 hover:border-fuchsia-400/60 hover:bg-fuchsia-400/5 transition-colors flex items-center justify-center gap-2 text-white/50 hover:text-fuchsia-300">
          <Music className="w-4 h-4" />
          <span className="text-[12px] font-bold">Tap to add a beat</span>
        </button>
      ) : (
        <div className="rounded-xl bg-gradient-to-r from-fuchsia-500/15 via-purple-500/15 to-cyan-500/15 ring-1 ring-fuchsia-400/30 p-3 flex items-center gap-3">
          <button onClick={togglePlay} disabled={analyzing} className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg disabled:opacity-50">
            {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-bold text-white truncate">{track.name}</div>
            <div className="text-[10px] text-white/60 mt-0.5">{analyzing ? "Detecting beats…" : beatsData ? `Ready · ${beatsData.duration.toFixed(1)}s` : "Loading…"}</div>
            {beatsData && (
              <div className="mt-1.5 h-1 rounded-full bg-white/10 relative overflow-hidden">
                {beatsData.beats.slice(0, 80).map((b, i) => (
                  <motion.div key={i} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: i * 0.01 }} className="absolute top-0 bottom-0 w-px bg-fuchsia-400" style={{ left: `${(b / beatsData.duration) * 100}%` }} />
                ))}
              </div>
            )}
          </div>
          <audio ref={audioRef} src={track.url} onEnded={() => setPlaying(false)} />
          <button onClick={onClear} className="w-7 h-7 rounded-full bg-white/10 hover:bg-red-500 text-white/70 hover:text-white flex items-center justify-center">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}