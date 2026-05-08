import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const SUGGESTIONS = [
  { emoji: "🌆", label: "Cyberpunk", prompt: "A neon cyberpunk fox running through rain-soaked Tokyo streets at night, cinematic wide shot, electric purple and pink lighting" },
  { emoji: "🌊", label: "Cinematic", prompt: "A massive ocean wave breaking in slow motion at golden hour, hyper-realistic, cinematic, drone shot" },
  { emoji: "🚀", label: "Sci-Fi", prompt: "A sleek spacecraft launching from a futuristic city at dawn, volumetric clouds, cinematic wide angle" },
  { emoji: "🎨", label: "Artistic", prompt: "Liquid gold flowing and morphing into geometric shapes, abstract studio lighting, ultra-glossy, macro shot" },
  { emoji: "🐉", label: "Fantasy", prompt: "A glowing dragon flying over misty mountains at sunrise, epic cinematic shot, fog and god rays" },
  { emoji: "🏎️", label: "Action", prompt: "A bright red sports car drifting through a desert canyon road at sunset, dust trails, cinematic wide angle" },
];

export default function KineSuggestions({ onPick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.3em] uppercase text-white/40">
          <Sparkles className="w-3 h-3" /> Try one of these
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {SUGGESTIONS.map((s, i) => (
          <motion.button
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 + i * 0.05 }}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onPick(s.prompt)}
            className="group relative p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-fuchsia-400/40 text-left transition-colors overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xl">{s.emoji}</span>
              <span className="text-[11px] font-bold text-white tracking-wide">{s.label}</span>
            </div>
            <p className="text-[10px] text-white/50 line-clamp-2 leading-relaxed">{s.prompt}</p>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-fuchsia-500/0 via-fuchsia-500/0 to-fuchsia-500/0 group-hover:from-fuchsia-500/10 group-hover:to-cyan-500/10 transition-colors" />
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}