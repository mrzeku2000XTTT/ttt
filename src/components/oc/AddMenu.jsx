import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";

// Floating "Add" menu — lives underneath the stage so it stays reachable
// even in fullscreen (when the top toolbar is hidden).
export default function AddMenu({ editor }) {
  const { addObject } = editor;
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const add = (type) => { addObject(type); setOpen(false); };

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setOpen(false);
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file: f });
      addObject("image", { src: res?.file_url || res?.url });
    } catch { /* ignore */ } finally { setUploading(false); }
  };

  return (
    <div className="relative" onPointerDown={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 h-10 pl-3.5 pr-3.5 rounded-full bg-[#0A84FF] text-white text-[14px] font-medium hover:bg-[#0a78e0] transition-colors shadow-[0_4px_14px_rgba(10,132,255,0.35)]"
        style={{ fontFamily: '-apple-system, system-ui, sans-serif' }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5v11M1.5 7h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
        Add
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-1/2 -translate-x-1/2 bottom-12 z-20 w-48 rounded-2xl bg-white/95 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.06] py-1.5 overflow-hidden">
            {[
              { type: "text", label: "Text", glyph: "T" },
              { type: "rect", label: "Rectangle", glyph: "▭" },
              { type: "ellipse", label: "Ellipse", glyph: "◯" },
            ].map((it) => (
              <button key={it.type} onClick={() => add(it.type)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#1d1d1f] hover:bg-black/[0.04] text-left"
                style={{ fontFamily: '-apple-system, system-ui, sans-serif' }}>
                <span className="w-5 text-center text-[#86868b]">{it.glyph}</span>{it.label}
              </button>
            ))}
            <div className="my-1 h-px bg-black/[0.06]" />
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#1d1d1f] hover:bg-black/[0.04] text-left disabled:opacity-50"
              style={{ fontFamily: '-apple-system, system-ui, sans-serif' }}>
              <span className="w-5 text-center text-[#86868b]">{uploading ? "…" : "↥"}</span>{uploading ? "Uploading…" : "Upload image"}
            </button>
          </div>
        </>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
    </div>
  );
}