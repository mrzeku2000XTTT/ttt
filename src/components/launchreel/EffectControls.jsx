import React from "react";
import { Music, ZoomIn, Sparkles, Rotate3D } from "lucide-react";

const MUSIC_PRESETS = [
  { id: "none", name: "Silent", url: null },
  { id: "uplift", name: "Uplifting", url: "https://cdn.pixabay.com/audio/2022/10/30/audio_347111e9a1.mp3" },
  { id: "tech", name: "Tech Pulse", url: "https://cdn.pixabay.com/audio/2024/02/18/audio_6f8a9a3d1a.mp3" },
  { id: "calm", name: "Calm Ambient", url: "https://cdn.pixabay.com/audio/2022/03/15/audio_8e8e9e8e8e.mp3" },
];

const TRANSITIONS = [
  { id: "fade", name: "Fade" },
  { id: "zoom", name: "Zoom Punch" },
  { id: "glitch", name: "Glitch" },
  { id: "slide", name: "Slide" },
];

export default function EffectControls({
  autoRotate, setAutoRotate,
  zoom, setZoom,
  music, setMusic,
  transition, setTransition,
  brandColor, setBrandColor,
}) {
  return (
    <div className="space-y-5">
      {/* Auto-rotate */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Rotate3D className="w-4 h-4 text-purple-400" />
          <span className="text-white font-semibold text-sm">Auto-Rotate Phone</span>
        </div>
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`relative w-11 h-6 rounded-full transition-colors ${autoRotate ? "bg-cyan-500" : "bg-white/10"}`}
        >
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${autoRotate ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
      </div>

      {/* Zoom slider */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <ZoomIn className="w-4 h-4 text-cyan-400" />
          <span className="text-white font-semibold text-sm">Zoom</span>
          <span className="ml-auto text-white/40 text-xs">{zoom}%</span>
        </div>
        <input
          type="range"
          min={40}
          max={160}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-full accent-cyan-500"
        />
      </div>

      {/* Music */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Music className="w-4 h-4 text-emerald-400" />
          <span className="text-white font-semibold text-sm">Background Music</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {MUSIC_PRESETS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMusic(m)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                music?.id === m.id
                  ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                  : "bg-white/5 border border-white/10 text-white/50 hover:bg-white/10"
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>
      </div>

      {/* Transitions */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-yellow-400" />
          <span className="text-white font-semibold text-sm">Transition Style</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {TRANSITIONS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTransition(t.id)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                transition === t.id
                  ? "bg-yellow-500/20 border border-yellow-500/40 text-yellow-300"
                  : "bg-white/5 border border-white/10 text-white/50 hover:bg-white/10"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Brand color */}
      <div>
        <span className="text-white font-semibold text-sm mb-2 block">Brand Color</span>
        <div className="flex gap-2">
          {["#00e6a8", "#a855f7", "#3b82f6", "#f97316", "#ec4899", "#ffffff"].map((c) => (
            <button
              key={c}
              onClick={() => setBrandColor(c)}
              className={`w-8 h-8 rounded-full border-2 transition-all ${brandColor === c ? "border-white scale-110" : "border-white/20"}`}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}