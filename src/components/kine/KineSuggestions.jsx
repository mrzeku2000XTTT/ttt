import React from "react";
import { motion } from "framer-motion";

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
      <div className="text-center mb-5">
        <span className="text-[10px] font-semibold tracking-[0.25em] uppercase text-zinc-400">
          Try one of these
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {SUGGESTIONS.map((s, i) => (
          <motion.button
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 + i * 0.04 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onPick(s.prompt)}
            className="group relative p-3.5 rounded-2xl bg-white hover:bg-white border border-zinc-200/70 hover:border-zinc-300 text-left transition-all shadow-sm hover:shadow-md hover:shadow-zinc-900/5"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xl">{s.emoji}</span>
              <span className="text-[12px] font-semibold text-zinc-900 tracking-tight">{s.label}</span>
            </div>
            <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">{s.prompt}</p>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}