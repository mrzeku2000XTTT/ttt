// Camera motion presets — animate the whole preview like a real motion camera.
// Each preset returns an array of camera keyframes: { t, zoom, x, y }
// where x/y are the FOCUS POINT in canvas % (50,50 = center) and zoom is the scale.
//
// `target` (optional) is the focus point of the currently-selected item passed in
// as { x, y } in canvas %. Presets that "zoom to target" use it; others ignore it.

export const CAMERA_PRESETS = [
  {
    id: "cam_dolly_in",
    label: "Dolly In",
    desc: "Push in toward the center",
    build: (dur, target) => {
      const fx = target?.x ?? 50;
      const fy = target?.y ?? 50;
      return [
        { t: 0,       zoom: 1,    x: 50, y: 50 },
        { t: dur,     zoom: 1.8,  x: fx, y: fy },
      ];
    },
  },
  {
    id: "cam_zoom_to_target",
    label: "Zoom to Target",
    desc: "Zoom in tight on the selected item",
    build: (dur, target) => {
      const fx = target?.x ?? 50;
      const fy = target?.y ?? 50;
      return [
        { t: 0,       zoom: 1,    x: 50, y: 50 },
        { t: dur * 0.7, zoom: 2.2, x: fx, y: fy },
        { t: dur,     zoom: 2.2,  x: fx, y: fy },
      ];
    },
  },
  {
    id: "cam_pull_back",
    label: "Pull Back",
    desc: "Reveal — start tight, zoom out",
    build: (dur, target) => {
      const fx = target?.x ?? 50;
      const fy = target?.y ?? 50;
      return [
        { t: 0,       zoom: 2.2,  x: fx, y: fy },
        { t: dur,     zoom: 1,    x: 50, y: 50 },
      ];
    },
  },
  {
    id: "cam_pan_lr",
    label: "Pan L→R",
    desc: "Horizontal pan across the canvas",
    build: (dur) => [
      { t: 0,       zoom: 1.3, x: 25, y: 50 },
      { t: dur,     zoom: 1.3, x: 75, y: 50 },
    ],
  },
  {
    id: "cam_pan_rl",
    label: "Pan R→L",
    desc: "Horizontal pan, right to left",
    build: (dur) => [
      { t: 0,       zoom: 1.3, x: 75, y: 50 },
      { t: dur,     zoom: 1.3, x: 25, y: 50 },
    ],
  },
  {
    id: "cam_orbit",
    label: "Orbit",
    desc: "Circle around the focus point",
    build: (dur, target) => {
      const fx = target?.x ?? 50;
      const fy = target?.y ?? 50;
      const r = 12;
      return [
        { t: 0,         zoom: 1.4, x: fx - r, y: fy },
        { t: dur * 0.25, zoom: 1.4, x: fx,     y: fy - r },
        { t: dur * 0.5,  zoom: 1.4, x: fx + r, y: fy },
        { t: dur * 0.75, zoom: 1.4, x: fx,     y: fy + r },
        { t: dur,       zoom: 1.4, x: fx - r, y: fy },
      ];
    },
  },
  {
    id: "cam_punch_in",
    label: "Punch In",
    desc: "Snap zoom — quick & dramatic",
    build: (dur, target) => {
      const fx = target?.x ?? 50;
      const fy = target?.y ?? 50;
      return [
        { t: 0,             zoom: 1,   x: 50, y: 50 },
        { t: dur * 0.6,     zoom: 1,   x: 50, y: 50 },
        { t: dur * 0.7,     zoom: 1.9, x: fx, y: fy },
        { t: dur,           zoom: 1.9, x: fx, y: fy },
      ];
    },
  },
  {
    id: "cam_handheld",
    label: "Handheld",
    desc: "Subtle drift — natural feel",
    build: (dur) => [
      { t: 0,         zoom: 1.15, x: 49, y: 51 },
      { t: dur * 0.3, zoom: 1.18, x: 51, y: 49 },
      { t: dur * 0.6, zoom: 1.12, x: 50, y: 52 },
      { t: dur,       zoom: 1.15, x: 49, y: 50 },
    ],
  },
];