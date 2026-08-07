// Material presets — PBR properties applied to 3D objects
export const MATERIALS = [
  { id: 'metal', name: 'Metal', color: '#c0c0c0', metalness: 1.0, roughness: 0.15 },
  { id: 'carbon', name: 'Carbon Steel', color: '#2a2a2a', metalness: 0.9, roughness: 0.35 },
  { id: 'treated', name: 'Metal Treated', color: '#6b7280', metalness: 0.85, roughness: 0.25 },
  { id: 'sheet', name: 'Metal Sheet', color: '#9ca3af', metalness: 0.95, roughness: 0.4 },
  { id: 'gold', name: 'Pure Gold', color: '#ffd700', metalness: 1.0, roughness: 0.1 },
  { id: 'snow', name: 'Windswept Snow', color: '#f0f4f8', metalness: 0.0, roughness: 0.9 },
  { id: 'clay', name: 'Pottery Clay', color: '#c19a6b', metalness: 0.0, roughness: 0.85 },
  { id: 'sand', name: 'Kinetic Sand', color: '#d4a76a', metalness: 0.0, roughness: 0.95 },
  { id: 'fiberboard', name: 'Wooden Fiberboard', color: '#8b6f47', metalness: 0.0, roughness: 0.8 },
  { id: 'osb', name: 'OSB', color: '#a08050', metalness: 0.0, roughness: 0.85 },
  { id: 'wood', name: 'Wood', color: '#6b4e2e', metalness: 0.0, roughness: 0.75 },
  { id: 'lavender', name: 'Lavender Coating', color: '#9d8bbf', metalness: 0.1, roughness: 0.5 },
  { id: 'wax', name: 'Candle Wax', color: '#f5e6d3', metalness: 0.0, roughness: 0.6 },
  { id: 'rubber', name: 'Rubber Band', color: '#e85d5d', metalness: 0.0, roughness: 0.7 },
];

// Environment presets — HDRI-like lighting setups
export const ENVIRONMENTS = [
  { id: 'studio', name: 'Studio', bg: '#1a1a1a', light: 0xffffff, intensity: 1.2 },
  { id: 'contrast', name: 'High-Contrast', bg: '#0a0a0a', light: 0xffffff, intensity: 2.5 },
  { id: 'metals', name: 'Metals', bg: '#1a1a2e', light: 0x88aaff, intensity: 1.8 },
  { id: 'lightboxes', name: 'Overhead Lightboxes', bg: '#222', light: 0xffffff, intensity: 2.0 },
  { id: 'product', name: 'Product Set', bg: '#2a2a2a', light: 0xffeedd, intensity: 1.5 },
];

// Backdrop presets — rendered behind the 3D object
export const BACKDROPS = [
  { id: 'transparent', name: 'Transparent', type: 'transparent' },
  { id: 'gradient', name: 'Gradient Fade', type: 'gradient', color1: '#1a1a1a', color2: '#0a0a0a' },
  { id: 'platform', name: 'Platform', type: 'platform', color: '#2a2a2a' },
  { id: 'heat', name: 'Heat', type: 'radial', color1: '#ff4400', color2: '#0a0a0a' },
  { id: 'spotlight', name: 'Direct Spotlight', type: 'spotlight', color: '#1a1a1a' },
  { id: 'pedestal', name: 'Pedestal', type: 'platform', color: '#3a3a3a' },
  { id: 'beam', name: 'Beam', type: 'beam', color1: '#ffffff', color2: '#0a0a0a' },
  { id: 'product', name: 'Product shot', type: 'gradient', color1: '#2a2a2a', color2: '#1a1a1a' },
  { id: 'halo', name: 'Halo', type: 'radial', color1: '#4488ff', color2: '#0a0a0a' },
];

// Typeface presets
export const TYPEFACES = [
  { id: 'tex', name: 'TeX Condensed', family: 'Arial Narrow, sans-serif', weight: 700 },
  { id: 'instrument', name: 'Instrument', family: 'Georgia, serif', weight: 400 },
  { id: 'trickster', name: 'Trickster', family: 'Comic Sans MS, cursive', weight: 700 },
  { id: 'basteleur', name: 'Basteleur', family: 'Brush Script MT, cursive', weight: 400 },
  { id: 'inter', name: 'Inter Black', family: 'Inter, system-ui, sans-serif', weight: 900 },
  { id: 'youngserif', name: 'Young Serif', family: 'Times New Roman, serif', weight: 700 },
  { id: 'picnic', name: 'PicNic', family: 'Courier New, monospace', weight: 700 },
  { id: 'heal', name: 'Heal The Web', family: 'Verdana, sans-serif', weight: 400 },
  { id: 'saint', name: 'Saint', family: 'Palatino, serif', weight: 700 },
  { id: 'tiny', name: 'Tiny', family: 'Arial, sans-serif', weight: 300 },
  { id: 'junicode', name: 'Junicode', family: 'Garamond, serif', weight: 400 },
  { id: 'geistmono', name: 'Geist Mono', family: 'Courier New, monospace', weight: 500 },
  { id: 'leimzy', name: 'Leimzy', family: 'Impact, sans-serif', weight: 400 },
];

// Shape presets — extruded 2D shapes
export const SHAPES = [
  { id: 'none', name: 'Remove Shape' },
  { id: 'petals', name: 'Petals' },
  { id: 'twin', name: 'Twin Shadows' },
  { id: 'biotic', name: 'Biotic Mirror' },
  { id: 'star', name: 'Star' },
  { id: 'heart', name: 'Heart' },
  { id: 'hex', name: 'Hexagon' },
  { id: 'circle', name: 'Circle' },
  { id: 'square', name: 'Square' },
  { id: 'triangle', name: 'Triangle' },
  { id: 'diamond', name: 'Diamond' },
  { id: 'ring', name: 'Ring' },
];

// Quick start tool presets
export const QUICK_START_TOOLS = [
  { id: 'mockups', name: '3D Mockups', desc: 'Place images or videos', icon: '🖼️' },
  { id: 'motion', name: '3D Motion Templates', desc: 'Animate your content in seconds', icon: '🎬' },
  { id: 'shapes', name: '3D Icons & Shapes', desc: 'Can be combined with Text', icon: '✨' },
  { id: 'text', name: '3D Text & Logos', desc: 'Can be combined with Shapes', icon: '🔤' },
];