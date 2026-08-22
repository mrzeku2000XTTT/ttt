import React from "react";
import { Cloud } from "lucide-react";

export default function SkyChatBubble({ role, children }) {
  const isSky = role === "sky";
  return (
    <div className={`flex gap-2 ${isSky ? "" : "flex-row-reverse"}`}>
      {isSky && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Cloud className="w-4 h-4 text-black" />
        </div>
      )}
      <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${isSky ? "bg-white/[0.06] text-white border border-white/10 rounded-tl-sm" : "bg-cyan-500 text-black rounded-tr-sm font-medium"}`}>
        {children}
      </div>
    </div>
  );
}