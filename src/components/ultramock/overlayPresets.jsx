// Library of overlay preset SVGs. Each preset returns a self-contained SVG
// string sized to fit a 1:1 viewBox (or wider for buttons). The OverlayLayer
// just drops the SVG markup inside a sized container.
//
// Categories: "arrows", "shapes", "buttons", "badges", "ui"

export const OVERLAY_PRESETS = [
  // ── Arrows ───────────────────────────────────────────────────────────────
  {
    id: "arrow-right",
    label: "Arrow →",
    category: "arrows",
    defaultW: 160,
    defaultH: 60,
    color: "#ffffff",
    svg: (c) => `<svg viewBox="0 0 160 60" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <path d="M10 30 L130 30 M115 12 L135 30 L115 48" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: "arrow-left",
    label: "Arrow ←",
    category: "arrows",
    defaultW: 160,
    defaultH: 60,
    color: "#ffffff",
    svg: (c) => `<svg viewBox="0 0 160 60" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <path d="M150 30 L30 30 M45 12 L25 30 L45 48" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: "arrow-curved",
    label: "Curved Arrow",
    category: "arrows",
    defaultW: 180,
    defaultH: 140,
    color: "#fbbf24",
    svg: (c) => `<svg viewBox="0 0 180 140" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <path d="M20 110 Q 40 20 150 50" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round"/>
      <path d="M135 30 L155 50 L130 60" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: "arrow-down",
    label: "Arrow ↓",
    category: "arrows",
    defaultW: 60,
    defaultH: 160,
    color: "#22d3ee",
    svg: (c) => `<svg viewBox="0 0 60 160" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <path d="M30 10 L30 130 M12 115 L30 135 L48 115" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },

  // ── Shapes ───────────────────────────────────────────────────────────────
  {
    id: "circle-ring",
    label: "Circle Ring",
    category: "shapes",
    defaultW: 140,
    defaultH: 140,
    color: "#f472b6",
    svg: (c) => `<svg viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <circle cx="70" cy="70" r="60" fill="none" stroke="${c}" stroke-width="6"/>
    </svg>`,
  },
  {
    id: "circle-filled",
    label: "Dot",
    category: "shapes",
    defaultW: 80,
    defaultH: 80,
    color: "#ef4444",
    svg: (c) => `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <circle cx="40" cy="40" r="32" fill="${c}"/>
    </svg>`,
  },
  {
    id: "rect-highlight",
    label: "Highlight Box",
    category: "shapes",
    defaultW: 200,
    defaultH: 100,
    color: "#fbbf24",
    svg: (c) => `<svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect x="6" y="6" width="188" height="88" rx="14" fill="none" stroke="${c}" stroke-width="6" stroke-dasharray="10 8"/>
    </svg>`,
  },
  {
    id: "star",
    label: "Star",
    category: "shapes",
    defaultW: 100,
    defaultH: 100,
    color: "#fde047",
    svg: (c) => `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <polygon points="50,5 61,38 96,38 68,59 78,93 50,72 22,93 32,59 4,38 39,38" fill="${c}" stroke="rgba(0,0,0,0.2)" stroke-width="2"/>
    </svg>`,
  },

  // ── Buttons ──────────────────────────────────────────────────────────────
  {
    id: "btn-primary",
    label: "Tap Button",
    category: "buttons",
    defaultW: 220,
    defaultH: 70,
    color: "#06b6d4",
    svg: (c) => `<svg viewBox="0 0 220 70" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect x="2" y="2" width="216" height="66" rx="33" fill="${c}"/>
      <text x="110" y="44" font-family="system-ui,-apple-system,sans-serif" font-size="22" font-weight="800" fill="white" text-anchor="middle">TAP HERE</text>
    </svg>`,
  },
  {
    id: "btn-cta",
    label: "Get Started",
    category: "buttons",
    defaultW: 240,
    defaultH: 70,
    color: "#f97316",
    svg: (c) => `<svg viewBox="0 0 240 70" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect x="2" y="2" width="236" height="66" rx="14" fill="${c}"/>
      <text x="120" y="44" font-family="system-ui,-apple-system,sans-serif" font-size="22" font-weight="900" fill="white" text-anchor="middle">GET STARTED →</text>
    </svg>`,
  },
  {
    id: "btn-pill",
    label: "Outline Pill",
    category: "buttons",
    defaultW: 200,
    defaultH: 60,
    color: "#ffffff",
    svg: (c) => `<svg viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect x="3" y="3" width="194" height="54" rx="27" fill="none" stroke="${c}" stroke-width="3"/>
      <text x="100" y="38" font-family="system-ui,-apple-system,sans-serif" font-size="18" font-weight="700" fill="${c}" text-anchor="middle">LEARN MORE</text>
    </svg>`,
  },

  // ── Badges ───────────────────────────────────────────────────────────────
  {
    id: "badge-new",
    label: "NEW Badge",
    category: "badges",
    defaultW: 110,
    defaultH: 110,
    color: "#ef4444",
    svg: (c) => `<svg viewBox="0 0 110 110" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <circle cx="55" cy="55" r="50" fill="${c}" stroke="white" stroke-width="4"/>
      <text x="55" y="63" font-family="system-ui,-apple-system,sans-serif" font-size="22" font-weight="900" fill="white" text-anchor="middle">NEW</text>
    </svg>`,
  },
  {
    id: "badge-free",
    label: "FREE Badge",
    category: "badges",
    defaultW: 110,
    defaultH: 110,
    color: "#10b981",
    svg: (c) => `<svg viewBox="0 0 110 110" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <circle cx="55" cy="55" r="50" fill="${c}" stroke="white" stroke-width="4"/>
      <text x="55" y="63" font-family="system-ui,-apple-system,sans-serif" font-size="22" font-weight="900" fill="white" text-anchor="middle">FREE</text>
    </svg>`,
  },
  {
    id: "badge-percent",
    label: "50% OFF",
    category: "badges",
    defaultW: 130,
    defaultH: 130,
    color: "#f59e0b",
    svg: (c) => `<svg viewBox="0 0 130 130" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <polygon points="65,5 80,25 105,20 100,45 125,55 105,75 115,100 90,100 80,125 65,105 50,125 40,100 15,100 25,75 5,55 30,45 25,20 50,25" fill="${c}"/>
      <text x="65" y="73" font-family="system-ui,-apple-system,sans-serif" font-size="22" font-weight="900" fill="white" text-anchor="middle">50% OFF</text>
    </svg>`,
  },

  // ── UI ───────────────────────────────────────────────────────────────────
  {
    id: "tap-pulse",
    label: "Tap Indicator",
    category: "ui",
    defaultW: 100,
    defaultH: 100,
    color: "#22d3ee",
    svg: (c) => `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <circle cx="50" cy="50" r="45" fill="none" stroke="${c}" stroke-width="3" opacity="0.4"/>
      <circle cx="50" cy="50" r="30" fill="none" stroke="${c}" stroke-width="4" opacity="0.7"/>
      <circle cx="50" cy="50" r="14" fill="${c}"/>
    </svg>`,
  },
  {
    id: "speech-bubble",
    label: "Speech Bubble",
    category: "ui",
    defaultW: 200,
    defaultH: 130,
    color: "#ffffff",
    svg: (c) => `<svg viewBox="0 0 200 130" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <path d="M20 10 L180 10 Q190 10 190 20 L190 80 Q190 90 180 90 L70 90 L40 120 L50 90 L20 90 Q10 90 10 80 L10 20 Q10 10 20 10 Z" fill="${c}" stroke="rgba(0,0,0,0.15)" stroke-width="2"/>
    </svg>`,
  },
  {
    id: "checkmark",
    label: "Check ✓",
    category: "ui",
    defaultW: 100,
    defaultH: 100,
    color: "#10b981",
    svg: (c) => `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <circle cx="50" cy="50" r="45" fill="${c}"/>
      <path d="M28 52 L44 68 L72 36" fill="none" stroke="white" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
];

export const OVERLAY_CATEGORIES = [
  { id: "all", label: "All" },
  { id: "arrows", label: "Arrows" },
  { id: "shapes", label: "Shapes" },
  { id: "buttons", label: "Buttons" },
  { id: "badges", label: "Badges" },
  { id: "ui", label: "UI" },
];