// FRAMEFLOW — shot settings, the permanent drawing style, and the request the
// generator sends for every in-between frame.
//
// The hand-drawn look lives in STYLE_LOCK, separate from the motion instruction
// and the reference frames, so one visual language is carried across the whole
// sequence instead of being re-invented frame by frame.

export const MOTION_PRESETS = [
  { id: "Custom", prompt: "" },
  {
    id: "Head Turn",
    prompt:
      "Character smoothly turns their head toward the camera while the neck, hair and clothing follow naturally.",
  },
  {
    id: "Walk",
    prompt:
      "Character takes a natural walking step from the start pose into the end pose, with believable weight transfer and secondary motion.",
  },
  {
    id: "Run",
    prompt:
      "Character transitions through a fast running motion with clear weight transfer, leg movement, arm swing and secondary clothing motion.",
  },
  {
    id: "Blink",
    prompt:
      "Character performs a natural blink and subtle facial movement while preserving identity and exact facial structure.",
  },
  {
    id: "Expression",
    prompt:
      "Character transitions naturally from the starting expression to the ending expression, preserving facial anatomy and linework.",
  },
  {
    id: "Camera Push",
    prompt: "The camera slowly pushes toward the subject while the character remains structurally consistent.",
  },
  {
    id: "Camera Pan",
    prompt:
      "The camera smoothly pans between the start and end compositions while maintaining perspective and character identity.",
  },
];

export const TIMING_OPTIONS = ["Even", "Ease In", "Ease Out", "Ease In / Out", "Fast → Slow", "Slow → Fast"];

export const CAMERA_OPTIONS = ["Locked", "Subtle handheld", "Push in", "Pull out", "Pan left", "Pan right"];

export const PRESERVE_OPTIONS = [
  "Character identity",
  "Face proportions",
  "Clothing",
  "Linework",
  "Perspective",
  "Object positions",
];

export const DEFAULT_MOTION =
  "Character slowly turns their head toward the camera. Preserve the character's identity and hand-drawn linework.";

export const DEFAULT_STYLE_LOCK =
  "Traditional hand-drawn animation keyframe aesthetic. Black ink linework drawn with a fine technical pen. Organic variable line weight. Imperfect strokes. Scratchy contour lines. Loose construction lines. Subtle pencil underdrawing. Hand-applied grey marker shading with visible overlapping marker strokes. Flat paper texture. High contrast monochrome artwork. Raw animation-production feel. Every frame must look physically drawn on paper, not digitally rendered. Do not vectorize. Do not use smooth digital gradients, polished 3D shading, airbrushing, or clean vector lines.";

export const DEFAULT_NEGATIVE =
  "3D render, photorealism, digital airbrush, smooth gradients, vector art, clean CGI, glossy anime finish, plastic skin, inconsistent character identity, changing clothing, extra limbs, warped hands, flickering details, text, watermark";

// How the movement is distributed across the in-betweens.
const EASINGS = {
  Even: (t) => t,
  "Ease In": (t) => t * t,
  "Ease Out": (t) => 1 - (1 - t) * (1 - t),
  "Ease In / Out": (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  "Fast → Slow": (t) => Math.pow(t, 0.6),
  "Slow → Fast": (t) => Math.pow(t, 1.6),
};

/** How far the motion has travelled at in-between frame `index` (1-based). */
export function frameProgress(index, inBetweens, timing) {
  const raw = index / (inBetweens + 1);
  const ease = EASINGS[timing] || EASINGS.Even;
  return Math.min(1, Math.max(0, ease(raw)));
}

export function frameLabel(index, total) {
  if (index === 0) return "START";
  if (index === total - 1) return "END";
  return "INBETWEEN";
}

/** The documented request for the whole sequence. */
export function buildPayload({ settings, frameCount, fps, hasStart, hasEnd }) {
  return {
    task_type: "hand_drawn_motion_frame_generation",
    version: "1.0",
    start_frame: hasStart ? "<uploaded reference>" : null,
    end_frame: hasEnd ? "<uploaded reference>" : null,
    motion_instruction: settings.motion.trim(),
    in_between_frames: frameCount,
    fps,
    timing: settings.timing,
    camera: settings.camera,
    preserve: settings.preserve,
    style_lock: settings.styleLock.trim(),
    negative_prompt: settings.negative.trim(),
    output: {
      format: "png",
      sequence_order: "start_to_end",
      include_start_frame: true,
      include_end_frame: true,
    },
  };
}

/**
 * The prompt for one in-between frame. Position in the movement, the camera and
 * the locked drawing style are all spelled out so the frame lands between its
 * neighbours instead of being a standalone illustration.
 */
export function buildFramePrompt({ index, total, progress, settings }) {
  const pct = Math.round(progress * 100);
  const preserve = settings.preserve.length ? settings.preserve.join(", ") : "everything in the references";

  return [
    `Generate ONE in-between frame of a hand-drawn animation sequence: frame ${index} of ${total - 2} in-betweens, sitting between the START reference frame and the END reference frame.`,
    "",
    `MOTION: ${settings.motion.trim()}`,
    `MOTION PROGRESS: this frame is at ${pct}% of the movement (${settings.timing} timing).`,
    `CAMERA: ${settings.camera}.`,
    `MUST STAY IDENTICAL TO THE REFERENCES: ${preserve}.`,
    "",
    `DRAWING STYLE (locked — every frame in the sequence uses this): ${settings.styleLock.trim()}`,
    "",
    "This is one frame of a sequence, not a finished illustration. Keep the same character, linework, framing, shading and paper as the references, and change only what the motion at this point requires.",
    "",
    `DO NOT INCLUDE: ${settings.negative.trim()}`,
  ].join("\n");
}