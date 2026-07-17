import React from "react";
import { ShieldCheck, X } from "lucide-react";

export default function KlipzAdminReminder({ onClose }) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div
        className="relative w-full max-w-sm border border-cyan-500/40 bg-zinc-950 p-6 text-center"
        style={{ fontFamily: "monospace" }}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mx-auto w-12 h-12 rounded-full border border-cyan-500/50 flex items-center justify-center mb-4">
          <ShieldCheck className="w-6 h-6 text-cyan-400" />
        </div>

        <p className="text-[10px] tracking-[0.3em] text-cyan-400 mb-2">ADMIN ACCESS ONLY</p>
        <p className="text-white font-bold text-sm leading-relaxed mb-1">
          KLIPZ is currently in admin-only mode.
        </p>
        <p className="text-zinc-400 text-[11px] leading-relaxed mb-5">
          The AI clip engine is being calibrated. Once it's ready for everyone,
          you'll be able to scan and clip any video right here.
        </p>

        <button
          onClick={onClose}
          className="w-full px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black text-[11px] font-bold tracking-[0.15em] transition-colors"
        >
          GOT IT
        </button>
      </div>
    </div>
  );
}