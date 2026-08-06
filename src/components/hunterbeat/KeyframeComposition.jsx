import React from "react";
import { Img, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

const FPS = 30;
const FRAMES_PER_KEYFRAME = 33; // ~1.1s per keyframe

export const KEYFRAME_DURATION = FRAMES_PER_KEYFRAME;
export const KEYFRAME_FPS = FPS;

export default function KeyframeComposition({ frames = [] }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const count = Math.max(frames.length, 1);
  const total = count * FRAMES_PER_KEYFRAME;
  const loopedFrame = frame % total;

  const idx = Math.floor(loopedFrame / FRAMES_PER_KEYFRAME);
  const local = loopedFrame % FRAMES_PER_KEYFRAME;
  const nextIdx = (idx + 1) % count;
  const progress = local / FRAMES_PER_KEYFRAME; // 0..1

  // Crossfade starts at 70% of the keyframe
  const fadeStart = 0.7;
  const crossfading = progress >= fadeStart;
  const fadeProgress = crossfading ? (progress - fadeStart) / (1 - fadeStart) : 0;

  // Spring scale (subtle breathe)
  const scale = interpolate(
    spring({ frame: local, fps, config: { damping: 18, stiffness: 120, mass: 0.8 } }),
    [0, 1],
    [1.04, 1.0]
  );

  // Blur during crossfade transition
  const blurAmount = crossfading ? interpolate(fadeProgress, [0, 0.5, 1], [0, 6, 0]) : 0;
  const outgoingOpacity = crossfading ? interpolate(fadeProgress, [0, 1], [1, 0]) : 1;
  const incomingOpacity = crossfading ? interpolate(fadeProgress, [0, 1], [0, 1]) : 0;

  const Frame = ({ url, opacity, scaleVal, blur }) => (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        transform: `scale(${scaleVal})`,
        filter: blur > 0 ? `blur(${blur}px)` : "none",
        overflow: "hidden",
      }}
    >
      {url && (
        <Img
          src={url}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      )}
    </div>
  );

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", backgroundColor: "#000", overflow: "hidden" }}>
      <Frame url={frames[idx]} opacity={outgoingOpacity} scaleVal={scale} blur={crossfading ? blurAmount : 0} />
      {crossfading && (
        <Frame
          url={frames[nextIdx]}
          opacity={incomingOpacity}
          scaleVal={interpolate(
            spring({ frame: 0, fps, config: { damping: 18, stiffness: 120, mass: 0.8 } }),
            [0, 1],
            [1.06, 1.0]
          )}
          blur={blurAmount}
        />
      )}
    </div>
  );
}