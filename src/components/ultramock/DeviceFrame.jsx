import React from "react";
import DeviceMedia from "./DeviceMedia";

// Renders media (image or video) inside one of several device chrome frames.
// Pure CSS — no external assets — so html2canvas can capture it cleanly.
//
// `cornerRadius` is a multiplier (0 = sharp, 1 = default, up to ~2 = extra round)
// applied to BOTH the outer device chrome and the inner screen radius so the
// device stays visually consistent.
export default function DeviceFrame({ device, screenshot, media, scale = 1, cornerRadius = 1 }) {
  // Backward compat: if `screenshot` (string URL) is passed, treat as image.
  const m = media || (screenshot ? { url: screenshot, type: "image" } : null);
  if (!m) return null;
  const cr = Math.max(0, Math.min(2.5, cornerRadius));
  switch (device) {
    case "iphone":   return <IPhoneFrame  media={m} scale={scale} cr={cr} />;
    case "android":  return <AndroidFrame media={m} scale={scale} cr={cr} />;
    case "macbook":  return <MacBookFrame media={m} scale={scale} cr={cr} />;
    case "imac":     return <IMacFrame    media={m} scale={scale} cr={cr} />;
    case "ipad":     return <IPadFrame    media={m} scale={scale} cr={cr} />;
    case "browser":  return <BrowserFrame media={m} scale={scale} cr={cr} />;
    case "none":     return <BareFrame    media={m} scale={scale} cr={cr} />;
    default:         return <IPhoneFrame  media={m} scale={scale} cr={cr} />;
  }
}

function IPhoneFrame({ media, scale, cr }) {
  return (
    <div
      className="relative bg-zinc-950 p-[10px] shadow-2xl"
      style={{
        width: 280 * scale,
        height: 580 * scale,
        borderRadius: `${3 * cr}rem`,
        boxShadow: "0 40px 80px -20px rgba(0,0,0,0.5), 0 0 0 2px rgba(255,255,255,0.05) inset",
      }}
    >
      <div
        className="absolute top-3 left-1/2 -translate-x-1/2 bg-black rounded-full z-10"
        style={{ width: 90 * scale, height: 26 * scale }}
      />
      <div
        className="w-full h-full overflow-hidden bg-black"
        style={{ borderRadius: `${2.4 * cr}rem` }}
      >
        <DeviceMedia media={media} className="w-full h-full object-cover" />
      </div>
    </div>
  );
}

function AndroidFrame({ media, scale, cr }) {
  return (
    <div
      className="relative bg-zinc-900 p-[8px] shadow-2xl"
      style={{
        width: 280 * scale,
        height: 580 * scale,
        borderRadius: `${2.5 * cr}rem`,
        boxShadow: "0 40px 80px -20px rgba(0,0,0,0.5), 0 0 0 2px rgba(255,255,255,0.05) inset",
      }}
    >
      <div
        className="absolute top-4 left-1/2 -translate-x-1/2 bg-black rounded-full z-10 ring-1 ring-zinc-700"
        style={{ width: 12 * scale, height: 12 * scale }}
      />
      <div
        className="w-full h-full overflow-hidden bg-black"
        style={{ borderRadius: `${2 * cr}rem` }}
      >
        <DeviceMedia media={media} className="w-full h-full object-cover" />
      </div>
    </div>
  );
}

function MacBookFrame({ media, scale, cr }) {
  return (
    <div className="relative" style={{ width: 720 * scale }}>
      <div
        className="relative bg-zinc-950 p-[10px] shadow-2xl"
        style={{
          height: 460 * scale,
          borderTopLeftRadius: `${1 * cr}rem`,
          borderTopRightRadius: `${1 * cr}rem`,
          boxShadow: "0 40px 80px -20px rgba(0,0,0,0.5)",
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-3 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
        </div>
        <div
          className="w-full h-full overflow-hidden bg-black mt-3"
          style={{ borderRadius: `${0.5 * cr}rem` }}
        >
          <DeviceMedia media={media} className="w-full h-full object-cover" />
        </div>
      </div>
      <div
        className="bg-gradient-to-b from-zinc-300 to-zinc-400 mx-auto rounded-b-xl"
        style={{ height: 14 * scale, width: 760 * scale, marginLeft: -20 * scale }}
      >
        <div className="bg-zinc-500 mx-auto rounded-b-lg" style={{ width: 100 * scale, height: 6 * scale }} />
      </div>
    </div>
  );
}

function IMacFrame({ media, scale, cr }) {
  return (
    <div className="relative" style={{ width: 760 * scale }}>
      <div
        className="relative bg-zinc-950 p-[12px] shadow-2xl"
        style={{
          height: 480 * scale,
          borderRadius: `${1 * cr}rem`,
          boxShadow: "0 40px 80px -20px rgba(0,0,0,0.5)",
        }}
      >
        <div
          className="w-full h-full overflow-hidden bg-black"
          style={{ borderRadius: `${0.5 * cr}rem` }}
        >
          <DeviceMedia media={media} className="w-full h-full object-cover" />
        </div>
      </div>
      <div className="mx-auto" style={{ width: 60 * scale, height: 28 * scale, background: "linear-gradient(180deg, #d4d4d8, #a1a1aa)" }} />
      <div className="mx-auto rounded-b-full" style={{ width: 220 * scale, height: 10 * scale, background: "#a1a1aa" }} />
    </div>
  );
}

function IPadFrame({ media, scale, cr }) {
  return (
    <div
      className="relative bg-zinc-950 p-[14px] shadow-2xl"
      style={{
        width: 480 * scale,
        height: 640 * scale,
        borderRadius: `${2 * cr}rem`,
        boxShadow: "0 40px 80px -20px rgba(0,0,0,0.5)",
      }}
    >
      <div
        className="w-full h-full overflow-hidden bg-black"
        style={{ borderRadius: `${1 * cr}rem` }}
      >
        <DeviceMedia media={media} className="w-full h-full object-cover" />
      </div>
    </div>
  );
}

function BrowserFrame({ media, scale, cr }) {
  return (
    <div
      className="relative bg-white overflow-hidden shadow-2xl"
      style={{
        width: 720 * scale,
        height: 460 * scale,
        borderRadius: `${1 * cr}rem`,
        boxShadow: "0 40px 80px -20px rgba(0,0,0,0.4)",
      }}
    >
      <div className="bg-zinc-100 border-b border-zinc-200 px-4 py-2.5 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 mx-4 px-3 py-1 bg-white rounded-md text-[11px] text-zinc-500 font-mono truncate">ttt.app</div>
      </div>
      <div className="w-full bg-black" style={{ height: `calc(100% - 40px)` }}>
        <DeviceMedia media={media} className="w-full h-full object-cover" />
      </div>
    </div>
  );
}

function BareFrame({ media, scale, cr }) {
  return (
    <div
      className="overflow-hidden shadow-2xl"
      style={{
        width: 600 * scale,
        borderRadius: `${1 * cr}rem`,
        boxShadow: "0 40px 80px -20px rgba(0,0,0,0.5)",
      }}
    >
      <DeviceMedia media={media} className="w-full h-auto block" />
    </div>
  );
}