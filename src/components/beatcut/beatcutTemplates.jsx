export const TEMPLATES = [
  { id: "punchy", label: "Punchy", emoji: "⚡", vibe: "Hard cuts on every beat. Zooms. Flash transitions.", bpmRange: [110, 160], transition: "flash", grade: "vibrant", perClipMotion: ["zoom-in", "punch"], accent: "from-fuchsia-500 via-pink-500 to-orange-400" },
  { id: "cinematic", label: "Cinematic", emoji: "🎬", vibe: "Soft fades. Slow zooms. Letterbox bars.", bpmRange: [70, 100], transition: "fade", grade: "teal-orange", perClipMotion: ["slow-zoom", "drift"], letterbox: true, accent: "from-amber-500 via-orange-500 to-red-500" },
  { id: "vlog", label: "Vlog", emoji: "📷", vibe: "Natural pacing. Light tilts. Clean look.", bpmRange: [85, 120], transition: "slide", grade: "natural", perClipMotion: ["tilt", "pan"], accent: "from-cyan-400 via-blue-500 to-violet-500" },
  { id: "tiktok", label: "TikTok", emoji: "💥", vibe: "Beat drops. Shake on hits. Fast snaps.", bpmRange: [120, 170], transition: "shake", grade: "punchy", perClipMotion: ["shake", "snap-zoom"], accent: "from-pink-500 via-purple-500 to-indigo-500" },
  { id: "dreamy", label: "Dreamy", emoji: "✨", vibe: "Soft glow. Light leaks. Gentle drift.", bpmRange: [60, 90], transition: "fade", grade: "warm-glow", perClipMotion: ["drift", "float"], accent: "from-rose-300 via-pink-300 to-purple-300" },
  { id: "neon", label: "Neon", emoji: "🌃", vibe: "Glitch cuts. RGB split. Dark + saturated.", bpmRange: [100, 140], transition: "glitch", grade: "neon", perClipMotion: ["glitch", "zoom-in"], accent: "from-cyan-400 via-fuchsia-500 to-yellow-400" },
];

export const GRADE_FILTERS = {
  vibrant: "saturate(1.35) contrast(1.1) brightness(1.05)",
  "teal-orange": "saturate(1.2) contrast(1.15) hue-rotate(-8deg)",
  natural: "saturate(1.05) contrast(1.02)",
  punchy: "saturate(1.5) contrast(1.2)",
  "warm-glow": "saturate(1.1) brightness(1.08) sepia(0.15)",
  neon: "saturate(1.6) contrast(1.3) hue-rotate(8deg)",
};

export const ASPECTS = [
  { id: "9:16", label: "Reels", w: 1080, h: 1920 },
  { id: "1:1", label: "Square", w: 1080, h: 1080 },
  { id: "16:9", label: "Wide", w: 1920, h: 1080 },
];

export const getTemplate = (id) => TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
export const getAspect = (id) => ASPECTS.find((a) => a.id === id) || ASPECTS[0];