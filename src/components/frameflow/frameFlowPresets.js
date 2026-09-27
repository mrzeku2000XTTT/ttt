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
 * The prompt for one in-between frame.
 *
 * `roles` names the attached images in order, and `before`/`after` say what the
 * frames on either side of this one are — including the END reference the
 * sequence has to land on. A frame that knows both of its neighbours and how far
 * it is from the end stops drifting.
 */
export function buildFramePrompt({ index, count, progress, settings, roles, base }) {
  const pct = Math.round(progress * 100);
  const remaining = count - index + 1;
  const preserve = settings.preserve.length ? settings.preserve.join(", ") : "everything in the references";

  return [
    "Redraw the image you are given to make ONE in-between frame of a hand-drawn animation sequence.",
    "",
    `THE IMAGE YOU ARE EDITING IS ${base}. Treat that image as the drawing itself, not as inspiration: keep the character, the character's design, the proportions, the linework, the shading, the paper and the framing exactly as they are, and advance the pose by a single step. Never redraw the character from scratch and never substitute a different drawing.`,
    "",
    (roles || []).length ? `EXTRA REFERENCE IMAGES, IN THIS ORDER: ${roles.join("; ")}.` : "",
    `SEQUENCE: this is in-between ${index} of ${count}. The whole sequence is the START reference, ${count} in-betweens, and the END reference it must land on.`,
    `MOTION: ${settings.motion.trim()}`,
    `POSITION IN THE MOVEMENT: ${pct}% of the way from the START reference to the END reference (${settings.timing} timing).`,
    `ENDPOINT: the sequence finishes exactly on the END reference frame — this frame is ${remaining} step${
      remaining === 1 ? "" : "s"
    } away from it.`,
    `CAMERA: ${settings.camera}.`,
    `MUST STAY IDENTICAL: ${preserve}.`,
    "",
    `DRAWING STYLE (locked — every frame in the sequence uses this): ${settings.styleLock.trim()}`,
    "",
    `DO NOT INCLUDE: ${settings.negative.trim()}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * The order the in-betweens are drawn in: outward from both references at once,
 * meeting in the middle. Every frame next to a reference is generated with that
 * reference as its direct neighbour, so the sequence opens on the start frame and
 * lands on the end frame instead of drifting away from both.
 */
export function generationOrder(count) {
  const order = [];
  for (let step = 1; step <= Math.floor(count / 2); step += 1) {
    order.push({ index: step, from: "start" });
    order.push({ index: count - step + 1, from: "end" });
  }
  if (count % 2 === 1) order.push({ index: Math.ceil(count / 2), from: "middle" });
  return order;
}