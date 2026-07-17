import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function SlobzNav({ backTo = "/Slobz", backLabel = "Slobz Home" }) {
  return (
    <div className="flex items-center justify-between py-5">
      <div className="flex items-center gap-4">
        <Link
          to={backTo}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#FDFBF7] hover:bg-white text-[#7C5CFC] text-xs font-display font-extrabold shadow-[0_6px_16px_rgba(124,92,252,0.2)] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> {backLabel}
        </Link>
        <Link to="/Slobz" className="font-display text-2xl font-black text-[#3D2E7C]">Slobz</Link>
      </div>
      <div className="hidden md:flex items-center gap-2 text-sm text-[#5A4B8A]">
        <Sparkles className="w-4 h-4 text-[#7C5CFC]" />
        <span>Sector 6 · SLOBZ</span>
      </div>
    </div>
  );
}