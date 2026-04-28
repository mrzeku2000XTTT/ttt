// Additional vibe-code presets — gen 2 batch
export const MOTION_PRESETS_NEW = [
  {
    id: "halcyon-ai",
    name: "Halcyon",
    tagline: "AI research lab homepage",
    category: "AI Lab",
    vibe: "Bone white · Kinetic type · IBM Plex",
    accent: "from-violet-500 to-fuchsia-500",
    preview: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=70",
    prompt: `Create an AI research lab homepage for "Halcyon" — open-source frontier models. 5 sections, kinetic & academic.

FONTS
- "IBM Plex Serif" (700) — display headlines, font-serif
- "IBM Plex Sans" (400/500/600) — body, font-sans
- "IBM Plex Mono" — labels and code, font-mono
Inject Google Fonts via useEffect.

COLORS
- bg #F4F2EC (warm bone)
- ink #0E0E0E
- violet #6E3FFF (single brand accent)
- gray-1 #B6B2A8
- line rgba(14,14,14,0.12)

NAV
- 56px sticky, bg #F4F2EC/80 backdrop-blur, border-b border-line
- Logo "halcyon" font-serif italic 22px ink with violet asterisk prefix that slowly rotates (animation: spin 12s linear infinite)
- Center mono links 11px uppercase tracking-widest: Research / Models / Papers / Careers / Blog
- Right: tiny "arXiv ↗" link + "Try API" violet pill px-4 py-1.5 rounded-full text-12px

SECTION 1 — HERO
- max-w-6xl py-32 px-8
- Left col 7/12: massive font-serif clamp(64px,11vw,180px) leading-[0.92] tracking-[-0.03em] ink — "Models that\\nthink in\\n<span italic violet>continuums</span>."
- Animated word swap: italic word cycles every 3s through ["continuums","whispers","constellations","fragments"] using setInterval
- Sub paragraph 18px ink/70 max-w-xl: "Halcyon is an independent AI research lab building open-weight reasoning models. Released under permissive licenses. No moats."
- Right col 5/12: stat sheet — 4 rows hairline-divided, each: mono caps label 10px gray-1 + serif 36px ink value
  • PARAMS — 70.4B
  • CONTEXT — 1.2M tokens
  • LICENSE — Apache 2.0
  • ELO (HumanEval) — 1842
- Below hero: scrolling marquee row of paper titles (font-serif italic 24px) — "On the Geometry of Reasoning · Sparse Attention is All You Need · Memory as Compression · " repeat infinite

SECTION 2 — MODEL CARDS
- py-32 max-w-6xl
- Heading: "Open. Auditable. Yours." font-serif 64px italic
- 3-col grid, each rounded-2xl bg-white border border-line p-7 hover:-translate-y-1 transition-transform
- Cards:
  1) HALCYON-7B-BASE / "Compact reasoning, runs on a 4090" / 7.4B params · 128k ctx / "Download weights →"
  2) HALCYON-70B-INSTRUCT / "Frontier-grade open release" / 70B params · 1.2M ctx / "Download weights →"
  3) HALCYON-MOE / "Mixture-of-experts, 12B active" / 124B total · 12B active / "Download weights →"
- Each: model code in mono 11px violet at top, name in serif 24px, body 14px ink/70, stats row mono 11px ink/60, hairline + violet "Download" link

SECTION 3 — RESEARCH FEED
- bg-ink text-[#F4F2EC] rounded-3xl mx-6 py-24 px-12
- Heading "Recent papers" font-serif italic 56px violet
- List of 6 papers — each row: hairline border-t border-white/10 py-6
  • Mono date 11px gray-1 (apr 2026 / mar 2026 / feb 2026 / jan 2026 / dec 2025 / nov 2025)
  • Title font-serif 28px text-[#F4F2EC] (italics on hover)
  • Author line 13px gray-1
  • Right: "PDF ↗" mono violet link
- Hover row: bg-white/5
- Titles: "On the Geometry of Reasoning" / "Sparse Attention is All You Need (Reprise)" / "Memory as Compression" / "When Models Refuse: A Field Study" / "Eval Beyond MMLU" / "Open Weights and the Public Good"

SECTION 4 — TEAM
- py-32, heading "Seven humans, one ambition." font-serif italic 64px
- 4-col grid, 8 placeholder member cards
- Each: rounded-xl aspect-square gradient bg, name font-serif 18px, role mono 11px ink/60
- Names: Anya Volkov · Dr. Shiro Tanabe · Marcus Veld · Olu Adeyemi · Priya Sen · Jonas Kerr · Mei Liang · Theo Astor
- Roles vary: Co-founder · Research Director · Sys/Infra · ML Engineer (x2) · Open Source Lead · Comms · Operations

SECTION 5 — CTA + FOOTER
- bg-violet text-white rounded-t-[64px] mx-6 py-32
- Center font-serif italic clamp(56px,10vw,160px) — "Build with us."
- 2 buttons: "Read the API docs" white pill ink-text + "Apply to research" outline-white
- Tiny line below: "We're hiring researchers in SF and Zurich"
- Footer rows mx-6 py-12: 4-col mini links Research / Models / Papers / Press, mono copyright "© 2026 Halcyon Labs · A public benefit corporation"

ANIMATIONS REQUIRED
- Asterisk in logo: continuous slow rotation
- Hero italic word: cycle every 3s with fade transition
- Marquee paper titles: infinite horizontal scroll
- Cards: hover lift + violet shadow-glow
- Section reveals: fade-up via IntersectionObserver

ICONS (lucide-react)
ArrowUpRight, FileText, Download, Github, Twitter, Mail

OUTPUT
- Single component "HalcyonLanding", default export, raw JSX
- All Tailwind + <style> for marquee, fades, asterisk spin
- No markdown fences`,
  },
  {
    id: "ember-energy",
    name: "Ember",
    tagline: "Clean energy hardware product page",
    category: "Hardware",
    vibe: "Burnt orange · Industrial · Söhne",
    accent: "from-orange-500 to-red-600",
    preview: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&q=70",
    prompt: `Create a clean-energy home battery product page for "Ember" — a beautiful 14kWh wall-mounted home battery. 6 sections, industrial product marketing.

FONTS
- "Söhne" via Adobe fallback — use "Inter" as substitute (700/900) for headings, font-display
- "Inter" 400/500 for body
Inject Google Fonts useEffect.

COLORS
- bg #F2EEE5 (warm cream)
- ink #181210 (warm black)
- ember #E04D1B (burnt orange brand)
- char #2A1F1A (deep brown)
- mist #DCD5C7 (subtle backdrop)

NAV
- 64px sticky, bg-bg/80 backdrop-blur, border-b border-ink/8
- Logo "EMBER" font-display 900 24px ink with ember-colored "·" dot
- Center links 12px tracking-widest uppercase: Product · Specs · Install · Owners · Story
- Right: "Reserve — $200" ember pill text-white px-5 py-2 rounded-full font-bold 13px

SECTION 1 — HERO (full-bleed)
- min-h-screen relative bg-mist
- Layout: split, image right 7/12 (use a layered gradient placeholder w/ shadow simulating product photo of a wall battery), text left 5/12
- Eyebrow: ember dot + "AVAILABLE Q3 2026 — RESERVING NOW" 11px mono ink/70
- Heading font-display 900 clamp(56px,9vw,140px) leading-[0.92] tracking-[-0.03em]: "Power\\nthat looks\\nthe part."
- Sub 18px ink/70 max-w-md: "A 14kWh home battery designed in Copenhagen. Stores solar by day, runs your home by night. Backs you up when the grid won't."
- Two CTAs: "Reserve yours — $200" ember filled pill / "Watch 90-second film →" underline
- Below: 3 mini-stats horizontal row, each: number font-display 900 32px ember + label mono 11px ink/60 — "14 kWh · 7kW peak · 12-yr warranty"

SECTION 2 — STAT BAND (autoplay marquee)
- bg-ink text-bg py-12 overflow-hidden
- Slow horizontal marquee: "★ 14 kWh capacity ★ 7 kW peak output ★ -20°C to +50°C operation ★ <40 dB silent ★ IP65 weatherproof ★" repeating
- font-display 32px tracking-wide

SECTION 3 — INSIDE THE BOX (technical breakdown)
- bg-bg py-32 max-w-7xl
- Heading: "Engineered\\nfor a hundred\\ncold nights." font-display 900 80-120px
- Sub: "Every cell, weld, and line of firmware made by us, in Aarhus."
- 4-col grid, each: small ember-numbered "01-04" mono + title font-display 24px + body 14px ink/70
  1) LFP CELLS — "Cobalt-free chemistry. Won't combust. 6,000-cycle rating."
  2) THERMAL — "Liquid-cooled, fanless. Quiet through every season."
  3) FIRMWARE — "Over-the-air updates. Owners get features for life."
  4) DESIGN — "Brushed aluminum, no visible screws. Made to live in your home, not your basement."
- Right side of section: large image placeholder (rounded-3xl aspect-[4/5]) showing exploded-view diagram (use a simple geometric SVG)

SECTION 4 — INSTALL TIMELINE
- bg-mist py-24 rounded-3xl mx-6
- Heading: "From reserve to running, in 14 days."
- Horizontal 4-step timeline, hairline connecting them
- Each step: ember circled number + day label (mono 11px) + title (font-display 20px) + 2-line body (14px)
  • Day 0 — Reserve / Pay $200, lock your spot in queue
  • Day 4 — Site survey / Certified installer comes by
  • Day 11 — Install / 4-hour wall mount + commissioning
  • Day 14 — Powered / Connected to your solar + grid + app

SECTION 5 — TESTIMONIALS
- bg-bg py-32
- Heading: "Trusted in 14,000 homes."
- 3-col grid of quote cards, each: bg-mist rounded-3xl p-8
  • Quote font-display 22px italic ink
  • Attribution row: tiny avatar (gradient circle) + name + city in 13px ink/60
- 3 quotes (write distinct, real-feeling testimonials about reliability, design, customer service from owners in Oslo, Berlin, Boulder)

SECTION 6 — CTA + FOOTER
- bg-ember text-white rounded-t-[64px] mx-6 py-32
- Center: "Power your home\\nlike you mean it." font-display clamp(56px,10vw,160px) leading-[0.9]
- "Reserve your Ember — $200" pill bg-ink text-ember px-8 py-4
- Tiny: "Refundable. Production starts Q3 2026."
- Footer ink bg, white text, mx-6 py-12: 4-col Product / Owners / Company / Legal + copyright

ANIMATIONS REQUIRED
- Hero: subtle parallax on the right image as user scrolls (transform: translateY based on scrollY)
- Marquee band: infinite horizontal scroll
- Section headlines: scroll-triggered fade-up
- Stat numbers: count-up from 0 when entering viewport
- Hover on testimonial cards: lift + ember border glow
- Background grain overlay (animated noise) on hero

ICONS (lucide-react)
Battery, Zap, Sun, Home, Wrench, ArrowRight, Play

OUTPUT
- Single component "EmberLanding", default export, raw JSX
- All Tailwind + <style> for grain noise + marquee + count-up
- No markdown fences`,
  },
  {
    id: "saga-publishing",
    name: "Saga",
    tagline: "Indie author publishing platform",
    category: "Publishing",
    vibe: "Cream & ink · Literary · Cormorant",
    accent: "from-stone-600 to-amber-700",
    preview: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&q=70",
    prompt: `Create a literary publishing platform landing page for "Saga" — where indie authors publish serialized novels for paying subscribers. 6 sections, bookish & elegant.

FONTS
- "Cormorant Garamond" (400/500/700, italic 400/700) — display + body, font-serif
- "Inter" 400/500 for UI labels and buttons, font-sans
- "JetBrains Mono" — micro labels, font-mono
Google Fonts useEffect.

COLORS
- bg #F7F2E8 (parchment cream)
- ink #1A1411 (warm black)
- crimson #8B1F2F (single deep accent)
- sage #6B7355 (secondary)
- gold #B8893E
- line rgba(26,20,17,0.12)

NAV
- 56px sticky, bg #F7F2E8/85 backdrop-blur, border-b border-line
- Left: "Saga" font-serif italic 32px ink with tiny crimson serif "—" suffix
- Center 13px font-sans tracking-wider: Library · Authors · About · Journal
- Right: "Sign in" ghost link + "Start reading" crimson pill px-5 py-2 rounded-full

SECTION 1 — HERO
- max-w-5xl py-32 px-8 centered
- Eyebrow tiny mono uppercase ink/60: "VOL. III — APRIL 2026 — 12,402 READERS THIS WEEK"
- Headline font-serif italic clamp(56px,11vw,180px) leading-[0.95] tracking-tight ink: "Stories,\\nby the\\nchapter."
- Sub 18px ink/75 max-w-xl mx-auto: "Saga is a home for serialized fiction. Authors release one chapter a week. Readers pay $5/month and get every book."
- 2 CTAs: "Start reading — first 30 days free" crimson pill text-white / "Apply to publish →" underline link
- Below: tiny font-sans 12px ink/50 "Now featuring 247 ongoing serials"

SECTION 2 — FEATURED SHELF
- py-24 max-w-7xl
- Heading: "On the shelf this week." font-serif italic 56px
- Horizontal scroll row (overflow-x-auto), 8 book cards w-56 flex-shrink-0
- Each card: aspect-[2/3] gradient placeholder for cover (varied warm tones), rounded-md shadow-md hover:rotate-1 hover:scale-105 transition
- Below cover: title font-serif italic 18px ink, author 13px font-sans ink/60, "Ch. 14" tag mono 11px crimson
- Generate 8 fake fictional book titles + author names with literary flavor

SECTION 3 — HOW SAGA WORKS
- bg-ink text-[#F7F2E8] rounded-3xl mx-6 py-24 px-12
- 2-col split: left heading "How Saga\\nworks." font-serif italic 80px gold
- Right col: 3 numbered explanations
  • 01 — Authors release / "One chapter every Sunday morning. Like a Victorian serial, only on your phone."
  • 02 — Readers subscribe / "$5 a month gives you every chapter, every author, in our library."
  • 03 — Authors get paid / "70% of your share goes to writers — split by minutes you read."
- Each: number mono 14px gold + title font-serif italic 28px + body 14px text-[#F7F2E8]/70
- Hairlines between

SECTION 4 — AUTHOR SPOTLIGHT
- bg-bg py-32
- Heading: "Meet our writers." font-serif italic 56px
- 4-col grid, 12 author cards
- Each: rounded-xl aspect-[4/5] gradient placeholder, name font-serif 20px italic, current title 13px font-sans ink/60, "On chapter 22 →" tiny mono crimson link
- Generate 12 author names + book titles with literary feel

SECTION 5 — READER QUOTE
- bg-bg max-w-3xl mx-auto py-32 text-center
- Massive serif italic " mark crimson opacity-30 absolute behind, 240px
- Quote font-serif italic 36px: "Every Sunday morning I have a new chapter waiting for me. It's the closest thing I've had to magic since I was twelve."
- Attribution tiny mono 12px ink/60: "— Hana O., reader since 2024"

SECTION 6 — CTA + FOOTER
- py-32 bg-crimson text-bg rounded-t-[64px] mx-6
- Center: font-serif italic clamp(56px,10vw,160px) "Begin again."
- "Start your 30 days" pill bg-bg text-crimson px-8 py-4
- Below: tiny "Cancel anytime · No ads, ever"
- Footer ink bg, cream text, mx-6 py-16: 5-col Library / Authors / About / Press / Legal + huge "Saga." font-serif italic 96px gold + © line mono

ANIMATIONS REQUIRED
- Book covers in shelf: subtle hover lift + slight rotate
- Headlines: scroll-triggered fade-up via IntersectionObserver
- Featured shelf: smooth horizontal scroll snap
- Quote mark: gentle fade-in scale
- Page transitions: ink underline draw on hover for nav links

ICONS (lucide-react)
BookOpen, Feather, ArrowRight, Quote, Mail

OUTPUT
- Single component "SagaLanding", default export, raw JSX
- All Tailwind + <style> for serif fallback + scroll snap + underline draw
- No markdown fences`,
  },
];