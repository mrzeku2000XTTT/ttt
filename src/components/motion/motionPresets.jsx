import { ORBIS_NFT_PROMPT } from "@/components/motion/orbisPrompt";

// Marketplace of vibe-code presets for Motion
export const MOTION_PRESETS = [
  {
    id: "orbis-nft",
    name: "Orbis.Nft",
    tagline: "Cinematic NFT collection landing",
    category: "NFT",
    vibe: "Dark space · Liquid glass · Anton + Condiment",
    accent: "from-emerald-400 to-cyan-400",
    preview: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&q=70",
    prompt: ORBIS_NFT_PROMPT,
  },
  {
    id: "kasper-defi",
    name: "Kasper.Fi",
    tagline: "Bold DeFi protocol marketing site",
    category: "DeFi",
    vibe: "Cyber teal · Brutalist grid · Space Grotesk",
    accent: "from-cyan-400 to-blue-500",
    preview: "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=800&q=70",
    prompt: `Create a DeFi protocol landing page called "Kasper.Fi" — a fast Layer-1 yield aggregator. 4 sections, brutalist cyber-grid aesthetic.

FONTS
- Space Grotesk (700/900) — headings, aliased font-grotesk
- JetBrains Mono — numbers and tickers, font-mono
Inject via useEffect Google Fonts link.

COLORS
- Background #04060B (near-black)
- ink #E6F4FF (off-white text)
- electric #00E5FF (cyan accent)
- volt #B6FF00 (lime stat highlights)
- line rgba(255,255,255,0.08) (grid lines)

GLOBAL
- Subtle 24px CSS background-grid: linear-gradient lines on \`line\` color
- Sticky top nav: 64px tall, blurred bg-[rgba(4,6,11,0.7)] border-b border-white/5
- Logo "KASPER.FI" font-grotesk 900, ink, with electric square dot before
- Nav links: Protocol / Vaults / Docs / DAO — uppercase tracking-widest 11px
- Right CTA: "Launch App →" pill bg-electric text-black px-5 py-2 rounded-full font-bold

SECTION 1 — HERO
- Full viewport, max-w-[1400px] centered, padded
- Eyebrow: small uppercase electric label "// LIVE ON KASPA L1 — APR 28 2026"
- Heading font-grotesk 900 uppercase, 56→112px responsive: "YIELD,\\nAT THE\\nSPEED OF\\nLIGHT."
- Sub paragraph 16px ink/70: "Kasper.Fi compounds capital across Kaspa-native vaults at sub-second finality. No gas. No friction. No middlemen."
- 2 CTAs: primary "Open App" bg-electric text-black, secondary "Read whitepaper →" border border-white/15
- Right side: huge animated stat card (800x600) "stat block" — 4 stats grid: TVL $124.7M / 24h Vol $18.2M / Avg APR 22.4% / Holders 41,209 — each in font-mono volt 36-48px, label 10px uppercase ink/50
- Bottom strip: scrolling marquee of partner logos (use placeholder text: KASPA · LAYERZ · ARK · NOVA · HYPE · GRID · PYTH · LUMEN — repeat)

SECTION 2 — VAULTS GRID
- Heading: "ACTIVE VAULTS" font-grotesk 900 48-72px, sub: "Single-asset and pair vaults. Auto-compounding."
- 3-column grid (lg:3 / md:2 / sm:1), gap 16
- Each card: bg-white/[0.02] border border-white/10 rounded-2xl p-6 hover:border-electric/40
- Card top row: token-pair circle stack (use colored divs) + name like "KAS-USDT" 18px font-grotesk
- Big APR number font-mono volt 40-56px with "% APR" 12px ink/50 next to it
- Stats row: TVL · Strategy · Risk (low/med/high pill) — 11px mono ink/60
- "Deposit" button bottom: w-full bg-white/5 hover:bg-electric hover:text-black border border-white/10 rounded-xl py-2.5 font-bold
- Make 6 vault cards with varied APRs: 18.2%, 24.8%, 41.2%, 12.4%, 67.9%, 9.1%

SECTION 3 — HOW IT WORKS
- 3 horizontal numbered steps, big numbers font-grotesk 900 200px volt as background, content overlaid
- Steps: 01 DEPOSIT — Bring KAS or any KRC-20. / 02 AUTO-COMPOUND — Strategies harvest hourly. / 03 WITHDRAW — Anytime. Zero lockup. Zero fees on principal.
- Each step has a small icon (lucide: ArrowDownToLine, RefreshCw, ArrowUpFromLine) in electric

SECTION 4 — CTA + FOOTER
- Full-width band, bg-gradient from electric/15 to volt/10, rounded-3xl, mx, my-24, py-24
- Centered: "READY TO COMPOUND?" 56-96px font-grotesk 900
- Sub: "Audited by 3 firms. Open-source. Built on Kaspa." 14px ink/60
- Two CTAs: bg-black text-electric "Launch App" + bg-transparent border-electric "Read Docs"
- Footer below: 4 columns — Protocol / Resources / Community / Legal — links 12px ink/50 hover:ink, copyright "© 2026 Kasper.Fi · Powered by Kaspa"

ICONS
Use lucide-react: ArrowRight, ArrowDownToLine, RefreshCw, ArrowUpFromLine, Twitter, Github, FileText

OUTPUT
- Single self-contained component "KasperFiLanding", default export
- All Tailwind inline + <style>{...}</style> for grid bg + marquee animation
- No markdown fences`,
  },
  {
    id: "lumen-saas",
    name: "Lumen",
    tagline: "Minimal AI SaaS product page",
    category: "SaaS",
    vibe: "White · Apple-clean · Inter Display",
    accent: "from-zinc-400 to-zinc-600",
    preview: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=70",
    prompt: `Create a clean SaaS landing page called "Lumen" — an AI writing assistant for product teams. 5 sections. Apple-grade minimalism.

FONTS
- Inter Display (400/500/700/900) — everything
Inject via Google Fonts useEffect.

COLORS
- Background #FFFFFF
- ink #0A0A0A
- gray-1 #F5F5F7 (section backdrop)
- gray-2 #86868B (subtext)
- accent #0066FF (single bright blue accent)

NAV
- Sticky 56px, white/80 backdrop-blur, border-b border-black/5
- Logo "Lumen" font-bold 18px ink, with a small accent gradient dot (3px) prefix
- Center links 13px gray-2: Product / Pricing / Customers / Changelog / Docs
- Right: "Sign in" link + "Try free" pill bg-ink text-white px-4 py-1.5 rounded-full text-13px

SECTION 1 — HERO
- max-w-5xl mx-auto, centered text, py-32
- Tiny eyebrow pill: bg-gray-1 px-3 py-1 rounded-full text-12px gray-2 "✦ Now with GPT-5 inline"
- Heading 56→96px font-weight 900 tracking-[-0.04em] ink: "Words that\\nwrite themselves."
- Sub 18-22px gray-2 max-w-2xl mx-auto: "Lumen drafts your launch posts, release notes, and customer emails — in your team's voice — in under 30 seconds."
- 2 buttons: primary "Try Lumen — free" bg-ink text-white rounded-full px-6 py-3, secondary "See how it works →" text-ink underline-offset-4 hover:underline
- Below: trust row "Trusted by teams at" tiny gray-2 + 6 placeholder logo names in 14px medium gray-2: NOVA · ARK · LATTICE · FORM · ORBIT · KAVA
- Hero visual: large rounded-3xl shadow-2xl border border-black/5 bg-gray-1 aspect-[16/9] containing a fake Lumen UI screenshot (use nested divs to mock a chat sidebar + message thread + a "Generate" button highlighted in accent)

SECTION 2 — FEATURE TRIO
- bg-gray-1 py-24 rounded-3xl mx-6
- 3-col grid lg, gap-12
- Each: small icon in 40px rounded-2xl bg-white shadow-sm, title 22px font-700 ink, body 15px gray-2
- Items:
  1) Sparkles — "Voice that's yours" — Train Lumen on past content. Output sounds like your brand, not a robot.
  2) Zap — "30-second drafts" — Briefs in. Polished copy out. Iterate inline with /commands.
  3) ShieldCheck — "Private by default" — SOC 2. No model training on your data. Self-hostable.

SECTION 3 — BIG QUOTE
- max-w-3xl mx-auto py-32 centered
- Huge "" symbol in accent 200px font-light, opacity-20, absolute behind
- Quote 32-44px font-medium ink: "We replaced our entire copywriting workflow with Lumen and shipped 3x more content."
- Author row 14px gray-2: "Avery Park · Head of Marketing, Lattice"

SECTION 4 — PRICING
- 3 cards centered max-w-5xl
- Each: rounded-3xl border border-black/8 p-8, middle one accented bg-ink text-white
- Tiers: Starter $0/mo (5 drafts/day · 1 user) / Pro $24/mo (Unlimited · 5 users · Voice training) [highlighted, "Most popular" pill] / Team $96/mo (Everything + SSO · Audit log · Priority)
- Each: name 14px uppercase tracking-wider, price 56px font-900, description, bullet list (Check icon + 14px), CTA full-width pill

SECTION 5 — FOOTER
- bg-ink text-white py-24 rounded-t-3xl mx-6
- max-w-6xl, 4-column grid: Product / Resources / Company / Legal
- Top row: huge "Lumen." 96px font-900
- Bottom: "© 2026 Lumen Labs · Made with care in San Francisco" 12px text-white/40

ICONS (lucide-react)
Sparkles, Zap, ShieldCheck, Check, ArrowRight, Twitter, Github, Linkedin

OUTPUT
- Single component "LumenLanding", default export, raw JSX
- All Tailwind inline + minimal <style> for any custom blur/blend
- No markdown fences`,
  },
  {
    id: "noir-agency",
    name: "Noir Studio",
    tagline: "Editorial design agency portfolio",
    category: "Agency",
    vibe: "Black · Editorial · PP Editorial New",
    accent: "from-amber-400 to-rose-400",
    preview: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=70",
    prompt: `Create a design agency portfolio site for "Noir Studio". Editorial-magazine layout. 6 sections.

FONTS
- Inter (regular, semi) — UI / nav / body
- A serif display via Google Fonts: "Fraunces" (italic 900) — for big editorial headlines (alias font-serif)
- Use Fraunces italic for all hero/section titles

COLORS
- Background #0B0B0B
- paper #F4F1EA (cream)
- gold #D4A14A
- text-soft #A8A29E

NAV
- Top nav h-16, transparent over hero, paper text
- Left: "Noir" font-serif italic 28px paper
- Center: tracking-[0.3em] uppercase 11px paper/70 — Work · Studio · Journal · Contact
- Right: "Book a call" small pill border border-paper/20 px-4 py-2 rounded-full text-11px

SECTION 1 — HERO (paper bg)
- bg-paper text-[#0B0B0B] min-h-screen px-8 py-20
- Tiny top-row: ISSUE №07 — APRIL 2026 (mono 11px, two corners with hairline rule between)
- Center: massive font-serif italic font-900 fluid text-[clamp(56px,12vw,200px)] leading-[0.9] tracking-tight
- Headline: "Brands\\nbuilt for\\nthe quiet\\nwinners."
- Below: 1 line italic font-serif 22px: "An independent studio of seven, working from Lisbon."
- Bottom-of-section row: 4 quick stats (cap rule above): EST. 2018 / 92 PROJECTS / 14 AWARDS / 3 CONTINENTS — each tiny mono 11px label + 28px serif italic value

SECTION 2 — FEATURED WORK STRIP
- bg-[#0B0B0B] text-paper
- Marquee row: huge font-serif italic "RECENT WORK · 2024–2026 · " repeating, 96px paper opacity-90, scrolling slowly
- Below: 3-column asymmetric grid (uneven heights using col-span and aspect ratios)
  - Item 1: aspect-[3/4] tall, bg image (use bg-gradient placeholder), label "PYRE — Brand identity" overlay bottom
  - Item 2: aspect-[16/9] wide, bg gradient, label "STILL.WORLD — Web"
  - Item 3: aspect-[1/1], bg gradient, label "ATELIER ORO — Packaging"
- Each item rounded-md overflow-hidden, hover:scale-[1.02]
- Caption format: tiny mono 10px gold uppercase number "01 / 02 / 03" + serif italic 18px name

SECTION 3 — STUDIO MANIFESTO
- bg-paper text-[#0B0B0B] py-32 px-8
- Two-column: left small caps mono "STUDIO NOTES" + big number "№02"
- Right: 2 paragraphs serif 22px italic, line-height 1.5: "We don't pitch. We listen, then make. Most of what reaches the world starts as a small idea drawn quietly on a napkin in a Lisbon café…"
- Below: a pull-quote in 80px serif italic centered: "Slow ideas. Sharp execution."

SECTION 4 — SERVICES
- bg-[#0B0B0B] text-paper py-24
- Heading "What we do" font-serif italic 80px gold
- 4-row list (each row a horizontal flex with hairline border-t border-paper/10):
  - Number 01 (mono) · "Brand systems" (serif italic 32px) · "Identity, voice, design language" (mono 12px paper/60) · "→" arrow right
  - 02 · "Editorial direction" · "Magazines, books, longform"
  - 03 · "Digital product" · "Marketing sites, apps, motion"
  - 04 · "Strategic counsel" · "Naming, positioning, narrative"
- Hover row: bg-paper text-[#0B0B0B] full-row swap

SECTION 5 — CLIENTS LIST
- bg-paper py-32
- Center: "TRUSTED BY" tiny tracking-widest mono
- Below: 4-col grid of 16 client names, each font-serif italic 28-40px, hover:text-gold
- Names: PYRE · STILL · OLEA · KAVA · MOSS · RIFT · ATELIER ORO · ECHO · NORA & SONS · LUNA·OFFICE · GRAVE · AURELIO · COSTA · VESPA · LATTICE · NORTHWIND

SECTION 6 — CTA + FOOTER
- bg-[#0B0B0B] text-paper py-24
- Center: serif italic 96-160px "Let's make\\nsomething."
- Email button: hello@noir.studio in mono 18px gold underline
- Footer 3-col: Address (Rua da Boavista 142, Lisbon) / Hours (Mon–Fri 10–18 WET) / Social (Instagram · Twitter · Are.na)
- Tiny bottom: "© Noir Studio MMXXVI"

ICONS (lucide-react)
ArrowRight, ArrowUpRight, Instagram, Twitter

OUTPUT
- Single component "NoirStudioLanding", default export
- Use <style> block for marquee + serif font fallback chain
- No markdown fences`,
  },
  {
    id: "pulse-fitness",
    name: "Pulse",
    tagline: "Bold fitness app launch site",
    category: "App",
    vibe: "Neon coral · High-energy · Sports Display",
    accent: "from-rose-500 to-orange-400",
    preview: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=70",
    prompt: `Create a bold fitness/wearable app landing page called "Pulse" — heart-rate-powered training. 5 sections, high-energy.

FONTS
- "Bebas Neue" (Google) for huge display headlines — font-display
- "Inter" 400/600 for body
Inject via useEffect.

COLORS
- bg #0A0A0A
- ink #FFFFFF
- coral #FF3F4C (primary brand)
- citrus #FFE15B (highlight)
- gray rgba(255,255,255,0.6)

NAV
- 64px sticky, bg-black/70 backdrop-blur, border-b border-white/8
- Logo: "PULSE" font-display 28px ink with 8px coral square next to it
- Center pills nav (active = coral bg, others = white/5): App / Program / Coaches / Stories
- Right: "Download" coral pill, white text

SECTION 1 — HERO
- min-h-screen relative
- Background: full-bleed dark image placeholder + coral radial gradient at center
- Layout: split, text-left max-w-2xl, py-24
- Tiny eyebrow row: 8px coral dot (animate pulse) + "LIVE TRAINING IN PROGRESS — 2,841 ATHLETES" 11px mono ink/70
- Headline: font-display, fluid clamp(72px,14vw,220px), leading-[0.85], uppercase: "TRAIN\\nLIKE YOUR\\n<span text-coral>HEART</span>\\nIS LISTENING."
- Sub 18px gray max-w-md: "Adaptive workouts that respond to your real-time HRV. Get stronger, recover faster, no guesswork."
- CTAs: "Get Pulse — Free" coral filled pill px-6 py-3 / "Watch film 1:24 →" outline pill
- Right floating element: huge animated heart rate chart (use SVG path, animate strokeDashoffset), with BPM counter "147 BPM" font-display 64px coral
- Below hero, app store badges row (2 placeholder rounded buttons "App Store" + "Google Play")

SECTION 2 — STAT BAND
- bg-coral text-black py-12, single horizontal scrolling-feel row
- 4 stats spaced evenly:
  • 2.4M ATHLETES • font-display 56px
  • 41% AVG HRV GAIN • font-display 56px
  • 18,000 WORKOUTS • font-display 56px
  • 4.9★ APP STORE • font-display 56px
- Hairlines between

SECTION 3 — FEATURE GRID
- py-32 max-w-7xl
- Heading font-display 80px uppercase ink: "BUILT FOR THE WAY\\nYOUR BODY ACTUALLY WORKS."
- 4 cards in 2x2 grid (lg), gap-6
- Each: rounded-3xl bg-white/[0.04] border border-white/10 p-8 hover:bg-white/[0.07]
- Items:
  1) HeartPulse icon coral — "REAL-TIME HRV" — Adapts your set intensity by-the-second from your watch.
  2) Flame icon citrus — "BURN MAPS" — See where your fat-burn zones actually are. Train them. Track them.
  3) Moon icon ink — "SLEEP-AWARE" — Auto-deload when you slept under 6h. No more burnouts.
  4) Trophy icon coral — "GAMIFIED" — Beat your past self. Squad challenges. Streak rewards.
- Each card: icon in 56px rounded-2xl bg-coral/15 + title font-display 28px + body 14px gray + "Learn more →" tiny coral link

SECTION 4 — COACH SHOWCASE
- bg-[#0A0A0A] py-24
- Heading "TRAIN WITH HUMANS\\nWHO'VE BEEN THERE" font-display 72px
- Horizontal scroll row (overflow-x-auto), 5 coach cards, each w-72 flex-shrink-0
- Each card: rounded-3xl overflow-hidden h-96, gradient placeholder bg, bottom overlay with name "COACH NOAH PARK" + spec "Strength · Recovery" + "12 PROGRAMS" tag
- Names: NOAH PARK · MAYA OBI · DARIUS LAU · SOFIA REIS · KENJI WATTS

SECTION 5 — CTA + FOOTER
- bg-coral text-black py-32 rounded-t-[48px]
- Center: "READY?" font-display 240px (clamp), with "GET PULSE." 96px below
- 2 large pill buttons: black bg "Download for iOS" / "Download for Android"
- Below: tiny 12px "Free for 14 days · No card required"
- Footer black bg-text-white py-12, 4-col mini links: Product / Programs / Company / Help, copyright

ICONS (lucide-react)
HeartPulse, Flame, Moon, Trophy, Play, ArrowRight, Apple, Smartphone

OUTPUT
- Single component "PulseLanding", default export, raw JSX
- All Tailwind + <style> for HRV pulse animation
- No markdown fences`,
  },
  {
    id: "drift-restaurant",
    name: "Drift",
    tagline: "Coastal restaurant immersive site",
    category: "Hospitality",
    vibe: "Sea foam · Photographic · DM Serif Display",
    accent: "from-teal-300 to-cyan-500",
    preview: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=70",
    prompt: `Create an immersive restaurant website for "Drift" — a coastal seafood spot in Tofino. 5 sections, photographic & serene.

FONTS
- "DM Serif Display" — display headlines (font-serif)
- "DM Sans" — body and UI
Google Fonts via useEffect.

COLORS
- bg #F8F5EE (warm bone)
- ink #0F1A1C (deep teal-black)
- foam #B8DCD3 (soft sea foam)
- coral #E26D5A (warm coral, accent)
- sand #C8AE8A

NAV
- Floating top nav at py-6, transparent over hero
- Center: "Drift" font-serif italic 36px ink with tiny "—" before and after
- Mobile: hamburger left, "Reserve" pill right
- Desktop links left of logo: Menu · Story / right: Visit · Reserve — 13px tracking-wider uppercase

SECTION 1 — HERO
- min-h-screen, layered image of ocean (use bg-gradient placeholder from foam to bg)
- Centered content, py-48
- Eyebrow: tiny mono "EST. 2019 — TOFINO, BC" 11px
- Headline font-serif clamp(56px,11vw,180px) italic ink leading-[0.95] tracking-tight: "the ocean,\\non a plate."
- Sub 18px ink/70 max-w-xl mx-auto: "A 28-seat tasting room on the edge of Pacific Rim. Open Wednesday through Sunday for dinner."
- CTA: "Reserve a table" coral filled rounded-full px-8 py-3 + "View tonight's menu →" link below
- Bottom corner floating card (absolute right-12 bottom-12): rounded-2xl bg-white/80 backdrop-blur p-5 max-w-xs — "Tonight, April 28" small caps + 3 dish names with prices in font-serif italic 18px (Halibut crudo · Smoked sablefish · Sea-buckthorn pavlova)

SECTION 2 — MENU SAMPLER
- bg-foam py-32 px-8 rounded-[48px] mx-6
- Heading: "from the\\ntide today" font-serif italic 80-160px ink
- 2-col grid lg, gap-16
- Left col: 4 dishes — name (font-serif italic 32px ink) + ingredient line (14px ink/60) + price (mono 14px coral) — hairline border-b each
  • OYSTERS, three ways · Kushi, Royal Miyagi, Stellar Bay · 24
  • DUNGENESS CRAB · brown butter, sourdough, lemon · 38
  • SABLEFISH · miso glaze, daikon, spring onion · 46
  • LINGCOD COLLAR · charred citrus, fennel · 32
- Right col: Vertical photo block — gradient placeholder rounded-3xl aspect-[3/4]

SECTION 3 — STORY
- bg-bg, py-32, 2-col asymmetric: left text 5/12 cols, right image 7/12
- Left small caps: "OUR STORY"
- Big serif italic: "Cooked by Lena. Fed by\\nthe Pacific."
- 3 paragraphs DM Sans 16px ink/80, generous line-height
- Right: tall image gradient placeholder rounded-3xl

SECTION 4 — VISIT
- bg-ink text-bg py-32
- Heading font-serif italic foam 80px "find us"
- 3-col grid: Address / Hours / Reservations
- Each: tiny caps label foam, then 4-line content in font-serif italic 24px
- Below: a wide rounded-3xl gradient placeholder representing a map, ratio 21/9
- "Get directions →" coral link bottom

SECTION 5 — FOOTER
- bg-bg, ink text, py-16, hairline border-t
- 3-col: brand text "Drift" font-serif italic 48px / quick links / contact
- Bottom mono row: "© 2026 Drift · Tofino · BC · Canada"

ICONS (lucide-react)
Mail, Phone, MapPin, Instagram, ArrowRight

OUTPUT
- Single component "DriftLanding", default export, raw JSX
- Tailwind inline + <style> for any image filters
- No markdown fences`,
  },
];

export const PRESET_CATEGORIES = ["All", ...Array.from(new Set(MOTION_PRESETS.map(p => p.category)))];