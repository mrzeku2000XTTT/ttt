import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { X, Upload, Sparkles, Copy, Check, ImageIcon } from "lucide-react";

const PRESETS = [
  "Teen hangout room",
  "Man cave",
  "Minimalist office",
  "Cottagecore bedroom",
  "Kids' playroom",
  "Industrial loft",
  "Scandinavian living room",
  "Home gym",
];

// Hexagon-with-star logo mark (white line art on black).
function SpatialMark({ size = 46 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinejoin="round">
      {/* pointy-top hexagon */}
      <polygon points="50,6 88,28 88,72 50,94 12,72 12,28" />
      {/* lines from each vertex to center */}
      <line x1="50" y1="6" x2="50" y2="50" />
      <line x1="88" y1="28" x2="50" y2="50" />
      <line x1="88" y1="72" x2="50" y2="50" />
      <line x1="50" y1="94" x2="50" y2="50" />
      <line x1="12" y1="72" x2="50" y2="50" />
      <line x1="12" y1="28" x2="50" y2="50" />
      {/* four-pointed star at center */}
      <path d="M50 34 L56 50 L50 66 L44 50 Z" fill="#fff" stroke="#fff" />
    </svg>
  );
}

export default function Spatial() {
  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileObj, setFileObj] = useState(null);
  const [transform, setTransform] = useState("");
  const [keepLayout, setKeepLayout] = useState(true);
  const [includeNegative, setIncludeNegative] = useState(true);
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);

  const onFile = (f) => {
    if (!f) return;
    setFileObj(f);
    setPreviewUrl(URL.createObjectURL(f));
    setError(null);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  };

  const removeImage = () => {
    setFileObj(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const buildPrompt = (transformText, keep, neg) => {
    return `You are an expert prompt engineer for AI image generators (Midjourney, Stable Diffusion, DALL·E-style tools). Given a photo of a real room and a requested transformation, you write a single, highly detailed, ready-to-paste image generation prompt.

Rules:
- First, closely observe the photo: room shape, wall/window/door positions, ceiling height, camera angle and lens height, existing light sources, floor material, and any fixed architectural features.
- Build a prompt that keeps those fixed elements ${keep ? "exact and unchanged" : "as loose reference only"}, and applies the requested transformation to furniture, decor, color palette, materials, and mood.
- Be concrete: name specific furniture pieces, materials, colors (with hex or descriptive names), lighting, textures. Avoid vague words like "nice" or "beautiful."
- Write it so it produces consistent results if reused verbatim across multiple generations (fixed camera angle, fixed lighting description, fixed composition language).
- Output using exactly these plain-text section headers, nothing before or after them:

PRESERVE:
(2-4 sentences describing the fixed room geometry/camera angle/architecture to hold constant — usable directly as edit instructions for image-editing models)

PROMPT:
(the full, detailed scene prompt, 80-150 words, ready to paste into a text-to-image generator)
${neg ? `
NEGATIVE PROMPT:
(comma-separated list of things to avoid — distortions, unwanted style drift, changed architecture, etc.)` : ""}

NOTES:
(1-2 sentences on how to keep results consistent across regenerations — e.g. reuse this exact prompt, fix a seed if the tool supports it, or use image-editing mode instead of text-to-image if available)

Do not include any preamble, explanation, or markdown formatting outside these sections.

Requested transformation: ${transformText}`;
  };

  const generate = async () => {
    if (!fileObj) { setError("Upload a room photo first."); return; }
    if (!transform.trim()) { setError("Describe what you want the room to become."); return; }
    setLoading(true);
    setError(null);
    setOutput(null);
    try {
      const up = await base44.integrations.Core.UploadFile({ file: fileObj });
      const fileUrl = up?.file_url || up?.url;
      if (!fileUrl) throw new Error("Upload failed.");
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: buildPrompt(transform.trim(), keepLayout, includeNegative),
        file_urls: [fileUrl],
        model: "claude_sonnet_4_6",
      });
      const text = typeof res === "string" ? res : (res?.text || res?.response || JSON.stringify(res));
      if (!text || !text.trim()) throw new Error("No prompt was returned.");
      setOutput(text.trim());
    } catch (err) {
      setError(err?.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  const renderOutput = () => {
    if (!output) return null;
    const parts = output.split(/^(PRESERVE:|PROMPT:|NEGATIVE PROMPT:|NOTES:)/m).filter(Boolean);
    return parts.map((chunk, i) => {
      const isHeader = /^(PRESERVE:|PROMPT:|NEGATIVE PROMPT:|NOTES:)$/.test(chunk);
      if (isHeader) {
        const body = parts[i + 1]?.trim() || "";
        return (
          <div key={i} className="mb-3 last:mb-0">
            <div className="text-[11px] tracking-[0.18em] text-white/45 mb-1">{chunk.replace(":", "")}</div>
            <div className="text-[13.5px] leading-[1.65] text-white/90 whitespace-pre-wrap">{body}</div>
          </div>
        );
      }
      return null;
    });
  };

  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: "'Inter', -apple-system, system-ui, sans-serif" }}>
      {/* Exit top-right */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}>
        <div className="flex items-center gap-2">
          <SpatialMark size={26} />
          <span className="text-[13px] tracking-[0.3em] text-white/70">SPATIAL</span>
        </div>
        <Link to="/AppStoreV2" className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" title="Exit to App Store">
          <X className="w-4 h-4" />
        </Link>
      </div>

      <div className="max-w-[560px] mx-auto px-5 pt-20 pb-24">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center mb-9">
          <SpatialMark size={62} />
          <h1 className="mt-4 text-[34px] leading-[1.05] tracking-[-0.01em]" style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 }}>SPATIAL AI</h1>
          <div className="mt-1.5 text-[11px] tracking-[0.42em] text-white/55">ROOM TRANSFORM</div>
          <p className="mt-5 text-[14px] leading-[1.55] text-white/60 max-w-[44ch]">
            Upload a photo of a room and describe what you want it to become. Spatial builds a detailed, consistent prompt — ready to paste into your own image generator.
          </p>
        </div>

        {/* Step 1 — photo */}
        <section className="mb-7">
          <div className="text-[11px] tracking-[0.2em] text-white/45 mb-2.5">1 · ROOM PHOTO</div>
          {!previewUrl ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`rounded-lg border border-dashed cursor-pointer transition-colors py-9 px-5 text-center ${dragging ? "border-white/70 bg-white/10" : "border-white/25 hover:border-white/50 hover:bg-white/[0.04]"}`}
            >
              <div className="w-11 h-11 mx-auto mb-3 rounded-full border border-white/40 flex items-center justify-center">
                <Upload className="w-4 h-4 text-white/80" />
              </div>
              <div className="text-[13px] text-white/80"><span className="text-white font-medium">Tap to upload</span> or drop a photo</div>
              <div className="text-[11px] text-white/40 mt-1">PNG · JPG — stays on device until you generate</div>
            </div>
          ) : (
            <div className="relative rounded-lg overflow-hidden border border-white/15">
              <img src={previewUrl} alt="room" className="block w-full max-h-[300px] object-cover" />
              <button onClick={removeImage} className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/70 backdrop-blur flex items-center justify-center hover:bg-black/90 transition-colors" title="Remove">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        </section>

        {/* Step 2 — transform */}
        <section className="mb-6">
          <div className="text-[11px] tracking-[0.2em] text-white/45 mb-2.5">2 · WHAT SHOULD IT BECOME?</div>
          <textarea
            value={transform}
            onChange={(e) => setTransform(e.target.value)}
            placeholder="e.g. turn this into a cozy reading nook with warm wood tones and a window seat"
            className="w-full text-[14px] leading-[1.5] bg-white/[0.04] border border-white/15 rounded-lg px-3.5 py-3 text-white placeholder-white/35 outline-none focus:border-white/40 focus:bg-white/[0.06] transition-colors resize-y min-h-[64px]"
          />
          <div className="flex flex-wrap gap-2 mt-3">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setTransform(`turn this into a ${p.toLowerCase()}`)}
                className="text-[12px] px-3 py-1.5 rounded-full border border-white/20 text-white/75 hover:bg-white hover:text-black hover:border-white transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        </section>

        {/* Toggles */}
        <section className="mb-6 space-y-3">
          <label className="flex items-center gap-2.5 cursor-pointer text-[13px] text-white/70">
            <input type="checkbox" checked={keepLayout} onChange={(e) => setKeepLayout(e.target.checked)} className="w-4 h-4 accent-white" />
            Keep layout &amp; camera angle exact
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer text-[13px] text-white/70">
            <input type="checkbox" checked={includeNegative} onChange={(e) => setIncludeNegative(e.target.checked)} className="w-4 h-4 accent-white" />
            Include a negative prompt
          </label>
        </section>

        <button
          onClick={generate}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 text-[15px] font-medium py-3.5 rounded-lg bg-white text-black hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          style={{ fontFamily: "'Fraunces', Georgia, serif" }}
        >
          {loading ? (<><Sparkles className="w-4 h-4 animate-pulse" /> Building…</>) : (<><Sparkles className="w-4 h-4" /> Build the prompt</>)}
        </button>

        {/* Output */}
        {error && (
          <div className="mt-6 text-[13px] text-red-300 border border-red-400/30 rounded-lg px-3.5 py-3 bg-red-400/10">{error}</div>
        )}
        {output && (
          <section className="mt-7">
            <div className="rounded-lg border border-white/15 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[11px] tracking-[0.2em] text-white/45">YOUR PROMPT</div>
                <button onClick={copy} className="flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-md border border-white/20 text-white/80 hover:bg-white hover:text-black transition-colors">
                  {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                </button>
              </div>
              {renderOutput()}
            </div>
          </section>
        )}

        <div className="mt-7 pt-5 border-t border-white/10 text-[12px] leading-[1.6] text-white/40">
          Spatial analyzes your photo and writes a prompt in your generator's language — it doesn't generate the image itself. Copy the result into Midjourney, DALL·E, Stable Diffusion, or whichever tool you use. For image-editing models, use the PRESERVE section as your edit instructions.
        </div>
      </div>
    </div>
  );
}