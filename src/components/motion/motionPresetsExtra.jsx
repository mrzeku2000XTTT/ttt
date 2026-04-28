// Motionsites.ai-inspired vibe-code presets — batch 1
// Each entry mirrors the MOTION_PRESETS shape so they can be merged in the marketplace.

export const MOTION_PRESETS_EXTRA = [
  {
    id: "velorah-agency",
    name: "Velorah",
    tagline: "Liquid-glass agency landing",
    category: "Agency",
    vibe: "Indigo gradient · Liquid glass · Inter Tight",
    accent: "from-indigo-400 to-fuchsia-400",
    preview: "https://motionsites.ai/assets/hero-velorah-poster-mLkXfzr9.png",
    prompt: `Create a high-end agency landing page called "Velorah" — a creative studio for ambitious founders. 4 sections, signature liquid-glass aesthetic.

FONTS
- "Inter Tight" 500/700/900 — all UI and headings (font-tight)
- "Instrument Serif" italic — eyebrow accents (font-serif)
Inject via Google Fonts useEffect.

COLORS
- bg #0B0B14 (near-black indigo)
- ink #F4F0FF (off-white)
- iris #8B7CFF (lavender)
- magenta #E879F9
- glass rgba(255,255,255,0.06)
- line rgba(255,255,255,0.08)

GLOBAL EFFECTS
- Body has a fixed radial gradient: 50% 20% from rgba(139,124,255,0.25) to transparent
- Liquid-glass utility class: backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl
- Subtle grain overlay using SVG noise data URI fixed pointer-events-none opacity-[0.06]

NAV
- Floating pill nav at top: liquid-glass, mx-auto max-w-3xl mt-6, h-14 px-6 flex items-center justify-between
- Left: "Velorah" font-tight 900 18px ink with iris dot
- Center: Work / Studio / Notes / Contact — 13px font-tight 500 ink/70
- Right: "Start a project →" pill bg-iris text-bg px-4 py-1.5 rounded-full text-13px font-bold

SECTION 1 — HERO
- min-h-screen pt-32 px-6, max-w-6xl mx-auto centered
- Eyebrow: italic serif iris 14px "— available for Q3 2026"
- Headline: font-tight 900 clamp(56px,11vw,180px) leading-[0.92] tracking-[-0.04em]: "We build\\nbrands that\\n<span gradient>move differently</span>."
- Gradient span: bg-gradient-to-r from-iris to-magenta bg-clip-text text-transparent
- Sub 18-22px ink/60 max-w-xl: "An eight-person studio crafting brand systems, sites, and products for founders who care."
- 2 CTAs: liquid-glass pill "See our work →" + outline pill "Book a call"
- Bottom row: marquee of client names "PYRE · KAVA · ORBIT · NORA · LATTICE · GRAVE · ECHO" — repeat scrolling slowly, 32px font-tight 500 ink/40

SECTION 2 — WORK GRID
- max-w-7xl mx-auto py-32
- Heading font-tight 900 80px "Selected work, 2024—2026"
- 3-col grid (lg:3 / md:2 / sm:1) gap-6
- 6 project cards: each liquid-glass aspect-[4/5] rounded-3xl p-8 flex flex-col justify-between hover:scale-[1.02]
- Top of card: tag pill bg-iris/15 text-iris px-3 py-1 rounded-full text-11px (e.g. "BRAND")
- Middle: gradient placeholder block aspect-square rounded-2xl
- Bottom: project title font-tight 700 22px ink + small "Brand · Site · 2025" 12px ink/50
- Projects: PYRE — Brand · ATELIER ORO — Identity · NOVA — App · STILL.WORLD — Web · ECHO — Campaign · LATTICE — Product

SECTION 3 — CAPABILITIES
- bg-gradient-to-b from-bg via-iris/10 to-bg py-32
- Heading font-tight 900 80px "What we make"
- 4 horizontal rows, each border-t border-line py-8 hover:bg-white/5
- Row layout: number 02px mono iris w-16 + name font-tight 700 32px + description 14px ink/60 flex-1 + ArrowUpRight icon
- Items: 01 Brand systems / 02 Marketing sites / 03 Product UI / 04 Motion & launch

SECTION 4 — CTA + FOOTER
- Liquid-glass card max-w-5xl mx-auto rounded-[40px] p-16 my-24
- Heading font-tight 900 80px "Have something\\nworth making?"
- Sub 16px ink/60: "We take on 6 projects a year. Tell us about yours."
- Email "hello@velorah.studio" bg-iris text-bg px-6 py-3 rounded-full font-bold inline-block
- Footer below: 4-col mini grid Studio / Work / Notes / Contact, 12px ink/50, copyright "© 2026 Velorah Studio · Lisbon · Brooklyn"

ICONS (lucide-react)
ArrowUpRight, ArrowRight, Sparkles, Twitter, Instagram

OUTPUT
- Single component "VelorahLanding", default export
- All Tailwind inline + <style>{...}</style> for marquee animation + grain overlay
- No markdown fences`,
  },
];