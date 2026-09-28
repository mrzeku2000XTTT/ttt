// TALKSTICK stickman library.
//
// Ten ready-made characters, each caught mid-action. Every pose is just a set of
// joints in figure units — 1 is the full height and x = 0 is the body's centre
// line — so one renderer draws them all and each one can be measured and scaled
// to fill whatever stage it lands on.

const HEAD_R = 0.095;
const INK = "#0b0d10";

const POSES = [
  {
    id: "wave",
    label: "Wave",
    hint: "Standing, one arm raised mid-wave",
    head: [0, 0.1],
    neck: [0, 0.215],
    hip: [0, 0.55],
    arms: [
      { elbow: [-0.19, 0.33], hand: [-0.24, 0.5] },
      { elbow: [0.21, 0.3], hand: [0.34, 0.09] },
    ],
    legs: [
      { knee: [-0.09, 0.76], foot: [-0.14, 0.97] },
      { knee: [0.09, 0.76], foot: [0.14, 0.97] },
    ],
  },
  {
    id: "walk",
    label: "Walk",
    hint: "Mid-stride with the arms swinging",
    head: [0, 0.1],
    neck: [0, 0.215],
    hip: [0, 0.55],
    arms: [
      { elbow: [-0.14, 0.36], hand: [-0.24, 0.49] },
      { elbow: [0.15, 0.34], hand: [0.26, 0.45] },
    ],
    legs: [
      { knee: [-0.13, 0.72], foot: [-0.28, 0.94] },
      { knee: [0.12, 0.75], foot: [0.22, 0.97] },
    ],
  },
  {
    id: "run",
    label: "Run",
    hint: "Sprinting, leaning into the stride",
    head: [0.11, 0.1],
    neck: [0.06, 0.215],
    hip: [-0.02, 0.55],
    arms: [
      { elbow: [0.22, 0.28], hand: [0.34, 0.15] },
      { elbow: [-0.17, 0.35], hand: [-0.27, 0.47] },
    ],
    legs: [
      { knee: [0.18, 0.68], foot: [0.38, 0.78] },
      { knee: [-0.15, 0.74], foot: [-0.36, 0.96] },
    ],
  },
  {
    id: "jump",
    label: "Jump",
    hint: "Airborne with both arms thrown up",
    head: [0, 0.09],
    neck: [0, 0.205],
    hip: [0, 0.53],
    arms: [
      { elbow: [-0.19, 0.26], hand: [-0.3, 0.05] },
      { elbow: [0.19, 0.26], hand: [0.3, 0.05] },
    ],
    legs: [
      { knee: [-0.15, 0.68], foot: [-0.21, 0.87] },
      { knee: [0.15, 0.68], foot: [0.21, 0.87] },
    ],
  },
  {
    id: "dance",
    label: "Dance",
    hint: "Hip out, one arm up and one reaching out",
    head: [0.07, 0.11],
    neck: [0.04, 0.22],
    hip: [-0.03, 0.55],
    arms: [
      { elbow: [0.21, 0.29], hand: [0.33, 0.12] },
      { elbow: [-0.21, 0.33], hand: [-0.36, 0.25] },
    ],
    legs: [
      { knee: [-0.19, 0.74], foot: [-0.27, 0.97] },
      { knee: [0.11, 0.76], foot: [0.23, 0.95] },
    ],
  },
  {
    id: "point",
    label: "Point",
    hint: "One arm out, pointing the way",
    head: [0, 0.1],
    neck: [0, 0.215],
    hip: [0, 0.55],
    arms: [
      { elbow: [0.18, 0.3], hand: [0.44, 0.22] },
      { elbow: [-0.16, 0.36], hand: [-0.07, 0.51] },
    ],
    legs: [
      { knee: [-0.09, 0.76], foot: [-0.13, 0.97] },
      { knee: [0.09, 0.76], foot: [0.13, 0.97] },
    ],
  },
  {
    id: "think",
    label: "Think",
    hint: "Hand to the chin, other arm folded",
    head: [0.03, 0.1],
    neck: [0, 0.215],
    hip: [0, 0.55],
    arms: [
      { elbow: [0.17, 0.35], hand: [0.07, 0.17] },
      { elbow: [-0.17, 0.36], hand: [-0.02, 0.45] },
    ],
    legs: [
      { knee: [-0.09, 0.76], foot: [-0.13, 0.97] },
      { knee: [0.09, 0.76], foot: [0.13, 0.97] },
    ],
  },
  {
    id: "sit",
    label: "Sit",
    hint: "Seated, knees up, hands back for support",
    head: [0, 0.19],
    neck: [0, 0.3],
    hip: [0, 0.63],
    arms: [
      { elbow: [-0.17, 0.45], hand: [-0.28, 0.65] },
      { elbow: [0.17, 0.45], hand: [0.28, 0.65] },
    ],
    legs: [
      { knee: [-0.26, 0.6], foot: [-0.31, 0.9] },
      { knee: [0.26, 0.6], foot: [0.31, 0.9] },
    ],
  },
  {
    id: "kick",
    label: "Kick",
    hint: "One leg swung out, arms balancing",
    head: [-0.05, 0.1],
    neck: [-0.02, 0.215],
    hip: [0.02, 0.55],
    arms: [
      { elbow: [-0.23, 0.31], hand: [-0.36, 0.21] },
      { elbow: [0.19, 0.35], hand: [0.29, 0.47] },
    ],
    legs: [
      { knee: [0.26, 0.6], foot: [0.52, 0.55] },
      { knee: [-0.1, 0.76], foot: [-0.15, 0.97] },
    ],
  },
  {
    id: "cheer",
    label: "Cheer",
    hint: "Both arms up in a victory V",
    head: [0, 0.09],
    neck: [0, 0.205],
    hip: [0, 0.55],
    arms: [
      { elbow: [-0.2, 0.24], hand: [-0.31, 0.02] },
      { elbow: [0.2, 0.24], hand: [0.31, 0.02] },
    ],
    legs: [
      { knee: [-0.14, 0.74], foot: [-0.25, 0.97] },
      { knee: [0.14, 0.74], foot: [0.25, 0.97] },
    ],
  },
];

export const STICKMEN = POSES.map(({ id, label, hint }) => ({ id, label, hint }));

const poseById = (id) => POSES.find((pose) => pose.id === id) || POSES[0];

/** Every point a pose touches, plus the head's circle, so it can be measured first. */
function measure(pose) {
  const points = [pose.neck, pose.hip];
  pose.arms.forEach((arm) => points.push(arm.elbow, arm.hand));
  pose.legs.forEach((leg) => points.push(leg.knee, leg.foot));

  const xs = points.map((p) => p[0]).concat([pose.head[0] - HEAD_R, pose.head[0] + HEAD_R]);
  const ys = points.map((p) => p[1]).concat([pose.head[1] - HEAD_R, pose.head[1] + HEAD_R]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return { minX, minY, w: Math.max(...xs) - minX, h: Math.max(...ys) - minY };
}

/**
 * Draws the pose centred and scaled so it fills the given box, then returns where
 * the head ended up — the studio uses that to land the face inside it.
 */
export function drawStickman(ctx, id, width, height) {
  const pose = poseById(id);
  const box = measure(pose);
  const margin = 0.055;
  const scale = Math.min((width * (1 - margin * 2)) / box.w, (height * (1 - margin * 2)) / box.h);
  const ox = width / 2 - (box.minX + box.w / 2) * scale;
  const oy = height / 2 - (box.minY + box.h / 2) * scale;
  const at = (p) => [p[0] * scale + ox, p[1] * scale + oy];

  ctx.save();
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(2, scale * 0.016);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const [hx, hy] = at(pose.head);
  const r = HEAD_R * scale;

  ctx.beginPath();
  ctx.arc(hx, hy, r, 0, Math.PI * 2);
  ctx.stroke();

  const [nx, ny] = at(pose.neck);
  const [px, py] = at(pose.hip);

  ctx.beginPath();
  ctx.moveTo(nx, ny);
  ctx.lineTo(px, py);
  ctx.stroke();

  pose.arms.forEach((arm) => {
    const [ex, ey] = at(arm.elbow);
    const [wx, wy] = at(arm.hand);
    ctx.beginPath();
    ctx.moveTo(nx, ny);
    ctx.lineTo(ex, ey);
    ctx.lineTo(wx, wy);
    ctx.stroke();
  });

  pose.legs.forEach((leg) => {
    const [kx, ky] = at(leg.knee);
    const [fx, fy] = at(leg.foot);
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(kx, ky);
    ctx.lineTo(fx, fy);
    ctx.stroke();
  });

  ctx.restore();

  return { cx: hx, cy: hy, r };
}

/**
 * A stickman as a drawing source, sized to the stage it will fill. The canvas is
 * used directly as the artwork, so the figure lands at full resolution.
 */
export function stickmanSource(id, width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext("2d");
  const head = drawStickman(ctx, id, canvas.width, canvas.height);
  return { source: canvas, head };
}