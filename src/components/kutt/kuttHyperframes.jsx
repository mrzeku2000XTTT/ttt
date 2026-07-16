// Hyperframe animation presets, state computation, and rendering for text + animation overlays.

export const HYPERFRAME_ANIMATIONS = {
  fade_in: "Fade In",
  fade_out: "Fade Out",
  slide_up: "Slide Up",
  slide_left: "Slide Left",
  pop: "Pop",
  typewriter: "Typewriter",
  zoom: "Zoom",
  shake: "Shake",
};

export const HYPERFRAME_STYLES = {
  bold_white: { fontSize: 48, color: "#ffffff", fontWeight: "900", position: "center", bg: null },
  caption: { fontSize: 32, color: "#ffffff", fontWeight: "700", position: "bottom", bg: "rgba(0,0,0,0.6)" },
  hook: { fontSize: 56, color: "#00d1ff", fontWeight: "900", position: "top", bg: null },
  cta: { fontSize: 40, color: "#ff00ff", fontWeight: "800", position: "center", bg: "rgba(0,0,0,0.7)" },
  advice: { fontSize: 36, color: "#ffffff", fontWeight: "600", position: "center", bg: "rgba(0,0,0,0.5)" },
};

// Compute the animated state of a hyperframe at time t
export function getHyperframeState(clip, t) {
  const start = clip.start;
  const dur = clip.duration || 1;
  const progress = Math.min(1, Math.max(0, (t - start) / dur));
  const anim = clip.animation || "fade_in";

  let opacity = 1, offsetX = 0, offsetY = 0, scale = 1;
  let visibleText = clip.text || "";

  switch (anim) {
    case "fade_in":
      opacity = Math.min(1, progress * 3);
      break;
    case "fade_out":
      opacity = progress < 0.7 ? 1 : Math.max(0, 1 - (progress - 0.7) * 3.3);
      break;
    case "slide_up":
      offsetY = (1 - Math.min(1, progress * 2.5)) * 60;
      opacity = Math.min(1, progress * 2.5);
      break;
    case "slide_left":
      offsetX = (1 - Math.min(1, progress * 2.5)) * 100;
      opacity = Math.min(1, progress * 2.5);
      break;
    case "pop":
      if (progress < 0.15) scale = 0.3 + (progress / 0.15) * 0.9;
      else if (progress < 0.25) scale = 1.1 - ((progress - 0.15) / 0.1) * 0.1;
      else scale = 1;
      opacity = Math.min(1, progress * 5);
      break;
    case "typewriter":
      var charCount = Math.floor(progress * (clip.text?.length || 0) * 1.5);
      visibleText = (clip.text || "").slice(0, charCount);
      break;
    case "zoom":
      scale = 0.5 + progress * 0.5;
      opacity = Math.min(1, progress * 2);
      break;
    case "shake":
      var intensity = progress < 0.8 ? 3 : 3 * (1 - (progress - 0.8) * 5);
      offsetX = Math.sin(t * 30) * intensity;
      offsetY = Math.cos(t * 25) * intensity;
      break;
    default:
      break;
  }

  return { opacity, offsetX, offsetY, scale, visibleText };
}

// Render a hyperframe on a canvas 2D context (used during export)
export function renderHyperframeCanvas(ctx, clip, t, width, height) {
  const state = getHyperframeState(clip, t);
  if (state.opacity <= 0) return;

  const stylePreset = HYPERFRAME_STYLES[clip.style_preset] || HYPERFRAME_STYLES.bold_white;
  const style = { ...stylePreset, ...(clip.style || {}) };
  const fontSize = (style.fontSize || 48) * (width / 1280);

  let cy;
  if (style.position === "top") cy = height * 0.15;
  else if (style.position === "bottom") cy = height * 0.85;
  else cy = height / 2;

  ctx.save();
  ctx.globalAlpha = state.opacity;
  ctx.translate(width / 2 + state.offsetX, cy + state.offsetY);
  ctx.scale(state.scale, state.scale);
  ctx.font = `${style.fontWeight || "700"} ${fontSize}px Inter, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (style.bg) {
    const metrics = ctx.measureText(state.visibleText);
    const pad = fontSize * 0.3;
    ctx.fillStyle = style.bg;
    ctx.fillRect(-metrics.width / 2 - pad, -fontSize / 2 - pad / 2, metrics.width + pad * 2, fontSize + pad);
  }

  ctx.shadowColor = "rgba(0,0,0,0.8)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = style.color || "#ffffff";
  ctx.fillText(state.visibleText, 0, 0);
  ctx.restore();
}

// React component for live preview overlay
export function HyperframeOverlay({ clip, t }) {
  const state = getHyperframeState(clip, t);
  if (state.opacity <= 0) return null;

  const stylePreset = HYPERFRAME_STYLES[clip.style_preset] || HYPERFRAME_STYLES.bold_white;
  const style = { ...stylePreset, ...(clip.style || {}) };

  const positionStyle = {};
  if (style.position === "top") positionStyle.top = "15%";
  else if (style.position === "bottom") positionStyle.bottom = "15%";
  else positionStyle.top = "50%";

  const isCenter = style.position !== "top" && style.position !== "bottom";

  return (
    <div
      className="absolute left-1/2 pointer-events-none whitespace-nowrap z-10"
      style={{
        ...positionStyle,
        transform: `translate(calc(-50% + ${state.offsetX}px), ${isCenter ? "-50%" : "0"} translateY(${state.offsetY}px)) scale(${state.scale})`,
        opacity: state.opacity,
        fontSize: `${style.fontSize}px`,
        color: style.color,
        fontWeight: style.fontWeight,
        fontFamily: "Inter, sans-serif",
        textAlign: "center",
        background: style.bg || "transparent",
        padding: style.bg ? "0.2em 0.4em" : 0,
        borderRadius: style.bg ? "0.2em" : 0,
        textShadow: "0 2px 4px rgba(0,0,0,0.8)",
      }}
    >
      {state.visibleText}
    </div>
  );
}