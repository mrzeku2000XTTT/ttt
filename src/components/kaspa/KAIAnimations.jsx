import React, { useState, useEffect } from "react";
import { KAI_THINKING_PHRASES } from "./kaiConstants";

export function KAIBlocksAnimation() {
  return (
    <div className="flex items-end gap-[3px] h-[14px] flex-shrink-0">
      {[0, 1, 2, 3, 4].map(i => (
        <div
          key={i}
          className="w-[3px] rounded-sm"
          style={{
            background: `linear-gradient(to top, rgba(6,182,212,0.9), rgba(139,92,246,0.9))`,
            animation: `kai-blocks 1.2s ease-in-out ${i * 0.15}s infinite`,
          }}
        />
      ))}
      <style>{`@keyframes kai-blocks { 0%,100% { height: 4px; opacity: 0.4; } 50% { height: 14px; opacity: 1; } }`}</style>
    </div>
  );
}

export function KAIThinkingBubble() {
  const [phrase, setPhrase] = useState(() => KAI_THINKING_PHRASES[Math.floor(Math.random() * KAI_THINKING_PHRASES.length)]);
  useEffect(() => {
    const interval = setInterval(() => {
      setPhrase(KAI_THINKING_PHRASES[Math.floor(Math.random() * KAI_THINKING_PHRASES.length)]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="flex justify-start">
      <div className="px-3 py-2 rounded-2xl rounded-bl-md flex items-center gap-2 text-[12px]"
        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(6,182,212,0.8)" }}>
        <KAIBlocksAnimation />
        <span className="italic">{phrase}</span>
      </div>
    </div>
  );
}