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
  {
    id: "liquid-glass-agency",
    name: "Liquid Glass Agency",
    tagline: "Glassmorphic creative agency hero",
    category: "Landing Page",
    vibe: "Aurora gradient · Frosted glass · Geist Sans",
    accent: "from-sky-400 to-violet-500",
    preview: "https://motionsites.ai/assets/hero-liquid-glass-agency-poster-BvnVaqJh.png",
    prompt: `Create a glassmorphic agency landing page called "Halo&Co" — a digital experience studio. 4 sections, signature liquid-glass UI on aurora gradient.

FONTS
- "Geist" 400/600/800 (font-geist) — UI + body
- "Geist Mono" — small caps labels
Inject via Google Fonts useEffect.

COLORS
- bg #050510
- ink #FFFFFF
- sky #7CC8FF
- violet #B79CFF
- pink #FF8FD3
- glass rgba(255,255,255,0.08)

GLOBAL EFFECTS
- Animated aurora background: 3 large soft blurred circles (sky, violet, pink), opacity 0.4, fixed behind everything, slow @keyframes float
- Glass utility: backdrop-blur-2xl bg-white/[0.06] border border-white/15 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]
- Subtle grain SVG overlay opacity-[0.04]

NAV
- Floating glass pill mx-auto max-w-3xl mt-6, h-14 px-6
- Left: "Halo&Co" font-geist 800 18px ink with sky→violet gradient circle dot
- Center: Work / About / Lab / Contact — 13px ink/70
- Right: "Start project" pill bg-white text-bg px-4 py-1.5 rounded-full font-bold

SECTION 1 — HERO
- min-h-screen pt-28 px-6, max-w-6xl mx-auto centered text
- Glass eyebrow chip: "✦ NOW BOOKING SUMMER 2026" mono 11px ink/80
- Headline font-geist 800 clamp(56px,11vw,180px) leading-[0.92] tracking-[-0.04em]: "Digital experiences\\nthat <span gradient>feel weightless</span>."
- Gradient span: bg-gradient-to-r from-sky via-violet to-pink bg-clip-text text-transparent
- Sub 18px ink/60 max-w-xl mx-auto: "We design and build sites, products, and motion for forward-leaning brands."
- 2 CTAs: glass pill "View work →" + outline pill "Read brief"
- Below hero: row of 3 glass cards (max-w-4xl mx-auto, grid-cols-3) showing "01 Brand · 02 Web · 03 Motion" with mini gradient previews

SECTION 2 — WORK SHOWCASE
- max-w-6xl mx-auto py-32
- Heading font-geist 800 80px "Recent transmissions"
- 2-col grid (lg:2 / sm:1) gap-6
- 4 large glass cards aspect-[4/3] rounded-[32px] p-8 hover:translate-y-[-4px]
- Each: top tag pill (BRAND/WEB/MOTION/APP), middle gradient placeholder, bottom title font-geist 800 24px + 12px mono ink/50 "2025 · 4 weeks"
- Projects: AURORA — Brand · MIST.LABS — Web · NOVA — Motion · LATTICE — App

SECTION 3 — PROCESS
- py-32 max-w-5xl mx-auto
- Heading "How we work" font-geist 800 64px
- 4 horizontal glass cards stacked, each rounded-2xl p-6 flex items-center gap-6
- Layout: big mono number 48px (sky/violet/pink/sky) + title font-geist 700 24px + body 14px ink/60 + ArrowRight icon
- Steps: 01 Listen · 02 Sketch · 03 Build · 04 Polish

SECTION 4 — CTA + FOOTER
- Glass card max-w-5xl mx-auto rounded-[40px] p-16 my-24 text-center
- Heading font-geist 800 80px "Let's make\\nsomething weightless."
- Email "hi@halo.co" bg-white text-bg px-6 py-3 rounded-full font-bold inline-block
- Footer 4-col mini grid + copyright "© 2026 Halo&Co · Berlin · Tokyo"

ICONS (lucide-react)
ArrowRight, ArrowUpRight, Sparkles, Twitter, Instagram, Github

OUTPUT
- Single component "HaloCoLanding", default export
- Tailwind inline + <style>{...}</style> for aurora animation + grain
- No markdown fences`,
  },
  {
    id: "aetheris-voyage",
    name: "Aetheris Voyage",
    tagline: "Cinematic luxury travel hero",
    category: "Hero Section",
    vibe: "Deep teal · Cinematic · Cormorant + Inter",
    accent: "from-teal-400 to-amber-300",
    preview: "https://motionsites.ai/assets/hero-aetheris-voyage-poster-BOeMMDSw.png",
    prompt: `Create a cinematic luxury travel hero section for "Aetheris Voyage" — bespoke yacht and air expeditions. Single full-bleed hero (one section), evocative and immersive.

FONTS
- "Cormorant Garamond" 300/400 italic — display headings (font-serif)
- "Inter" 400/500 — UI labels
Inject via Google Fonts useEffect.

COLORS
- bg #04181D (deep ocean teal-black)
- ink #F4ECDB (warm cream)
- teal #4FBFB0
- gold #D9B779
- mist rgba(244,236,219,0.6)

GLOBAL
- Full-bleed bg with layered radial gradients: deep teal center, fading to near-black edges
- Slow KenBurns-like pan on a placeholder image div (animate transform 30s ease-in-out infinite alternate)
- Vignette via inset box-shadow inset 0 0 200px rgba(0,0,0,0.7)
- Fine film grain SVG overlay opacity-[0.06]

NAV
- Top transparent, h-20 px-12
- Left: "AETHERIS" font-inter 600 14px tracking-[0.4em] ink
- Center hairline rule with small gold dot at midpoint
- Right links 12px tracking-widest ink/70: VOYAGES · YACHTS · AIR · CONCIERGE
- Far right: "ENQUIRE +" 12px gold uppercase tracking-widest

HERO LAYOUT
- min-h-screen flex items-center justify-center px-12
- Centered narrow column max-w-3xl
- Top eyebrow row: hairline rule left + tiny mono "N° 27 · WINTER 2026" ink/60 + hairline rule right
- Display heading font-serif italic clamp(64px,12vw,180px) leading-[0.95] tracking-tight ink: "the world,\\nin first person."
- Sub 18px font-serif italic ink/70 max-w-xl mx-auto: "Bespoke voyages crafted by hand, sailed in private, witnessed by few."
- Below: 2 CTAs centered
  • Primary: "Plan a voyage" — bg-transparent border border-gold text-gold px-8 py-3 tracking-[0.3em] uppercase 11px hover:bg-gold hover:text-bg
  • Ghost: "Watch the film  ▷" 11px ink/70 underline-offset-4

LOWER STRIP
- Absolute bottom-0 left-0 right-0 px-12 py-8 flex items-end justify-between
- Left: "CURRENTLY SAILING — TYRRHENIAN SEA · 41.2° N" tiny mono ink/60 with pulsing gold dot
- Center: scroll cue "EXPLORE ↓" 10px tracking-[0.4em] ink/40
- Right: 3 mini metric blocks side by side, each tiny mono label + serif italic value:
  • CABINS · 6
  • CRUISING · 14 KN
  • RANGE · 4,200 NM

CORNER FRAMES
- 4 small L-shaped hairline frames in each corner of the viewport (gold, 1px, 60px length) for cinematic mat

ICONS (lucide-react)
Play, Anchor, Plane, Compass

OUTPUT
- Single component "AetherisVoyageHero", default export
- Tailwind inline + <style>{...}</style> for KenBurns pan + grain + pulse dot
- No markdown fences`,
  },
  {
    id: "urban-jungle",
    name: "Urban Jungle",
    tagline: "Streetwear plant-store landing",
    category: "Landing Page",
    vibe: "Forest green · Street type · Archivo Black",
    accent: "from-emerald-500 to-lime-300",
    preview: "https://motionsites.ai/assets/hero-urban-jungle-poster-DNnMHsAj.png",
    prompt: `Create a bold streetwear-meets-plant-shop landing page for "Urban Jungle" — a Brooklyn plant boutique. 5 sections, gritty editorial energy.

FONTS
- "Archivo Black" — display (font-display)
- "Archivo" 400/600 — body
- "JetBrains Mono" — labels
Inject via Google Fonts useEffect.

COLORS
- bg #0E1A14 (deep forest)
- cream #F1EDE0
- jade #2BBF7B
- lime #C9F75B
- rust #C9542B
- line rgba(255,255,255,0.08)

GLOBAL
- 24px CSS grid background: linear-gradient lines on \`line\`, fixed
- Subtle leaf-shadow noise SVG overlay opacity-[0.05]

NAV
- Sticky h-16, bg-bg/80 backdrop-blur, border-b border-line
- Left: "URBAN.JUNGLE" font-display 22px cream with rust square dot prefix
- Center: Shop · Care · Stories · Visit — 12px mono uppercase tracking-widest cream/70
- Right: cart icon + "Buy plants →" pill bg-lime text-bg px-4 py-2 font-display rounded-full text-12px

SECTION 1 — HERO
- min-h-screen px-8 pt-28 grid lg:grid-cols-12 gap-8
- Left col-span-7: Eyebrow mono "// EST. 2019 · BROOKLYN" 11px lime
  Headline font-display clamp(64px,12vw,200px) uppercase cream leading-[0.85] tracking-tight: "RAISED\\nIN CONCRETE.\\nGROWN IN\\n<span text-lime>LIGHT.</span>"
  Sub 16px cream/70 max-w-md: "Hard-to-kill houseplants for hard-to-impress New Yorkers."
  2 CTAs: "Shop the jungle" bg-lime text-bg px-6 py-3 font-display rounded-full + "Read care guides →" cream underline
- Right col-span-5: tall gradient placeholder aspect-[3/4] rounded-3xl overflow-hidden + floating mini glass card overlay bottom-left "FREE NYC DELIVERY · ORDERS $80+" mono 11px

SECTION 2 — STAT BAND
- bg-lime text-bg py-8 marquee row
- Repeating: "12,400 PLANTS RAISED · 41 SPECIES · 0 KILLED · 4.9★ — " font-display 48px

SECTION 3 — FEATURED PLANTS
- bg-bg py-32 max-w-7xl mx-auto px-8
- Heading font-display 80px cream uppercase: "TONIGHT'S DROP"
- 4-col grid (lg:4 / md:2) gap-4
- Each card: bg-white/5 border border-line rounded-3xl p-6 hover:border-lime/40
- Top: gradient circle placeholder aspect-square + difficulty pill (EASY/MEDIUM/HARD) top-right
- Middle: name font-display 24px cream uppercase
- Latin name italic 12px cream/50
- Price mono 18px lime
- "Add to cart" button bg-cream/5 hover:bg-lime hover:text-bg w-full py-2 mt-3 rounded-xl font-display text-13px
- Plants: MONSTERA · SNAKE · POTHOS · FIDDLE · CALATHEA · ZZ · PHILO · STRING-OF-PEARLS

SECTION 4 — CARE GUIDES (EDITORIAL)
- bg-cream text-bg py-32
- Heading font-display 96px uppercase: "DON'T KILL\\nYOUR PLANTS."
- 3-col grid: each row a mini editorial — number 02 mono lime, title font-display 28px, body 14px bg/70, "Read →" rust link
- Topics: 01 WATERING — Less is more / 02 LIGHT — Find your window / 03 SOIL — Roots before leaves

SECTION 5 — CTA + FOOTER
- bg-bg py-32 center
- Heading font-display clamp(80px,15vw,240px) uppercase cream "GROW WILD."
- Sub 14px mono cream/60: "Free delivery in NYC · 30-day plant guarantee"
- "Start shopping" bg-lime text-bg pill px-8 py-4 font-display rounded-full
- Footer 4-col: Shop / Care / Visit / Follow, copyright "© 2026 URBAN.JUNGLE · BROOKLYN"

ICONS (lucide-react)
ShoppingBag, Leaf, ArrowRight, Instagram, MapPin

OUTPUT
- Single component "UrbanJungleLanding", default export
- Tailwind inline + <style>{...}</style> for grid bg + marquee
- No markdown fences`,
  },
  {
    id: "slam-dunk",
    name: "Slam Dunk",
    tagline: "Explosive basketball drop hero",
    category: "Hero Section",
    vibe: "Court orange · Sport editorial · Anton",
    accent: "from-orange-500 to-red-500",
    preview: "https://motionsites.ai/assets/hero-slam-dunk-poster-Cd-dE4fD.png",
    prompt: `Create an explosive sports/sneaker drop hero section called "AIRBORNE 24" — a limited basketball sneaker release. Single full-bleed hero, high-energy editorial.

FONTS
- "Anton" — massive display headlines (font-display)
- "Inter" 600 — UI
- "JetBrains Mono" — labels
Inject via Google Fonts useEffect.

COLORS
- bg #0A0A0A
- ink #FFFFFF
- court #FF5A1F (basketball orange)
- chalk #F4E9D8
- volt #DBFF00

GLOBAL
- Diagonal court-line pattern in background using repeating-linear-gradient (court color, low opacity 0.06, 45deg)
- Halftone dot overlay using radial-gradient pattern, fixed, opacity-[0.08]
- Vignette inset shadow

NAV
- Top h-16 px-8 transparent
- Left: "AIRBORNE.24" font-display 28px ink with court vertical bar prefix
- Center pills: SHOP · ATHLETES · STORY (court bg active) — mono 11px tracking-widest
- Right: "JOIN RAFFLE →" bg-volt text-bg pill px-4 py-2 font-display text-13px

HERO LAYOUT
- min-h-screen relative overflow-hidden
- Layout: left text 6 cols, right hero visual 6 cols, gap-8, max-w-7xl mx-auto px-8

LEFT COLUMN (text)
- Tiny eyebrow row mono 11px volt: "DROP 24 · LIVE FRIDAY 9PM EST · 1,200 PAIRS"
- Massive headline font-display clamp(80px,16vw,260px) leading-[0.82] uppercase ink: "YOU\\nDON'T\\nWALK.\\n<span text-court>YOU FLY.</span>"
- Sub 18px chalk/80 max-w-md: "AIRBORNE 24 — engineered for the .3 seconds your feet leave the floor. Carbon plate. Zoom Air. 28% lighter."
- CTA cluster:
  • "Enter the raffle" bg-court text-bg px-8 py-4 font-display rounded-full text-15px
  • "Watch the drop film 1:24 →" outline pill border-ink/30 ink
- Stat row below: 3 mini metrics in mono — TIME LEFT · 2D 14H 22M / RAFFLE ENTRIES · 41,209 / RETAIL · $245

RIGHT COLUMN (visual stage)
- Large court-orange circle (glow, blurred, animate-pulse) center
- On top: huge gradient placeholder aspect-square representing sneaker, slight rotate-[-12deg] hover:rotate-0 transition
- Floating tags absolute around it:
  • Top-left chip: "CARBON PLATE" volt bg-bg/80 rotate-[-6deg]
  • Bottom-right chip: "ZOOM AIR x2" court bg-bg/80 rotate-[8deg]
  • Right side chip: "DROP №24" mono ink/70 tracking-widest
- Behind sneaker: huge font-display "24" 480px outlined (text-stroke chalk/10), absolute, rotate-[-15deg]

LOWER STRIP
- Absolute bottom-0 left-0 right-0 bg-court text-bg py-3
- Marquee mono: "AVAILABLE 04.30.26 · NYC · LA · TOKYO · SEOUL · LONDON · BERLIN · MELBOURNE · — " font-display 24px

CORNER ELEMENTS
- Top-right small live indicator: pulsing volt dot + "LIVE" 11px mono
- Bottom-left: "AIRBORNE × NIKO PARK" 11px mono chalk/50 with hairline above

ICONS (lucide-react)
Play, Zap, Clock, ArrowRight

OUTPUT
- Single component "AirborneHero", default export
- Tailwind inline + <style>{...}</style> for court pattern + halftone + pulse
- No markdown fences`,
  },
];