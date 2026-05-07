import React, { useState } from "react";
import { Sparkles, Wand2, Box, ImageIcon, Loader2, Eraser, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * Advanced text styling: AI image-fill (text filled with any picture),
 * one-click 3D-deep preset, and per-letter customization (color, size, rotation).
 *
 * Mutates the selected text item via `onUpdate(partial)`.
 */
export default function TextStylePanel({ selected, onUpdate }) {
  const [imagePrompt, setImagePrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [activeLetter, setActiveLetter] = useState(null); // index of letter being edited

  if (!selected || selected.kind !== "text") return null;

  const text = selected.text || "";
  // Letters array — one entry per character. Build/extend as needed when text changes.
  const letters = Array.isArray(selected.letters) ? selected.letters : [];

  const ensureLetterAt = (idx) => {
    const next = [...letters];
    while (next.length <= idx) next.push({});
    return next;
  };

  const updateLetter = (idx, partial) => {
    const next = ensureLetterAt(idx);
    next[idx] = { ...next[idx], ...partial };
    onUpdate({ letters: next });
  };

  const clearLetter = (idx) => {
    const next = [...letters];
    if (idx < next.length) next[idx] = {};
    onUpdate({ letters: next });
  };

  const clearAllLetters = () => onUpdate({ letters: [] });

  const make3DDeep = () => {
    onUpdate({
      animation: "3d",
      depth: 22,
      tilt: 18,
      fontWeight: 900,
    });
  };

  const generateImageFill = async () => {
    if (!imagePrompt.trim()) return;
    setGenerating(true);
    setError("");
    try {
      const fullPrompt = `Bold high-contrast texture/pattern image suitable for being clipped INSIDE big chunky letters as a fill. ${imagePrompt}. Vibrant colors, sharp details, fills the whole frame edge-to-edge, no text, no logos.`;
      const res = await base44.integrations.Core.GenerateImage({ prompt: fullPrompt });
      const url = res?.url;
      if (!url) throw new Error("No image returned");
      onUpdate({ imageFillUrl: url, color: "transparent" });
    } catch (e) {
      setError(e.message || "Generation failed");
    }
    setGenerating(false);
  };

  const clearImageFill = () => {
    onUpdate({ imageFillUrl: null, color: selected.color === "transparent" ? "#ffffff" : selected.color });
  };

  return (
    <div className="space-y-4 pt-3 mt-3 border-t border-white/10">
      {/* 3D Depth one-click */}
      <Section title="3D Depth (one-click)">
        <button
          onClick={make3DDeep}
          className="w-full flex items-center justify-center gap-2 h-10 rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 hover:opacity-90 text-white text-xs font-black shadow-lg shadow-orange-500/30"
        >
          <Box className="w-4 h-4" /> Make Text Deep 3D
        </button>
        <p className="text-[10px] text-white/40 mt-1.5">Switches to 3D extrude with chunky depth + tilt.</p>
      </Section>

      {/* AI image fill */}
      <Section title="AI Image Fill (texture inside letters)">
        {selected.imageFillUrl ? (
          <div className="space-y-2">
            <div
              className="w-full h-16 rounded-lg ring-1 ring-white/15 bg-cover bg-center"
              style={{ backgroundImage: `url("${selected.imageFillUrl}")` }}
            />
            <button
              onClick={clearImageFill}
              className="w-full flex items-center justify-center gap-1.5 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-[10px] font-bold"
            >
              <Eraser className="w-3 h-3" /> Remove fill
            </button>
          </div>
        ) : (
          <>
            <textarea
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              rows={2}
              placeholder="e.g. fire flames, galaxy nebula, cherry blossoms, leopard fur, neon city…"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 focus:border-fuchsia-400 rounded-lg text-white text-xs outline-none resize-none"
            />
            <button
              onClick={generateImageFill}
              disabled={generating || !imagePrompt.trim()}
              className="mt-2 w-full flex items-center justify-center gap-2 h-9 rounded-lg bg-gradient-to-r from-fuchsia-500 to-cyan-400 hover:opacity-90 disabled:opacity-40 text-white text-xs font-black"
            >
              {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
              {generating ? "Generating…" : "Fill letters with AI image"}
            </button>
            {error && <p className="text-[10px] text-red-400 mt-1.5">{error}</p>}
          </>
        )}
      </Section>

      {/* Per-letter customization */}
      <Section title="Per-Letter Customize">
        {text.length === 0 ? (
          <p className="text-[10px] text-white/40">Type some text first.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-1 mb-2">
              {text.split("").map((ch, i) => {
                const L = letters[i] || {};
                const isActive = activeLetter === i;
                const customized = !!(L.color || L.fontSize || L.rotation);
                return (
                  <button
                    key={i}
                    onClick={() => setActiveLetter(isActive ? null : i)}
                    className={`relative min-w-[28px] h-9 px-1.5 rounded-md text-sm font-black transition-all ${
                      isActive
                        ? "bg-cyan-400 text-black scale-110 shadow-lg shadow-cyan-500/30"
                        : customized
                          ? "bg-fuchsia-500/30 text-white border border-fuchsia-400/60"
                          : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
                    }`}
                    style={ch === " " ? { minWidth: 16 } : undefined}
                    title={ch === " " ? "(space)" : `Edit "${ch}"`}
                  >
                    {ch === " " ? "·" : ch}
                  </button>
                );
              })}
            </div>

            {activeLetter !== null && text[activeLetter] && (
              <div className="rounded-lg bg-white/5 border border-white/10 p-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-black text-cyan-300 uppercase tracking-wider">
                    Letter "{text[activeLetter] === " " ? "(space)" : text[activeLetter]}" · pos {activeLetter + 1}
                  </div>
                  <button
                    onClick={() => clearLetter(activeLetter)}
                    className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/10 text-white/50"
                    title="Reset letter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                <div>
                  <div className="text-[9px] uppercase tracking-wider text-white/40 mb-1">Color</div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {["#ffffff", "#fbbf24", "#f472b6", "#22d3ee", "#a78bfa", "#34d399", "#fb923c", "#ef4444"].map((c) => (
                      <button
                        key={c}
                        onClick={() => updateLetter(activeLetter, { color: c })}
                        className={`w-6 h-6 rounded-full transition-all ${
                          (letters[activeLetter]?.color === c) ? "ring-2 ring-white scale-110" : "ring-1 ring-white/20"
                        }`}
                        style={{ background: c }}
                      />
                    ))}
                    <input
                      type="color"
                      value={letters[activeLetter]?.color || "#ffffff"}
                      onChange={(e) => updateLetter(activeLetter, { color: e.target.value })}
                      className="w-6 h-6 rounded cursor-pointer bg-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="text-[9px] text-white/50">
                    Size scale
                    <input
                      type="range" min="0.5" max="2.5" step="0.1"
                      value={letters[activeLetter]?.scale ?? 1}
                      onChange={(e) => updateLetter(activeLetter, { scale: Number(e.target.value) })}
                      className="w-full accent-cyan-400"
                    />
                    <div className="text-[9px] text-white/40 text-center">{(letters[activeLetter]?.scale ?? 1).toFixed(1)}×</div>
                  </label>
                  <label className="text-[9px] text-white/50">
                    Rotation
                    <input
                      type="range" min="-45" max="45" step="1"
                      value={letters[activeLetter]?.rotation ?? 0}
                      onChange={(e) => updateLetter(activeLetter, { rotation: Number(e.target.value) })}
                      className="w-full accent-cyan-400"
                    />
                    <div className="text-[9px] text-white/40 text-center">{letters[activeLetter]?.rotation ?? 0}°</div>
                  </label>
                </div>
              </div>
            )}

            {letters.some((l) => l && Object.keys(l).length > 0) && (
              <button
                onClick={clearAllLetters}
                className="mt-2 w-full flex items-center justify-center gap-1.5 h-7 rounded-md bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 text-[10px] font-bold"
              >
                <Eraser className="w-3 h-3" /> Reset all letters
              </button>
            )}

            <p className="text-[10px] text-white/40 mt-2 leading-relaxed">
              <Sparkles className="w-2.5 h-2.5 inline-block mr-1 text-fuchsia-300" />
              Tap any letter to give it its own color, size, or rotation.
            </p>
          </>
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <div className="text-[10px] font-black tracking-[0.2em] uppercase text-white/40 mb-2">{title}</div>
      {children}
    </div>
  );
}