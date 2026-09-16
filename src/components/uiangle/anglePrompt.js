export const SHOTS = ["Extreme wide shot", "Wide shot", "Medium shot", "Close-up", "Extreme close-up"];
export const ANGLES = ["Eye-level", "Low angle", "High angle", "Overhead / bird's-eye", "Dutch angle"];
export const MOTIONS = ["Static", "Dolly in", "Dolly out", "Pan left", "Pan right", "Orbit around subject", "Crane up", "Handheld follow"];

const describeX = (x) => (x < 33 ? "left of frame" : x < 67 ? "center of frame" : "right of frame");
const describeY = (y) => (y < 33 ? "background" : y < 67 ? "middle ground" : "foreground");

export function buildAnglePrompt({ mode, shot, angle, camHeight, yaw, motion, prompt, dummies, mapItems, mapCamera, mapScale = 12 }) {
  const lines = [];

  if (mode === "2d") {
    lines.push("Create a 2D flat-animation-style image of this exact scene.");
    lines.push(`${shot}, ${angle.toLowerCase()} camera.`);
  } else {
    lines.push(
      mode === "3d"
        ? "Create a 3D rendered version of this exact scene with realistic depth and perspective."
        : "Create a cinematic 4D frame (3D plus motion) of this exact scene."
    );
    let geo = `${shot}, ${angle.toLowerCase()} camera, camera height ${camHeight.toFixed(1)}m, camera rotated ${Math.round(yaw)}° on the floor plan (0° faces the bottom of the map)`;
    const character = mapItems.find((i) => i.kind === "character");
    if (character) {
      const dx = ((mapCamera.x - character.x) / 100) * mapScale;
      const dy = ((mapCamera.y - character.y) / 100) * (mapScale * 0.5625);
      const dist = Math.sqrt(dx * dx + dy * dy);
      geo += `, about ${dist.toFixed(1)}m from ${character.label}`;
    }
    lines.push(`${geo}.`);
    if (mode === "4d") lines.push(`Camera motion: ${motion.toLowerCase()}.`);
  }

  const placement = dummies
    .map((d) => `${d.label} (${d.kind}) placed ${describeX(d.x + d.w / 2)}, ${describeY(d.y + d.h / 2)}`)
    .join("; ");
  if (placement) lines.push(`Scene placement: ${placement}.`);

  if (prompt.trim()) lines.push(`Creative direction: ${prompt.trim()}`);
  lines.push(
    "Use the attached reference image for the characters, style and environment. Faceless dummy cutouts mark the final on-screen positions."
  );

  return lines.filter(Boolean).join(" ");
}