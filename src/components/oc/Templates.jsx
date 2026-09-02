import React, { useRef } from "react";

const DEVICES = [
  { device: "iphone", label: "iPhone" },
  { device: "ipad", label: "iPad" },
  { device: "macbook", label: "MacBook" },
  { device: "monitor", label: "Monitor" },
];

const PRESETS = [
  { name: "fadeIn", label: "Fade In" },
  { name: "fadeOut", label: "Fade Out" },
  { name: "slideInLeft", label: "Slide In ←" },
  { name: "slideInRight", label: "Slide In →" },
  { name: "scalePop", label: "Scale Pop" },
  { name: "spin", label: "Spin 360°" },
  { name: "bounce", label: "Bounce" },
  { name: "float", label: "Float" },
];

// Templates popover: click a device mockup to upload your own image/video into
// its screen (instant local preview), or apply a motion preset to the selected object.
export default function Templates({ editor, onClose }) {
  const hasSelection = !!editor.selectedObject;
  const fileRef = useRef(null);
  const pendingDevice = useRef(null);

  const onDeviceClick = (d) => { pendingDevice.current = d; fileRef.current?.click(); };
  const onFile = (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const url = URL.createObjectURL(f);
    const mediaType = f.type.startsWith("video/") ? "video" : "image";
    editor.addObject("device", { device: pendingDevice.current, src: url, mediaType });
    onClose();
  };
  const apply = (name) => { editor.applyPreset(name); };

  const btn = "flex items-center justify-center rounded-xl text-[12px] font-medium transition-colors";
  return (
    <div className="w-64 rounded-2xl bg-white/95 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.06] p-3"
      style={{ fontFamily: '-apple-system, system-ui, sans-serif' }} onPointerDown={(e) => e.stopPropagation()}>
      <div className="text-[10px] uppercase tracking-wide text-[#86868b] font-semibold mb-2">Device mockups</div>
      <div className="text-[10px] text-[#86868b] mb-2 leading-snug">Click a device to upload an image or video into its screen.</div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {DEVICES.map((d) => (
          <button key={d.device} onClick={() => onDeviceClick(d.device)}
            className={`${btn} h-10 bg-black/[0.04] text-[#1d1d1f] hover:bg-[#0A84FF] hover:text-white`}>{d.label}</button>
        ))}
      </div>
      <div className="text-[10px] uppercase tracking-wide text-[#86868b] font-semibold mb-2">Motion presets</div>
      <div className="grid grid-cols-2 gap-2">
        {PRESETS.map((p) => (
          <button key={p.name} disabled={!hasSelection} onClick={() => apply(p.name)}
            className={`${btn} h-10 bg-black/[0.04] text-[#1d1d1f] hover:bg-[#0A84FF] hover:text-white disabled:opacity-40 disabled:hover:bg-black/[0.04] disabled:hover:text-[#1d1d1f]`}>{p.label}</button>
        ))}
      </div>
      {!hasSelection && <p className="text-[11px] text-[#86868b] mt-2 leading-snug">Select an object first, then tap a preset to auto-keyframe it across the timeline.</p>}
      <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={onFile} />
    </div>
  );
}