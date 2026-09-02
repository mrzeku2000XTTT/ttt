import React from "react";

// Screen media is absolutely positioned so an image/video's intrinsic size
// never forces the device's flex layout to overflow its bounding box
// (which previously clipped the selection outline to the screen only).
function Screen({ src, mediaType }) {
  if (!src) {
    return <div style={{ position: "absolute", inset: 0, background: "linear-gradient(155deg,#3a3a4e,#1a1a2a 60%,#2a3a3a)" }} />;
  }
  if (mediaType === "video") {
    return <video src={src} muted loop playsInline autoPlay draggable={false} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} />;
  }
  return <img src={src} alt="" draggable={false} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} />;
}

// Apple-style device mockups rendered with pure CSS so they stay crisp at any
// size. The whole mockup (screen + stand) always fits exactly within the
// object's bounding box, so the selection outline wraps the entire device.
export default function DeviceFrame({ device, src, mediaType }) {
  if (device === "iphone") {
    return (
      <div style={{ width: "100%", height: "100%", background: "linear-gradient(150deg,#ededf0,#c7c7cc)", borderRadius: "22%", padding: "5%", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.6), inset 0 0 6px rgba(0,0,0,0.08)" }}>
        <div style={{ width: "100%", height: "100%", background: "#0b0b0d", borderRadius: "17%", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "2.5%", left: "50%", transform: "translateX(-50%)", width: "36%", height: "2.2%", background: "#1a1a1e", borderRadius: 6, zIndex: 2 }} />
          <div style={{ position: "absolute", inset: "9% 5% 5% 5%", overflow: "hidden", borderRadius: "10%" }}>
            <Screen src={src} mediaType={mediaType} />
          </div>
        </div>
      </div>
    );
  }
  if (device === "ipad") {
    return (
      <div style={{ width: "100%", height: "100%", background: "linear-gradient(150deg,#ededf0,#c7c7cc)", borderRadius: "11%", padding: "5%", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.6), inset 0 0 6px rgba(0,0,0,0.08)" }}>
        <div style={{ width: "100%", height: "100%", background: "#0b0b0d", borderRadius: "7%", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: "6%", overflow: "hidden", borderRadius: "5%" }}>
            <Screen src={src} mediaType={mediaType} />
          </div>
        </div>
      </div>
    );
  }
  if (device === "macbook") {
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: "1 1 auto", minHeight: 0, background: "linear-gradient(150deg,#e4e4e7,#bcbcc0)", borderRadius: "4% 4% 1% 1%", padding: "3.5%", position: "relative", overflow: "hidden", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.5)" }}>
          <div style={{ position: "absolute", inset: "3.5%", background: "#0b0b0d", borderRadius: "1.5%", overflow: "hidden" }}>
            <Screen src={src} mediaType={mediaType} />
          </div>
        </div>
        <div style={{ flex: "0 0 9%", marginTop: "1.5%", position: "relative" }}>
          <div style={{ position: "absolute", left: "12%", right: "12%", top: 0, height: "100%", background: "linear-gradient(180deg,#d8d8dc,#a8a8ac)", borderRadius: "0 0 40% 40% / 0 0 100% 100%", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)" }} />
          <div style={{ position: "absolute", left: "44%", right: "44%", top: "20%", height: "50%", background: "#9a9a9e", borderRadius: 4 }} />
        </div>
      </div>
    );
  }
  // monitor
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: "1 1 auto", minHeight: 0, background: "linear-gradient(150deg,#e4e4e7,#bcbcc0)", borderRadius: "3%", padding: "4%", position: "relative", overflow: "hidden", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.5)" }}>
        <div style={{ position: "absolute", inset: "4%", background: "#0b0b0d", borderRadius: "1.5%", overflow: "hidden" }}>
          <Screen src={src} mediaType={mediaType} />
        </div>
      </div>
      <div style={{ flex: "0 0 14%", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "10%", height: "100%", background: "linear-gradient(180deg,#cfcfd3,#a0a0a4)" }} />
      </div>
      <div style={{ flex: "0 0 6%", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "42%", height: "100%", background: "linear-gradient(180deg,#bcbcc0,#8c8c90)", borderRadius: "40% 40% 12% 12%" }} />
      </div>
    </div>
  );
}