export const COLORS = {
  EMERALD: "#0a3a2d",
  EMERALD_DARK: "#072a22",
  CREAM: "#f4efdf",
  GOLD: "#b89a66",
  GOLD_BRIGHT: "#d4b878",
  CHARCOAL: "#2e2e2e",
  BLUE: "#4F46E5",
  BLUE_LIGHT: "#818cf8",
  CANVAS_BG: "#f5f5f5",
  PANEL_BG: "#ffffff",
  BORDER: "#e5e7eb",
  TEXT_DARK: "#1f2937",
  TEXT_MED: "#6b7280",
};

export const ELEMENT_TYPES = [
  { type: "heading", label: "Heading", defaultContent: "Your Heading", defaults: { width: 280, fontSize: 26, fontWeight: 700 } },
  { type: "text", label: "Text", defaultContent: "Your paragraph text goes here. Click to edit.", defaults: { width: 280, fontSize: 14, fontWeight: 400 } },
  { type: "button", label: "Button", defaultContent: "Get Started", defaults: { width: 140, fontSize: 14, fontWeight: 600 } },
  { type: "box", label: "Section", defaultContent: "", defaults: { width: 300, fontSize: 14, fontWeight: 400 } },
  { type: "image", label: "Image URL", defaultContent: "https://images.unsplash.com/photo-1557683316-ea9c9d4e6d70?w=400", defaults: { width: 250, fontSize: 14, fontWeight: 400 } },
  { type: "video", label: "Video URL", defaultContent: "", defaults: { width: 320, fontSize: 14, fontWeight: 400 } },
  { type: "html", label: "HTML Code", defaultContent: "<div style=\"padding:16px;font-family:sans-serif\"><h2>Hello!</h2><p>Edit this HTML.</p></div>", defaults: { width: 360, fontSize: 14, fontWeight: 400 } },
];

let idCounter = Date.now();
export function createElement(type, typeDef, overrides = {}) {
  return {
    id: `el-${idCounter++}`,
    type,
    x: 40 + Math.random() * 80,
    y: 40 + Math.random() * 80,
    content: typeDef.defaultContent,
    width: typeDef.defaults.width,
    fontSize: typeDef.defaults.fontSize,
    fontWeight: typeDef.defaults.fontWeight,
    color: COLORS.CHARCOAL,
    bg: type === 'button' ? COLORS.BLUE : type === 'box' ? '#f3f4f6' : 'transparent',
    mediaType: overrides.mediaType || (type === 'video' ? 'video' : 'image'),
    ...overrides,
  };
}

export function createPage(name = 'Page 1') {
  return {
    id: `page-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    elements: [],
  };
}