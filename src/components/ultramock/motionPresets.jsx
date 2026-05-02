// Motion presets for the UltraMock timeline.
// Each preset returns an array of keyframes given a duration (in seconds).
// Keyframe shape: { t, rotX, rotY, scale }

export const MOTION_PRESETS = [
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
];