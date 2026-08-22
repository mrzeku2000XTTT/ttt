import React, { useRef } from "react";
import { Clapperboard, Upload, Loader2 } from "lucide-react";

export default function RionInputForm({ prompt, setPrompt, onPhoto, photoUrl, onGenerate, running }) {
  const fileRef = useRef(null);
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-4">
      <div>
        <label className="text-white/60 text-xs font-bold uppercase tracking-widest">Your prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder="e.g. A tired founder keeps getting rejected until one night an investor finally says yes."
          className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50 resize-none"
        />
      </div>
      <div>
        <label className="text-white/60 text-xs font-bold uppercase tracking-widest">Character reference photo (optional)</label>
        <input ref={fileRef} type="file" accept="image/*" onChange={(e) => onPhoto(e.target.files?.[0])} className="hidden" />
        <button
          onClick={() => fileRef.current?.click()}
          className="mt-2 flex items-center gap-2 h-10 px-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white/80 hover:bg-white/10"
        >
          {photoUrl ? <img src={photoUrl} alt="ref" className="w-7 h-7 rounded-md object-cover" /> : <Upload className="w-4 h-4" />}
          {photoUrl ? "Reference set" : "Upload photo"}
        </button>
      </div>
      <button
        onClick={onGenerate}
        disabled={running || !prompt.trim()}
        className="w-full h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40"
      >
        {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clapperboard className="w-4 h-4" />}
        {running ? "Directing…" : "Generate Storyboard"}
      </button>
    </div>
  );
}