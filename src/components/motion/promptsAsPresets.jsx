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

// Category → unsplash preview thumbnail
const PREVIEW_BY_CATEGORY = {
  "E-commerce": "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=70",
  "Ad Creative": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=70",
  "Editorial": "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=800&q=70",
  "SaaS": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=70",
  "Brand": "https://images.unsplash.com/photo-1561070791-2526d30994b8?w=800&q=70",
  "Event": "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&q=70",
  "Comparison": "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=70",
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
  preview: PREVIEW_BY_CATEGORY[p.category] || "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=800&q=70",
  prompt: HIGH_END_HEADER(p.title) + p.prompt,
  fromLibrary: true,
}));