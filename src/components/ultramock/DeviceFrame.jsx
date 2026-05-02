import React from "react";
import DeviceMedia from "./DeviceMedia";

// Renders media (image or video) inside one of several device chrome frames.
// Pure CSS — no external assets — so html2canvas can capture it cleanly.
export default function DeviceFrame({ device, screenshot, media, scale = 1 }) {
  // Backward compat: if `screenshot` (string URL) is passed, treat as image.
  const m = media || (screenshot ? { url: screenshot, type: "image" } : null);
  if (!m) return null;
  switch (device) {
    case "iphone":   return <IPhoneFrame  media={m} scale={scale} />;
    case "android":  return <AndroidFrame media={m} scale={scale} />;
    case "macbook":  return <MacBookFrame media={m} scale={scale} />;
    case "imac":     return <IMacFrame    media={m} scale={scale} />;
    case "ipad":     return <IPadFrame    media={m} scale={scale} />;
    case "browser":  return <BrowserFrame media={m} scale={scale} />;
    case "none":     return <BareFrame    media={m} scale={scale} />;
    default:         return <IPhoneFrame  media={m} scale={scale} />;
  }
}

function IPhoneFrame({ media, scale }) {
  return (
    <div
      className="relative bg-zinc-950 rounded-[3rem] p-[10px] shadow-2xl"
      style={{
        width: 280 * scale,
        height: 580 * scale,
        boxShadow: "0 40px 80px -20px rgba(0,0,0,0.5), 0 0 0 2px rgba(255,255,255,0.05) inset",
      }}
    >
      <div
        className="absolute top-3 left-1/2 -translate-x-1/2 bg-black rounded-full z-10"
        style={{ width: 90 * scale, height: 26 * scale }}
      />
      <div className="w-full h-full rounded-[2.4rem] overflow-hidden bg-black">
        <DeviceMedia media={media} className="w-full h-full object-cover" />
      </div>
    </div>
  );
}

function AndroidFrame({ media, scale }) {
  return (
    <div
      className="relative bg-zinc-900 rounded-[2.5rem] p-[8px] shadow-2xl"
      style={{
        width: 280 * scale,
        height: 580 * scale,
        boxShadow: "0 40px 80px -20px rgba(0,0,0,0.5), 0 0 0 2px rgba(255,255,255,0.05) inset",
      }}
    >
      <div
        className="absolute top-4 left-1/2 -translate-x-1/2 bg-black rounded-full z-10 ring-1 ring-zinc-700"
        style={{ width: 12 * scale, height: 12 * scale }}
      />
      <div className="w-full h-full rounded-[2rem] overflow-hidden bg-black">
        <DeviceMedia media={media} className="w-full h-full object-cover" />
      </div>
    </div>
  );
}

function MacBookFrame({ media, scale }) {
  return (
    <div className="relative" style={{ width: 720 * scale }}>
      <div
        className="relative bg-zinc-950 rounded-t-2xl p-[10px] shadow-2xl"
        style={{ height: 460 * scale, boxShadow: "0 40px 80px -20px rgba(0,0,0,0.5)" }}
      >
        <div className="absolute top-0 left-0 right-0 h-3 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
        </div>
        <div className="w-full h-full rounded-lg overflow-hidden bg-black mt-3">
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

function IMacFrame({ media, scale }) {
  return (
    <div className="relative" style={{ width: 760 * scale }}>
      <div
        className="relative bg-zinc-950 rounded-2xl p-[12px] shadow-2xl"
        style={{ height: 480 * scale, boxShadow: "0 40px 80px -20px rgba(0,0,0,0.5)" }}
      >
        <div className="w-full h-full rounded-lg overflow-hidden bg-black">
          <DeviceMedia media={media} className="w-full h-full object-cover" />
        </div>
      </div>
      <div className="mx-auto" style={{ width: 60 * scale, height: 28 * scale, background: "linear-gradient(180deg, #d4d4d8, #a1a1aa)" }} />
      <div className="mx-auto rounded-b-full" style={{ width: 220 * scale, height: 10 * scale, background: "#a1a1aa" }} />
    </div>
  );
}

function IPadFrame({ media, scale }) {
  return (
    <div
      className="relative bg-zinc-950 rounded-[2rem] p-[14px] shadow-2xl"
      style={{ width: 480 * scale, height: 640 * scale, boxShadow: "0 40px 80px -20px rgba(0,0,0,0.5)" }}
    >
      <div className="w-full h-full rounded-2xl overflow-hidden bg-black">
        <DeviceMedia media={media} className="w-full h-full object-cover" />
      </div>
    </div>
  );
}

function BrowserFrame({ media, scale }) {
  return (
    <div
      className="relative bg-white rounded-2xl overflow-hidden shadow-2xl"
      style={{ width: 720 * scale, height: 460 * scale, boxShadow: "0 40px 80px -20px rgba(0,0,0,0.4)" }}
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

function BareFrame({ media, scale }) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ width: 600 * scale, boxShadow: "0 40px 80px -20px rgba(0,0,0,0.5)" }}>
      <DeviceMedia media={media} className="w-full h-auto block" />
    </div>
  );
}