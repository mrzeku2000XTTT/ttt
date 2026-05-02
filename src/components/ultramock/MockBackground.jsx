import React from "react";

export const BACKGROUND_PRESETS = [
  { id: "sunset",   label: "Sunset",   css: "linear-gradient(135deg, #f97316 0%, #ec4899 50%, #8b5cf6 100%)" },
  { id: "ocean",    label: "Ocean",    css: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)" },
  { id: "forest",   label: "Forest",   css: "linear-gradient(135deg, #10b981 0%, #064e3b 100%)" },
  { id: "peach",    label: "Peach",    css: "linear-gradient(135deg, #fde68a 0%, #fb7185 100%)" },
  { id: "mono",     label: "Mono",     css: "linear-gradient(135deg, #18181b 0%, #3f3f46 100%)" },
  { id: "ivory",    label: "Ivory",    css: "linear-gradient(135deg, #fafaf9 0%, #e7e5e4 100%)" },
  { id: "midnight", label: "Midnight", css: "linear-gradient(135deg, #020617 0%, #1e1b4b 50%, #312e81 100%)" },
  { id: "candy",    label: "Candy",    css: "linear-gradient(135deg, #a78bfa 0%, #f472b6 50%, #fbbf24 100%)" },
  { id: "white",    label: "White",    css: "#ffffff" },
  { id: "black",    label: "Black",    css: "#0a0a0a" },
];

// The actual canvas users see + export. forwardRef so the parent can pass it to html2canvas.
const MockBackground = React.forwardRef(function MockBackground(
  { background, padding, children },
  ref
) {
  const preset = BACKGROUND_PRESETS.find((b) => b.id === background) || BACKGROUND_PRESETS[0];
  return (
    <div
      ref={ref}
      className="relative flex items-center justify-center overflow-hidden"
      style={{
        background: preset.css,
        padding,
        width: "100%",
        aspectRatio: "16/10",
      }}
    >
      {children}
    </div>
  );
});

export default MockBackground;