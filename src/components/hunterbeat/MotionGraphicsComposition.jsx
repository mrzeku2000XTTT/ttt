import React from "react";
import { Img, useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from "remotion";

const FPS = 30;
const DURATION = 180; // 6 seconds

export const MOTION_FPS = FPS;
export const MOTION_DURATION = DURATION;

const easeOutExpo = (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
const easeInOut = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/**
 * Animated text layer — slides up + fades in with spring physics.
 */
function AnimatedText({ frame, fps, text, delay, style }) {
  const local = frame - delay;
  if (local < 0) return null;

  const s = spring({
    frame: local,
    fps,
    config: { damping: 14, stiffness: 100, mass: 0.9 },
  });

  const opacity = interpolate(s, [0, 1], [0, 1]);
  const translateY = interpolate(s, [0, 1], [40, 0]);
  const blur = interpolate(s, [0, 0.5, 1], [8, 4, 0]);

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: "12%",
        display: "flex",
        justifyContent: "center",
        opacity,
        transform: `translateY(${translateY}px)`,
        filter: `blur(${blur}px)`,
      }}
    >
      <div
        style={{
          padding: "10px 28px",
          borderRadius: 100,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          color: "#fff",
          fontFamily: '-apple-system, "SF Pro Display", "Inter", sans-serif',
          fontSize: 42,
          fontWeight: 700,
          letterSpacing: -0.5,
          ...style,
        }}
      >
        {text}
      </div>
    </div>
  );
}

/**
 * Accent bar — scales in from center with spring.
 */
function AccentBar({ frame, fps, delay, color }) {
  const local = frame - delay;
  if (local < 0) return null;

  const s = spring({
    frame: local,
    fps,
    config: { damping: 12, stiffness: 120, mass: 0.8 },
  });

  const scaleX = interpolate(s, [0, 1], [0, 1]);
  const opacity = interpolate(s, [0, 1], [0, 0.9]);

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        bottom: "6%",
        width: 120,
        height: 5,
        borderRadius: 3,
        background: color || "#0A84FF",
        transform: `translateX(-50%) scaleX(${scaleX})`,
        opacity,
        boxShadow: `0 0 20px ${color || "#0A84FF"}`,
      }}
    />
  );
}

/**
 * Ken Burns — slow pan + zoom on the background image.
 */
function KenBurns({ frame, fps, durationInFrames, img }) {
  // Two-phase: first half pans right+zoom in, second half settles
  const t = frame / durationInFrames;
  const panProgress = easeInOut(Math.min(t * 1.5, 1));
  const zoom = 1.05 + 0.08 * easeOutExpo(t);
  const panX = interpolate(panProgress, [0, 1], [-3, 3]);
  const panY = interpolate(panProgress, [0, 1], [-2, 2]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
      }}
    >
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

/**
 * Crossfade between two background images.
 */
function CrossfadeBg({ frame, fps, imgA, imgB, crossStart, crossDuration }) {
  const progress = interpolate(
    frame,
    [crossStart, crossStart + crossDuration],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const scaleA = 1.05 + 0.05 * easeOutExpo(frame / 120);
  const scaleB = 1.08 + 0.05 * easeOutExpo((frame - crossStart) / 120);

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
 * Props: { spec, images }
 *   spec: { title, overlay_text, accent_color, motion_style }
 *   images: [url, ...] (1-2 background images)
 */
export default function MotionGraphicsComposition({ spec = {}, images = [] }) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const overlayText = spec.overlay_text || spec.title || "";
  const accent = spec.accent_color || "#0A84FF";
  const hasTwo = images.length >= 2;

  // Vignette
  const vignetteOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", backgroundColor: spec.background || "#000", overflow: "hidden" }}>
      {/* Background: Ken Burns or crossfade */}
      {hasTwo ? (
        <CrossfadeBg
          frame={frame}
          fps={fps}
          imgA={images[0]}
          imgB={images[1]}
          crossStart={Math.floor(durationInFrames * 0.35)}
          crossDuration={Math.floor(durationInFrames * 0.25)}
        />
      ) : (
        <KenBurns frame={frame} fps={fps} durationInFrames={durationInFrames} img={images[0]} />
      )}

      {/* Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: vignetteOpacity,
          background: "linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgba(0,0,0,0.35) 100%)",
        }}
      />

      {/* Overlay text */}
      {overlayText && (
        <AnimatedText frame={frame} fps={fps} text={overlayText} delay={20} />
      )}

      {/* Accent bar */}
      <AccentBar frame={frame} fps={fps} delay={35} color={accent} />

      {/* Subtle grain / noise overlay for depth */}
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