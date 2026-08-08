import React, { useState } from "react";
import { Code2, X, Wand2 } from "lucide-react";

export default function PasteHtmlButton({ onConvert, disabled }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");

  const submit = () => {
    if (!code.trim()) return;
    onConvert(code);
    setCode("");
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#AF52DE]/10 border border-[#AF52DE]/30 text-[#AF52DE] text-xs font-bold hover:bg-[#AF52DE]/20 disabled:opacity-40 transition-colors"
        title="Paste HTML and convert it into a full React app"
      >
        <Code2 className="w-3.5 h-3.5" />
        Paste HTML → React
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/30 backdrop-blur-sm px-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="bg-white border border-black/[0.08] rounded-2xl w-full max-w-2xl p-5 shadow-[0_24px_80px_rgba(0,0,0,0.2)]">
            <div className="flex items-center gap-2 mb-3">
              <Code2 className="w-4 h-4 text-[#AF52DE]" />
              <h3 className="font-bold text-sm text-[#1D1D1F]">Paste HTML → full React app</h3>
              <button onClick={() => setOpen(false)} className="ml-auto text-[#86868B] hover:text-[#1D1D1F]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-[#86868B] mb-3">
              Paste any HTML (a landing page, a template, an exported design). TTT Agent 1 will rebuild it as a real
              React + Vite project — split into components, with routing, live data and the Kaspa wallet wired in.
            </p>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="<!DOCTYPE html> …"
              className="w-full h-64 bg-[#F5F5F7] border border-black/[0.08] rounded-xl p-3 text-[11px] font-mono text-[#1D1D1F] outline-none focus:border-[#AF52DE]/50 focus:bg-white resize-none transition-colors"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 h-10 rounded-xl bg-[#F0F0F2] text-[#6B7280] hover:text-[#1D1D1F] text-sm font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={!code.trim()}
                className="flex-1 h-10 rounded-xl bg-[#AF52DE] text-white text-sm font-bold hover:bg-[#9B30D5] disabled:opacity-40 flex items-center justify-center gap-2 transition-colors"
              >
                <Wand2 className="w-4 h-4" /> Convert to React app
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}