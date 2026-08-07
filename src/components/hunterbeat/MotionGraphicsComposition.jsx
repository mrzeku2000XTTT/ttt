import React from "react";
import { Img, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

const FPS = 30;
export const MOTION_FPS = FPS;

const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function AnimatedText({ frame, fps, durationInFrames, text, color }) {
  const delay = Math.floor(durationInFrames * 0.11);
  const local = frame - delay;
  if (local < 0) return null;

  const s = spring({ frame: local, fps, config: { damping: 14, stiffness: 100, mass: 0.9 } });
  const opacity = interpolate(s, [0, 1], [0, 1]);
  const translateY = interpolate(s, [0, 1], [40, 0]);
  const blur = interpolate(s, [0, 0.5, 1], [8, 4, 0]);

  // Fade out near end
  const fadeOutStart = durationInFrames - 15;
  const fadeOut = frame > fadeOutStart ? interpolate(frame, [fadeOutStart, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: "14%",
        display: "flex",
        justifyContent: "center",
        opacity: opacity * fadeOut,
        transform: `translateY(${translateY}px)`,
        filter: `blur(${blur}px)`,
      }}
    >
      <div
        style={{
          padding: "12px 32px",
          borderRadius: 100,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          color: "#fff",
          fontFamily: '-apple-system, "SF Pro Display", "Inter", sans-serif',
          fontSize: 44,
          fontWeight: 700,
          letterSpacing: -0.5,
          boxShadow: `0 8px 32px rgba(0,0,0,0.3)`,
        }}
      >
        {text}
      </div>
    </div>
  );
}

function AccentBar({ frame, fps, durationInFrames, color }) {
  const delay = Math.floor(durationInFrames * 0.19);
  const local = frame - delay;
  if (local < 0) return null;

  const s = spring({ frame: local, fps, config: { damping: 12, stiffness: 120, mass: 0.8 } });
  const scaleX = interpolate(s, [0, 1], [0, 1]);
  const opacity = interpolate(s, [0, 1], [0, 0.9]);

  const fadeOutStart = durationInFrames - 10;
  const fadeOut = frame > fadeOutStart ? interpolate(frame, [fadeOutStart, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        bottom: "7%",
        width: 120,
        height: 5,
        borderRadius: 3,
        background: color || "#0A84FF",
        transform: `translateX(-50%) scaleX(${scaleX})`,
        opacity: opacity * fadeOut,
        boxShadow: `0 0 20px ${color || "#0A84FF"}`,
      }}
    />
  );
}

function KenBurns({ frame, durationInFrames, img }) {
  const t = frame / durationInFrames;
  const zoom = 1.05 + 0.08 * easeOutExpo(t);
  const panProgress = easeInOut(Math.min(t * 1.5, 1));
  const panX = interpolate(panProgress, [0, 1], [-3, 3]);
  const panY = interpolate(panProgress, [0, 1], [-2, 2]);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {img && (
        <Img
          src={img}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${zoom}) translate(${panX}%, ${panY}%)`,
          }}
        />
      )}
    </div>
  );
}

function CrossfadeBg({ frame, durationInFrames, imgA, imgB }) {
  const crossStart = Math.floor(durationInFrames * 0.35);
  const crossDuration = Math.floor(durationInFrames * 0.25);
  const progress = interpolate(frame, [crossStart, crossStart + crossDuration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scaleA = 1.05 + 0.05 * easeOutExpo(frame / durationInFrames);
  const scaleB = 1.08 + 0.05 * easeOutExpo(Math.max(0, frame - crossStart) / durationInFrames);

  return (
    <>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", opacity: 1 - progress }}>
        {imgA && <Img src={imgA} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${scaleA})` }} />}
      </div>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", opacity: progress }}>
        {imgB && <Img src={imgB} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${scaleB})` }} />}
      </div>
    </>
  );
}

/**
 * Full motion-graphics composition.
 * Props: { spec, images, durationSeconds }
 */
export default function MotionGraphicsComposition({ spec = {}, images = [], durationSeconds = 6 }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const durationInFrames = Math.round((durationSeconds || 6) * fps);

  const overlayText = spec.overlay_text || spec.title || "";
  const accent = spec.accent_color || "#0A84FF";
  const hasTwo = images.length >= 2 && spec.motion_style === "crossfade";

  const vignetteOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", backgroundColor: spec.background || "#000", overflow: "hidden" }}>
      {hasTwo ? (
        <CrossfadeBg frame={frame} durationInFrames={durationInFrames} imgA={images[0]} imgB={images[1]} />
      ) : (
        <KenBurns frame={frame} durationInFrames={durationInFrames} img={images[0]} />
      )}

      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: vignetteOpacity,
          background: "linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgba(0,0,0,0.35) 100%)",
        }}
      />

      {overlayText && (
        <AnimatedText frame={frame} fps={fps} durationInFrames={durationInFrames} text={overlayText} color={accent} />
      )}

      <AccentBar frame={frame} fps={fps} durationInFrames={durationInFrames} color={accent} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.03,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E\")",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}