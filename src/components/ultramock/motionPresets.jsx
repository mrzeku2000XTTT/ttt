// Motion presets for the UltraMock timeline.
// Each preset returns an array of keyframes given a duration (in seconds)
// and optionally the starting position { x, y } of the selected device.
//
// Keyframe shape: { t, rotX, rotY, scale, x?, y? }
//   - rotX/rotY/scale are always animated (interpolated)
//   - x/y are optional — only animated when at least one keyframe in the
//     preset declares them. Otherwise the device stays at its current spot.

export const MOTION_PRESETS = [
  // ── Rotation / Scale only ────────────────────────────────────────────────
  {
    id: "spin",
    label: "360° Spin",
    desc: "Full Y rotation",
    build: (d) => [
      { t: 0,        rotX: 0, rotY: 0,    scale: 1 },
      { t: d * 0.5,  rotX: 0, rotY: 180,  scale: 1 },
      { t: d,        rotX: 0, rotY: 360,  scale: 1 },
    ],
  },
  {
    id: "tilt",
    label: "Hero Tilt",
    desc: "Subtle 3D tilt loop",
    build: (d) => [
      { t: 0,        rotX: 0,   rotY: 0,    scale: 1 },
      { t: d * 0.5,  rotX: -10, rotY: -22,  scale: 1.04 },
      { t: d,        rotX: 0,   rotY: 0,    scale: 1 },
    ],
  },
  {
    id: "pop",
    label: "Pop In",
    desc: "Bounce in from small",
    build: (d) => [
      { t: 0,        rotX: 0, rotY: 0, scale: 0.4 },
      { t: d * 0.6,  rotX: 0, rotY: 0, scale: 1.1 },
      { t: d,        rotX: 0, rotY: 0, scale: 1 },
    ],
  },
  {
    id: "float",
    label: "Float",
    desc: "Gentle scale breathing",
    build: (d) => [
      { t: 0,        rotX: 0, rotY: 0, scale: 1 },
      { t: d * 0.5,  rotX: 0, rotY: 0, scale: 1.06 },
      { t: d,        rotX: 0, rotY: 0, scale: 1 },
    ],
  },
  {
    id: "reveal",
    label: "Side Reveal",
    desc: "Rotate from edge",
    build: (d) => [
      { t: 0,        rotX: 0, rotY: -85, scale: 0.85 },
      { t: d * 0.7,  rotX: 0, rotY: 8,   scale: 1.02 },
      { t: d,        rotX: 0, rotY: 0,   scale: 1 },
    ],
  },
  {
    id: "flip",
    label: "Card Flip",
    desc: "Front-to-back flip",
    build: (d) => [
      { t: 0,        rotX: 0, rotY: 0,    scale: 1 },
      { t: d * 0.5,  rotX: 0, rotY: 90,   scale: 0.92 },
      { t: d,        rotX: 0, rotY: 180,  scale: 1 },
    ],
  },
  {
    id: "wobble",
    label: "Wobble",
    desc: "Playful side-to-side",
    build: (d) => [
      { t: 0,           rotX: 0, rotY: 0,   scale: 1 },
      { t: d * 0.25,    rotX: 0, rotY: -18, scale: 1 },
      { t: d * 0.5,     rotX: 0, rotY: 0,   scale: 1 },
      { t: d * 0.75,    rotX: 0, rotY: 18,  scale: 1 },
      { t: d,           rotX: 0, rotY: 0,   scale: 1 },
    ],
  },
  {
    id: "zoomin",
    label: "Zoom In",
    desc: "Cinematic push",
    build: (d) => [
      { t: 0, rotX: 0, rotY: 0, scale: 0.7 },
      { t: d, rotX: 0, rotY: 0, scale: 1.15 },
    ],
  },
  {
    id: "zoomout",
    label: "Zoom Out",
    desc: "Cinematic pull-back",
    build: (d) => [
      { t: 0, rotX: 0, rotY: 0, scale: 1.3 },
      { t: d, rotX: 0, rotY: 0, scale: 0.8 },
    ],
  },
  {
    id: "tilt-up",
    label: "Tilt Up",
    desc: "Lean back reveal",
    build: (d) => [
      { t: 0, rotX: 25, rotY: 0, scale: 0.95 },
      { t: d, rotX: 0,  rotY: 0, scale: 1 },
    ],
  },
  {
    id: "showcase",
    label: "Showcase",
    desc: "Slow showcase rotation",
    build: (d) => [
      { t: 0,        rotX: -8, rotY: -25, scale: 0.95 },
      { t: d * 0.5,  rotX: -4, rotY: 0,   scale: 1.05 },
      { t: d,        rotX: -8, rotY: 25,  scale: 0.95 },
    ],
  },
  {
    id: "shake",
    label: "Shake",
    desc: "Quick nervous shake",
    build: (d) => [
      { t: 0,           rotX: 0, rotY: 0,   scale: 1 },
      { t: d * 0.15,    rotX: 0, rotY: -6,  scale: 1 },
      { t: d * 0.3,     rotX: 0, rotY: 6,   scale: 1 },
      { t: d * 0.45,    rotX: 0, rotY: -4,  scale: 1 },
      { t: d * 0.6,     rotX: 0, rotY: 4,   scale: 1 },
      { t: d * 0.8,     rotX: 0, rotY: -2,  scale: 1 },
      { t: d,           rotX: 0, rotY: 0,   scale: 1 },
    ],
  },
  {
    id: "barrel",
    label: "Barrel Roll",
    desc: "Tumble on X axis",
    build: (d) => [
      { t: 0, rotX: 0,   rotY: 0, scale: 1 },
      { t: d, rotX: 360, rotY: 0, scale: 1 },
    ],
  },

  // ── Position / Frame movement ────────────────────────────────────────────
  {
    id: "slide-in-left",
    label: "Slide In ←",
    desc: "Frame flies in from the left",
    build: (d, start) => {
      const sy = start?.y ?? 50;
      const sx = start?.x ?? 50;
      return [
        { t: 0,         rotX: 0, rotY: 0, scale: 1, x: -20, y: sy },
        { t: d * 0.85,  rotX: 0, rotY: 0, scale: 1, x: sx + 3, y: sy },
        { t: d,         rotX: 0, rotY: 0, scale: 1, x: sx, y: sy },
      ];
    },
  },
  {
    id: "slide-in-right",
    label: "Slide In →",
    desc: "Frame flies in from the right",
    build: (d, start) => {
      const sy = start?.y ?? 50;
      const sx = start?.x ?? 50;
      return [
        { t: 0,         rotX: 0, rotY: 0, scale: 1, x: 120, y: sy },
        { t: d * 0.85,  rotX: 0, rotY: 0, scale: 1, x: sx - 3, y: sy },
        { t: d,         rotX: 0, rotY: 0, scale: 1, x: sx, y: sy },
      ];
    },
  },
  {
    id: "slide-up",
    label: "Slide Up ↑",
    desc: "Rises into place",
    build: (d, start) => {
      const sx = start?.x ?? 50;
      const sy = start?.y ?? 50;
      return [
        { t: 0,         rotX: 0, rotY: 0, scale: 1, x: sx, y: 120 },
        { t: d * 0.85,  rotX: 0, rotY: 0, scale: 1, x: sx, y: sy - 3 },
        { t: d,         rotX: 0, rotY: 0, scale: 1, x: sx, y: sy },
      ];
    },
  },
  {
    id: "drop-in",
    label: "Drop In ↓",
    desc: "Falls from above with bounce",
    build: (d, start) => {
      const sx = start?.x ?? 50;
      const sy = start?.y ?? 50;
      return [
        { t: 0,         rotX: 0, rotY: 0, scale: 1,    x: sx, y: -20 },
        { t: d * 0.7,   rotX: 0, rotY: 0, scale: 1.05, x: sx, y: sy + 3 },
        { t: d * 0.85,  rotX: 0, rotY: 0, scale: 0.97, x: sx, y: sy - 1 },
        { t: d,         rotX: 0, rotY: 0, scale: 1,    x: sx, y: sy },
      ];
    },
  },
  {
    id: "fly-across",
    label: "Fly Across",
    desc: "Crosses the canvas left → right",
    build: (d, start) => {
      const sy = start?.y ?? 50;
      return [
        { t: 0,        rotX: 0, rotY: -8,  scale: 0.9, x: -15, y: sy },
        { t: d * 0.5,  rotX: 0, rotY: 0,   scale: 1.05, x: 50,  y: sy },
        { t: d,        rotX: 0, rotY: 8,   scale: 0.9, x: 115, y: sy },
      ];
    },
  },
  {
    id: "orbit",
    label: "Orbit",
    desc: "Circles around its origin",
    build: (d, start) => {
      const cx = start?.x ?? 50;
      const cy = start?.y ?? 50;
      const r = 18;
      const steps = 8;
      const out = [];
      for (let i = 0; i <= steps; i++) {
        const k = i / steps;
        const a = k * Math.PI * 2 - Math.PI / 2;
        out.push({
          t: d * k,
          rotX: 0,
          rotY: k * 360,
          scale: 1,
          x: cx + Math.cos(a) * r,
          y: cy + Math.sin(a) * r,
        });
      }
      return out;
    },
  },
  {
    id: "bounce",
    label: "Bounce",
    desc: "Hops up and down in place",
    build: (d, start) => {
      const sx = start?.x ?? 50;
      const sy = start?.y ?? 50;
      return [
        { t: 0,        rotX: 0, rotY: 0, scale: 1,    x: sx, y: sy },
        { t: d * 0.25, rotX: 0, rotY: 0, scale: 0.96, x: sx, y: sy - 12 },
        { t: d * 0.5,  rotX: 0, rotY: 0, scale: 1,    x: sx, y: sy },
        { t: d * 0.75, rotX: 0, rotY: 0, scale: 0.96, x: sx, y: sy - 8 },
        { t: d,        rotX: 0, rotY: 0, scale: 1,    x: sx, y: sy },
      ];
    },
  },
  {
    id: "pendulum",
    label: "Pendulum",
    desc: "Swings left ↔ right",
    build: (d, start) => {
      const sx = start?.x ?? 50;
      const sy = start?.y ?? 50;
      return [
        { t: 0,        rotX: 0, rotY: 0,   scale: 1, x: sx,      y: sy },
        { t: d * 0.25, rotX: 0, rotY: -10, scale: 1, x: sx - 14, y: sy },
        { t: d * 0.5,  rotX: 0, rotY: 0,   scale: 1, x: sx,      y: sy },
        { t: d * 0.75, rotX: 0, rotY: 10,  scale: 1, x: sx + 14, y: sy },
        { t: d,        rotX: 0, rotY: 0,   scale: 1, x: sx,      y: sy },
      ];
    },
  },
  {
    id: "zigzag",
    label: "Zig-Zag",
    desc: "Snakes across the canvas",
    build: (d, start) => {
      const sy = start?.y ?? 50;
      return [
        { t: 0,        rotX: 0, rotY: 0, scale: 1, x: -10, y: sy },
        { t: d * 0.25, rotX: 0, rotY: 0, scale: 1, x: 25,  y: sy - 12 },
        { t: d * 0.5,  rotX: 0, rotY: 0, scale: 1, x: 50,  y: sy + 10 },
        { t: d * 0.75, rotX: 0, rotY: 0, scale: 1, x: 75,  y: sy - 12 },
        { t: d,        rotX: 0, rotY: 0, scale: 1, x: 110, y: sy },
      ];
    },
  },
  {
    id: "swoop",
    label: "Swoop In",
    desc: "Curves in from top-left",
    build: (d, start) => {
      const sx = start?.x ?? 50;
      const sy = start?.y ?? 50;
      return [
        { t: 0,        rotX: -15, rotY: -25, scale: 0.6, x: -10,    y: -10 },
        { t: d * 0.6,  rotX: 0,   rotY: 5,   scale: 1.1, x: sx + 3, y: sy + 2 },
        { t: d,        rotX: 0,   rotY: 0,   scale: 1,   x: sx,     y: sy },
      ];
    },
  },
];