import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Loader2, X } from "lucide-react";

// Curated web-safe + Apple font stack the AI can choose from.
export const FONTS = [
  { value: '-apple-system, "SF Pro Display", "SF Pro Text", system-ui, sans-serif', label: "SF Pro" },
  { value: '"Helvetica Neue", Helvetica, Arial, sans-serif', label: "Helvetica" },
  { value: "Georgia, \"Times New Roman\", serif", label: "Georgia" },
  { value: '"Times New Roman", Times, serif', label: "Times" },
  { value: '"Courier New", Courier, monospace', label: "Courier" },
  { value: 'Impact, "Arial Black", sans-serif', label: "Impact" },
  { value: '"Arial Black", Arial, sans-serif', label: "Arial Black" },
  { value: "Verdana, Geneva, sans-serif", label: "Verdana" },
  { value: '"Trebuchet MS", sans-serif', label: "Trebuchet" },
  { value: '"Brush Script MT", cursive', label: "Brush Script" },
];

export default function TypographyAgent({ editor }) {
  const { selectedObject, addObject, updateBase } = editor;
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);
  const [err, setErr] = useState(null);
  const fileRef = useRef(null);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setPreview(URL.createObjectURL(f));
    setErr(null);
  };

  const analyze = async () => {
    if (!preview) return;
    setBusy(true);
    setErr(null);
    try {
      // Make sure there's a text object to style. If the current selection
      // isn't text, create one and style that.
      let id, baseFontSize = null;
      if (selectedObject && selectedObject.type === "text") {
        id = selectedObject.id;
        baseFontSize = selectedObject.base.fontSize;
      } else {
        id = addObject("text");
      }

      const blob = await (await fetch(preview)).blob();
      const file = new File([blob], "typography.png", { type: blob.type || "image/png" });
      const up = await base44.integrations.Core.UploadFile({ file });
      const fileUrl = up?.file_url || up?.url;

      const res = await base44.integrations.Core.InvokeLLM({
        prompt:
          "You are a typography expert. Analyze the typography / lettering in the attached image and return CSS-equivalent styling that best reproduces its look. " +
          `Choose fontFamily from exactly this list: ${FONTS.map((f) => JSON.stringify(f.value)).join(", ")}. ` +
          "fontWeight is a number 100-900. fontStyle is normal or italic. letterSpacing is a CSS string like \"-0.02em\" or \"0.05em\". lineHeight is a unitless number. color is a hex string. textTransform is one of none|uppercase|lowercase|capitalize. fontSizeScale is a multiplier 0.5-2 for how large the lettering feels (1 = normal).",
        file_urls: [fileUrl],
        response_json_schema: {
          type: "object",
          properties: {
            fontFamily: { type: "string" },
            fontWeight: { type: "number" },
            fontStyle: { type: "string", enum: ["normal", "italic"] },
            letterSpacing: { type: "string" },
            lineHeight: { type: "number" },
            color: { type: "string" },
            textTransform: { type: "string", enum: ["none", "uppercase", "lowercase", "capitalize"] },
            fontSizeScale: { type: "number" },
          },
        },
      });

      const s = res || {};
      const patch = {
        fontFamily: s.fontFamily || FONTS[0].value,
        fontWeight: s.fontWeight || 700,
        fontStyle: s.fontStyle || "normal",
        letterSpacing: s.letterSpacing || "-0.02em",
        lineHeight: s.lineHeight || 1.05,
        color: s.color || "#1d1d1f",
        textTransform: s.textTransform || "none",
      };
      if (baseFontSize && s.fontSizeScale) {
        patch.fontSize = Math.round(baseFontSize * s.fontSizeScale);
      }
      updateBase(id, patch);
      setOpen(false);
    } catch (e) {
      setErr("Could not analyze the image. Try another.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative" onPointerDown={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((v) => !v)}
        title="AI Typography"
        className="flex items-center gap-1.5 h-10 px-3.5 rounded-full bg-white/90 backdrop-blur-xl text-[#1d1d1f] text-[14px] font-medium shadow-sm ring-1 ring-black/[0.06] hover:bg-white"
        style={{ fontFamily: "-apple-system, system-ui, sans-serif" }}
      >
        <Sparkles className="w-4 h-4 text-[#0A84FF]" /> AI
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute left-1/2 -translate-x-1/2 bottom-12 z-20 w-64 rounded-2xl bg-white/95 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.06] p-3"
            style={{ fontFamily: "-apple-system, system-ui, sans-serif" }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-semibold text-[#1d1d1f]">AI Typography</span>
              <button onClick={() => setOpen(false)} className="text-[#86868b] hover:text-[#1d1d1f]">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-[#86868b] mb-2 leading-relaxed">
              Upload an image of typography. The AI restyles the selected text to match its lettering.
            </p>
            {preview ? (
              <div className="mb-2 rounded-lg overflow-hidden ring-1 ring-black/10 max-h-32 bg-black/[0.02]">
                <img src={preview} alt="typography sample" className="w-full object-contain" />
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full h-20 rounded-lg bg-black/[0.04] border border-dashed border-black/15 text-[12px] text-[#86868b] hover:bg-black/[0.06] flex flex-col items-center justify-center gap-1"
              >
                <span className="text-[18px]">↥</span> Upload typography image
              </button>
            )}
            {preview && (
              <button onClick={() => fileRef.current?.click()} className="text-[11px] text-[#0A84FF] hover:underline mb-2">
                Change image
              </button>
            )}
            {err && <p className="text-[11px] text-red-500 mb-2">{err}</p>}
            <button
              onClick={analyze}
              disabled={!preview || busy}
              className="w-full h-9 rounded-lg bg-[#0A84FF] text-white text-[13px] font-medium hover:bg-[#0a78e0] disabled:opacity-40 flex items-center justify-center gap-1.5"
            >
              {busy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Analyzing…
                </>
              ) : (
                "Redesign text"
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
          </div>
        </>
      )}
    </div>
  );
}