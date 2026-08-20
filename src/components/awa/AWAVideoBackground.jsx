import React from "react";

// BlockDAG / DAGKnight video background (replaces the 3D sphere).
const BLOCKDAG_VIDEO = "https://media.base44.com/videos/public/6901295fa9bcfaa0f5ba2c2a/eb6ca43bc_BlockDAG_background.mp4";

export default function AWAVideoBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <video
        className="w-full h-full object-cover"
        src={BLOCKDAG_VIDEO}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
      />
    </div>
  );
}