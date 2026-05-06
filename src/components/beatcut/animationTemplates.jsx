export const ANIMATION_TEMPLATES = [
  {
    id: "viral-punch",
    name: "Viral Punch",
    description: "Fast zooms, shake hits, bright flashes.",
    accent: "from-fuchsia-500 to-orange-400",
    effects: ["punch", "flash", "shake", "zoom", "punch", "neon", "shake", "flash", "zoom", "punch"],
  },
  {
    id: "cinematic-glow",
    name: "Cinematic Glow",
    description: "Smooth motion, neon glow, polished reveal.",
    accent: "from-amber-400 to-fuchsia-500",
    effects: ["zoom", "zoom", "neon", "punch", "zoom", "flash", "neon", "zoom", "punch", "zoom"],
  },
  {
    id: "glitch-energy",
    name: "Glitch Energy",
    description: "Aggressive shake and neon effect cuts.",
    accent: "from-cyan-400 to-violet-500",
    effects: ["shake", "neon", "flash", "shake", "punch", "neon", "shake", "flash", "neon", "punch"],
  },
  {
    id: "clean-product",
    name: "Clean Product",
    description: "Simple zooms and polished flashes for images/products.",
    accent: "from-emerald-300 to-cyan-400",
    effects: ["zoom", "punch", "zoom", "flash", "zoom", "punch", "zoom", "neon", "zoom", "flash"],
  },
];

export const DEFAULT_TEMPLATE_ID = "viral-punch";

export function getAnimationTemplate(id) {
  return ANIMATION_TEMPLATES.find((template) => template.id === id) || ANIMATION_TEMPLATES[0];
}

export function applyAnimationTemplate(plan, template) {
  if (!plan || !template) return plan;
  return {
    ...plan,
    template_id: template.id,
    template_name: template.name,
    effects: plan.effects.map((segment, index) => ({
      ...segment,
      effect: template.effects[index % template.effects.length],
    })),
  };
}

export function buildStaticImagePlan(duration = 10) {
  return {
    duration,
    samples: Array.from({ length: duration * 4 }, (_, index) => ({
      t: Number((index * 0.25).toFixed(2)),
      brightness: 128,
      motion: 0,
    })),
    effects: Array.from({ length: duration }, (_, index) => ({
      start: index,
      end: index + 1,
      effect: "zoom",
      motion: 0,
      brightness: 128,
    })),
  };
}