import React, { useEffect, useState } from "react";

// Chinese characters representing app store / decentralization themes
const CHARS = [
  "应", "用", "店", "去", "中", "心", "化", "卡", "斯", "帕",
  "区", "块", "链", "数", "据", "签", "名", "投", "票", "信",
  "任", "网", "络", "未", "来", "代", "码", "自", "由", "真",
  "实", "永", "恒", "幻", "影", "源", "起", "始", "光", "影",
];

const ENGLISH_GLITCH = ["DECENTRALIZED", "VERIFIED", "ON-CHAIN", "TRUST", "KASPA", "FUTURE"];

function GlitchLine({ delay = 0, top, left, size = "text-2xl", color = "text-cyan-400/60" }) {
  const [char, setChar] = useState(CHARS[0]);
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        setChar(CHARS[Math.floor(Math.random() * CHARS.length)]);
        setGlitch(true);
        setTimeout(() => setGlitch(false), 80);
      }, 200 + Math.random() * 600);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  return (
    <div
      className={`absolute font-bold ${size} ${color} transition-all pointer-events-none select-none`}
      style={{
        top,
        left,
        textShadow: glitch
          ? "2px 0 #ff00ff, -2px 0 #00ffff, 0 0 12px rgba(34, 211, 238, 0.8)"
          : "0 0 8px rgba(34, 211, 238, 0.4)",
        transform: glitch ? `translate(${(Math.random() - 0.5) * 4}px, ${(Math.random() - 0.5) * 4}px)` : "none",
        filter: glitch ? "blur(0.5px)" : "none",
        opacity: glitch ? 1 : 0.7,
      }}
    >
      {char}
    </div>
  );
}

function ScrollingTicker() {
  const [text, setText] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      const word = ENGLISH_GLITCH[Math.floor(Math.random() * ENGLISH_GLITCH.length)];
      const scrambled = word
        .split("")
        .map(c => Math.random() > 0.7 ? CHARS[Math.floor(Math.random() * CHARS.length)] : c)
        .join("");
      setText(scrambled);
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur rounded-md border border-cyan-500/30 pointer-events-none">
      <span className="text-cyan-300 text-[9px] font-mono tracking-widest opacity-70">
        {text || "LOADING..."}
      </span>
    </div>
  );
}

export default function GlitchChinese() {
  // Position glyphs scattered across the hero
  const glyphs = [
    { top: "12%", left: "8%", size: "text-3xl", color: "text-cyan-300/50", delay: 0 },
    { top: "25%", left: "85%", size: "text-2xl", color: "text-purple-300/40", delay: 200 },
    { top: "55%", left: "15%", size: "text-4xl", color: "text-cyan-400/50", delay: 400 },
    { top: "70%", left: "78%", size: "text-2xl", color: "text-pink-300/40", delay: 100 },
    { top: "40%", left: "92%", size: "text-xl", color: "text-cyan-200/40", delay: 600 },
    { top: "8%", left: "55%", size: "text-2xl", color: "text-emerald-300/40", delay: 300 },
    { top: "85%", left: "45%", size: "text-3xl", color: "text-cyan-400/40", delay: 500 },
    { top: "30%", left: "30%", size: "text-xl", color: "text-purple-200/30", delay: 800 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {glyphs.map((g, i) => (
        <GlitchLine key={i} {...g} />
      ))}
      <ScrollingTicker />

      {/* Scan lines */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, #fff 2px, #fff 3px)",
        }}
      />
    </div>
  );
}