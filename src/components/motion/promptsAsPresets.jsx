// Adapter: convert WEBSITE_PROMPTS (Prompt Library entries) into preset-shaped objects
// so they appear inside the Preset Marketplace alongside the curated presets.
import { WEBSITE_PROMPTS } from "@/components/motion/websitePrompts";

// High-end cinematic header — same energy as the default Orbis preset
// Prepended so output quality stays consistent when picked from marketplace
const HIGH_END_HEADER = (title) => `# ${title}

You are building a HIGH-END, motion-rich, agency-grade landing page. Match the cinematic energy of premium NFT / luxury brand sites:
- Background looping video or animated gradient mesh in the hero
- Layered scroll-triggered reveals via IntersectionObserver
- Mouse-tracking parallax / spotlight on hero
- Floating decorative orbs, animated SVG paths, particle dots
- Liquid glass / backdrop-blur layered cards
- Rich hover micro-interactions (lift, glow, shimmer, icon slide)
- Animated count-up numbers on stats
- Marquee scrolls where appropriate
- Custom @keyframes for floating, pulsing, shimmer, gradient shifts
- Inject Google Fonts via useEffect
- Pixel-faithful AND animation-faithful — every section must feel alive

`;

// Per-prompt AI-generated previews (matched to each prompt's spec)
const PREVIEW_BY_ID = {
  "ecom-luxury-perfume": "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/84dd7bfc2_generated_image.png",
  "ecom-skincare":       "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/4d1d77ef3_generated_image.png",
  "ad-streetwear":       "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/234c4e07c_generated_image.png",
  "ad-watch":            "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/c321e92b7_generated_image.png",
  "editorial-magazine":  "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/dc98e95cd_generated_image.png",
  "ui-saas-dashboard":   "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/a8fd54e90_generated_image.png",
  "ui-livestream":       "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/1d756f0f3_generated_image.png",
  "brand-mascot":        "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/1a0f25b0e_generated_image.png",
  "event-conference":    "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/d9f75af87_generated_image.png",
  "comparison-vs":       "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/a6f59d8b8_generated_image.png",
};

const ACCENT_BY_CATEGORY = {
  "E-commerce": "from-amber-400 to-rose-500",
  "Ad Creative": "from-rose-500 to-orange-400",
  "Editorial": "from-stone-300 to-rose-400",
  "SaaS": "from-violet-500 to-cyan-400",
  "Brand": "from-yellow-400 to-pink-500",
  "Event": "from-blue-500 to-emerald-400",
  "Comparison": "from-emerald-500 to-zinc-500",
};

export const PROMPT_LIBRARY_AS_PRESETS = WEBSITE_PROMPTS.map((p) => ({
  id: `lib-${p.id}`,
  name: p.title,
  tagline: p.tagline,
  category: p.category,
  vibe: `${p.case} · ${p.author}`,
  accent: ACCENT_BY_CATEGORY[p.category] || "from-cyan-400 to-purple-500",
  preview: PREVIEW_BY_ID[p.id] || "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=800&q=70",
  prompt: HIGH_END_HEADER(p.title) + p.prompt,
  fromLibrary: true,
}));