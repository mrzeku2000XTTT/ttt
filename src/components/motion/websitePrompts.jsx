// Curated structured website prompts — inspired by awesome-gpt-image-2-prompts
// Organized into reusable patterns for vibe-code landing page generation
export const WEBSITE_PROMPTS = [
  // ──────────────── E-COMMERCE ────────────────
  {
    id: "ecom-luxury-perfume",
    case: "Case 01",
    category: "E-commerce",
    title: "Luxury Perfume Product Page",
    author: "@Polanco_IA",
    tagline: "Editorial fragrance landing — marble, amber, gold",
    color: "from-amber-600 to-rose-700",
    structure: [
      "Hero — full-bleed marble surface, perfume bottle floating, single italic serif headline",
      "Story — paragraph essay block with deckle-edge image",
      "Notes pyramid — top/heart/base notes laid out as type specimen",
      "Buy panel — sticky right rail with size selector + Add to Bag",
      "Press strip — Vogue · Elle · Harper's quotes in tiny serif",
    ],
    prompt: `Build a luxury perfume product page called "AMBRE 07".

AESTHETIC
- Editorial fragrance house — marble, gold leaf, deep amber
- Fonts: Cormorant Garamond italic (headlines) + Inter (UI)
- Palette: bone #F4EFE6, ink #1A1411, amber #B8893E, rose-shadow #8B5A4A

SECTIONS
1) HERO — full-bleed marble texture bg, perfume bottle floating mid-page (use rounded glass mockup), single huge serif italic headline "Carry the night." 96-180px clamp. Eyebrow "EAU DE PARFUM · 50ML" mono 11px.
2) STORY — 2-col, left small caps "STORY №07", right 3 italic serif paragraphs about provenance.
3) NOTE PYRAMID — 3 vertically stacked rows: Top (Bergamot · Pink Pepper) / Heart (Rose · Iris) / Base (Amber · Oud · Vanilla) — each row = serif italic 32px label + ingredient list 14px.
4) BUY PANEL — sticky right column: size selector pills (30ml · 50ml · 100ml), price in serif 36px, "Add to bag" amber pill button, free shipping note.
5) PRESS — horizontal row of 5 italic press-quote cards on cream cards.

ANIMATIONS
- Bottle: subtle parallax + idle float (translateY infinite)
- Scroll-triggered fade-up reveals
- Magnetic hover on Add to bag
- Marble grain animated noise overlay`,
  },
  {
    id: "ecom-skincare",
    case: "Case 02",
    category: "E-commerce",
    title: "Minimalist Skincare Product Studio",
    author: "@Strength04_X",
    tagline: "Studio-shot skincare bottle on neutral set",
    color: "from-stone-300 to-emerald-400",
    structure: [
      "Hero — single bottle on pastel sweep backdrop, ingredient label",
      "Routine — 3-step morning/night flow",
      "Ingredient grid — 6 hero ingredient cards",
      "Reviews — star average + 4 verified reviews",
      "Subscribe band — 15% off recurring",
    ],
    prompt: `Build a minimalist skincare e-commerce page called "SERUM No.3".

AESTHETIC
- Calm, clinical, Aesop-meets-Glossier
- Fonts: Söhne fallback to Inter (display), Inter (body)
- Palette: bone #F5F2ED, sage #B5C4B0, ink #1A1A1A, accent #2D5A3D

SECTIONS
1) HERO — large product bottle photo (gradient placeholder) on left, right text: tiny eyebrow "VITAMIN C 15% · APRIL DROP", headline "Brighter, by Tuesday." 56-96px font-light, sub paragraph 16px ink/70, "Add — $48" pill.
2) ROUTINE — 3 numbered cards horizontal: 01 Cleanse / 02 Treat / 03 Protect — each with thin-line icon + 2-line description.
3) INGREDIENT GRID — 6 cards: % concentration as huge number, ingredient name, what it does (1 line). e.g. "15% L-ASCORBIC" / "0.5% RETINAL" / "5% NIACINAMIDE".
4) REVIEWS — top row "4.9 ★ from 2,148 reviews", below 4 verified review cards with star + avatar + quote 14px italic.
5) SUBSCRIBE BAND — sage bg, "Subscribe & save 15%" headline, ship-frequency selector pills.

ANIMATIONS
- Bottle: hover tilt + soft shadow lift
- Star rating count-up
- Section reveals via IntersectionObserver`,
  },

  // ──────────────── AD CREATIVE ────────────────
  {
    id: "ad-streetwear",
    case: "Case 03",
    category: "Ad Creative",
    title: "Streetwear Sneaker Drop Page",
    author: "@AlwaveNazca",
    tagline: "High-energy sneaker drop with countdown",
    color: "from-rose-600 to-orange-500",
    structure: [
      "Hero — sneaker hero shot, drop countdown, oversized brand wordmark",
      "Lookbook — scrolling editorial photo grid",
      "Drop spec — colorway, materials, sizes",
      "Notify — email capture for restock",
      "Marquee — 'SOLD OUT IN 4 MIN LAST DROP' loop",
    ],
    prompt: `Build a streetwear sneaker drop page for "VOLT 02 — Acid Lime".

AESTHETIC
- High-energy hypebeast drop, brutalist + neon
- Fonts: Bebas Neue (display 200-400px), JetBrains Mono (UI)
- Palette: ink #050505, paper #F0EFEA, volt #C9F22F (electric lime), red #FF3B30

SECTIONS
1) HERO — split layout. Left: oversized vertical wordmark "VOLT/02" running up the side font-display 320px volt. Center: sneaker rendered hero photo (gradient 3D placeholder). Right: real-time drop countdown "DROPS IN 02D : 14H : 22M : 09S" mono 18px. Below countdown: "$220 · LIMITED 500 PAIRS" + "Notify me" pill.
2) LOOKBOOK — 9-image asymmetric grid (varied aspect ratios), gradient placeholders, hover scale-105. Caption overlay 11px mono.
3) DROP SPEC — bg-volt text-ink py-24, 3-col: COLORWAY (ACID LIME / OFF-WHITE / GUM), MATERIALS (Nubuck · Mesh · TPU heel), SIZES (US 6–13 — half sizes 8–11.5).
4) NOTIFY BAR — Full-width band, simple email input + "Get the alert" red button.
5) MARQUEE — bottom band, infinite scroll "★ LAST DROP SOLD OUT IN 4 MINUTES ★ JOIN THE WAITLIST ★" volt text on ink.

ANIMATIONS
- Countdown live ticking
- Marquee infinite scroll
- Sneaker hover spin (rotateY)
- Volt cursor halo on hero`,
  },
  {
    id: "ad-watch",
    case: "Case 04",
    category: "Ad Creative",
    title: "Luxury Chronograph Watch Page",
    author: "@AlwaveNazca",
    tagline: "Heritage watch product page",
    color: "from-stone-700 to-amber-500",
    structure: [
      "Hero — close-up macro shot of dial, technical callouts",
      "Movement — exploded view of internals",
      "Heritage — timeline 1908 → today",
      "Configurator — strap + case material picker",
      "Atelier visit booking",
    ],
    prompt: `Build a luxury heritage watch product page for "MARITIME CHRONO 1908".

AESTHETIC
- Old-world heritage, Patek-Philippe gravity
- Fonts: Cormorant SC (display), Inter (body), Roboto Mono (specs)
- Palette: ink #0A0908, paper #EFE9DA, gold #B89B5E, navy-deep #14213D

SECTIONS
1) HERO — full-bleed dark navy backdrop, hero macro shot of watch dial centered. Surrounding it: 6 thin-line technical callouts pointing to features (small caps mono 10px, hairline lines drawn with SVG). Headline below in tiny 13px letter-spacing-widest "MARITIME CHRONOGRAPH · REF. 1908.04 · 2026 EDITION".
2) MOVEMENT — paper bg, exploded-view of watch parts (use stacked SVG/divs). Left: serif 56px italic "118 parts. 14 jewels. One quiet certainty.". Right: 4 spec rows.
3) HERITAGE TIMELINE — horizontal scrollable row: 1908 / 1925 / 1949 / 1971 / 1994 / 2019 / 2026 — each year with serif label + 2-line caption + tiny gradient image.
4) CONFIGURATOR — interactive: case material pills (steel · rose gold · platinum), strap pills (alligator black · vintage tan · bracelet). Live price updates 36px gold serif.
5) ATELIER — book a private viewing: name + email + city, "Request appointment" gold pill.

ANIMATIONS
- Dial: gentle continuous rotation of seconds hand
- Callouts: draw-on-scroll for hairline pointer lines
- Timeline: smooth horizontal scroll snap
- Configurator: smooth color/material crossfade`,
  },

  // ──────────────── PORTRAIT / EDITORIAL ────────────────
  {
    id: "editorial-magazine",
    case: "Case 05",
    category: "Editorial",
    title: "Independent Print Magazine Subscription",
    author: "@_LaurentB",
    tagline: "Quarterly print magazine cover & subscribe page",
    color: "from-rose-300 to-stone-700",
    structure: [
      "Hero — issue cover artwork, issue number, tagline",
      "From the editor — letter excerpt",
      "Inside this issue — 4-feature grid",
      "Subscribe tiers — print only / print + digital",
      "Past issues — horizontal scroll archive",
    ],
    prompt: `Build a subscription page for "ATELIER QUARTERLY" — an independent design + culture print magazine.

AESTHETIC
- Lo-fi editorial, Apartamento + Kinfolk + The Gentlewoman
- Fonts: GT Sectra (display fallback to Cormorant), Söhne (body fallback to Inter), Maison Mono (UI fallback to JetBrains Mono)
- Palette: paper #ECE7DC, ink #1F1B14, rose #C97766, sage #8FA98C

SECTIONS
1) HERO — large cover image left (gradient placeholder, aspect 3/4). Right: tiny mono "ISSUE №14 · SPRING 2026", massive serif italic headline "Slow ideas, printed slowly." 64-120px clamp. Below: "Subscribe — €68 / year" pill + "Read the editor's letter →" underline link.
2) FROM THE EDITOR — paper bg with deckle-edge effect (use border-radius variations + shadow), 3 italic serif paragraphs centered max-w-2xl, signed off "— Lena Rocha, Editor".
3) INSIDE — 4-card grid (2x2 on lg), each card: rounded image + tiny number + headline + 1-line dek + reading time.
4) SUBSCRIBE — 2 cards centered: "Print only €68/yr" / "Print + Digital archive €92/yr (most popular, sage outline highlight)".
5) ARCHIVE — horizontal scroll, 12 past covers w-44 flex-shrink, each: cover image + issue number + season.

ANIMATIONS
- Cover hover: subtle 3D tilt
- Section transitions: sepia fade
- Pull-quote: serif drop-cap reveal
- Archive: smooth snap scroll`,
  },

  // ──────────────── UI / SAAS MOCKUPS ────────────────
  {
    id: "ui-saas-dashboard",
    case: "Case 06",
    category: "SaaS",
    title: "Analytics SaaS Marketing Page",
    author: "@IndieDevHailey",
    tagline: "Dark-mode SaaS with embedded product mockups",
    color: "from-violet-600 to-cyan-400",
    structure: [
      "Hero — headline + animated dashboard mockup",
      "Logos strip — customer wall",
      "Feature triplet with mini product UI screenshots",
      "Live metric — count-up bar of users / events",
      "Pricing — 3 tiers + FAQ accordion",
    ],
    prompt: `Build a marketing page for "PIVOT" — a real-time product analytics SaaS for B2B teams.

AESTHETIC
- Polished dark SaaS, Linear + Vercel + Stripe energy
- Fonts: Inter Display (display), Inter (body), JetBrains Mono (numbers)
- Palette: bg #0A0A0F, ink #FAFAFA, violet #7C3AED, cyan #06B6D4, line rgba(255,255,255,0.08)

SECTIONS
1) HERO — eyebrow pill "✦ Now with funnel-replay" tiny gradient text. Headline 72-128px font-display tracking-tight "Real-time product\\nintelligence." Sub max-w-xl 17px text-white/60. CTAs: violet "Start free" + "Watch demo →" ghost. Big animated dashboard mockup right side: simulate a chart with animated lines (animate strokeDashoffset), KPI cards with count-up numbers, sparklines.
2) LOGOS STRIP — bg-white/[0.02], py-12, "Trusted by 1,200+ teams" tiny + 8 fake brand wordmarks in grayscale 60% opacity, hover full opacity.
3) FEATURE TRIPLET — 3-col, each: small icon in 48px violet/15 rounded-2xl + title 22px font-bold + body 15px white/60 + mini animated UI mockup (gradient panel with fake chart).
4) LIVE METRIC — bg gradient violet→cyan radial, headline "Tracking 4.2B events per day" font-display 64px, count-up live as user enters viewport.
5) PRICING — 3 cards, middle "Pro" highlighted with violet ring + "Most popular" pill. Tiers: Hobby $0 / Pro $24/mo / Enterprise "Talk to us". Bullets with check icon. FAQ accordion below: 6 questions.

ANIMATIONS
- Dashboard mockup: animated line draws + count-up
- Hero spotlight: mouse-follow violet glow
- Logos strip: subtle marquee
- FAQ: smooth height transitions
- Pricing card: hover lift + ring glow`,
  },
  {
    id: "ui-livestream",
    case: "Case 07",
    category: "SaaS",
    title: "Livestream Commerce App Marketing",
    author: "@sjbbxhz",
    tagline: "Mobile-first livestream shopping app",
    color: "from-pink-500 to-fuchsia-600",
    structure: [
      "Hero — phone mockup with live stream UI",
      "How it works — 3-step host flow",
      "Creator earnings calculator",
      "Featured creators carousel",
      "App store CTA",
    ],
    prompt: `Build a marketing page for "TUNE" — a livestream commerce app for indie creators selling direct to fans.

AESTHETIC
- Bold, Gen-Z, mobile-first
- Fonts: Anton (display), Inter (body), Söhne mono fallback to JetBrains
- Palette: ink #0A0A0A, paper #FFEFE0, pink #FF2D87, fuchsia #B5179E, lime #C9F22F

SECTIONS
1) HERO — split. Left: 8px pink ring on a corner. Eyebrow "💸 LIVE NOW · 412 STREAMS". Headline font-display 96-200px clamp uppercase: "GO LIVE.\\nGET PAID.". Sub 16px ink/70. CTAs: pink filled "Download app" + "Apply as creator". Right: tilted iPhone mockup showing fake livestream UI — live red dot, host name, viewer count, product card overlay, comment stream.
2) HOW IT WORKS — 3 horizontal steps, big circled emoji icons, paper bg cards: 01 Go live in 30 seconds / 02 Tag products in your stream / 03 Get paid the next day.
3) EARNINGS CALCULATOR — interactive slider: "Stream X minutes per week" → live count-up of estimated monthly $ in font-display 72px lime. Below: tiny "Based on average creator earnings".
4) FEATURED CREATORS — horizontal scroll, 6 creator cards w-64 each: gradient avatar + handle + niche + earnings (e.g. "@maria.thrifts · vintage · $14K last month").
5) CTA — full-width pink bg, headline "Your audience is ready." 96px display ink, App Store + Google Play badges.

ANIMATIONS
- Phone mockup: idle floating + slight rotateZ wobble
- Live red dot: pulse animation
- Comment stream: messages slide up infinite
- Slider: smooth handle drag with value reveal
- Featured cards: snap scroll`,
  },

  // ──────────────── CHARACTER / BRAND IDENTITY ────────────────
  {
    id: "brand-mascot",
    case: "Case 08",
    category: "Brand",
    title: "Mascot-Driven Brand Identity Page",
    author: "@Colin_Leeee",
    tagline: "Cute character-led brand presentation",
    color: "from-yellow-400 to-pink-500",
    structure: [
      "Hero — full mascot character + brand name",
      "Mascot expression sheet — 6 poses",
      "Brand kit downloads — logo · type · palette",
      "Application gallery — packaging · merch · UI",
      "Newsletter — 'Join the herd'",
    ],
    prompt: `Build a brand identity showcase page for "BLOO" — a cheerful mascot-led indie kids snack brand.

AESTHETIC
- Playful, illustrated, Saturday-morning-cartoon
- Fonts: Recoleta or Fraunces (display fallback to Cormorant), Inter (body)
- Palette: cream #FFF4D4, sky #79C7FF, pink #FF8FB1, leaf #6FBF73, ink #1F2937

SECTIONS
1) HERO — paper cream bg with subtle dot pattern. Center: huge illustrated mascot character (use SVG circle composition placeholder for "Bloo" — round blue body, smiling face). Above mascot: small "MEET BLOO 👋". Below: serif italic 96-160px "Snacks for tiny humans." with hand-drawn-feel underline. CTAs: pink filled "Shop snacks" + sky outlined "Find a store".
2) EXPRESSION SHEET — 6 mascot poses in 3-col grid: HAPPY · HUNGRY · SLEEPY · SILLY · STAR-EYED · SUPER. Each card: cream bg, mascot pose (geometric svg), label small caps mono.
3) BRAND KIT — bg-sky, 3-col download cards: LOGO (.svg .png) / TYPOGRAPHY (Recoleta + Inter) / COLOR PALETTE (5 hex chips). Each card has download arrow icon.
4) APPLICATIONS — 6-image asymmetric grid: cereal box / juice pouch / sticker pack / app onboarding / billboard / merch tote. Gradient placeholders rounded-2xl.
5) NEWSLETTER — pink band, headline "Join the Bloo herd 🩵", email input + "Subscribe" leaf button. Tiny 11px legal beneath.

ANIMATIONS
- Mascot: idle bounce (translateY 0→-8 infinite)
- Expressions: hover swap to a tiny wave animation
- Brand chips: hover copy hex to clipboard
- Stickers/applications: hover rotate+scale
- Decorative shapes drifting in bg`,
  },

  // ──────────────── POSTER / EVENT ────────────────
  {
    id: "event-conference",
    case: "Case 09",
    category: "Event",
    title: "Tech Conference Microsite",
    author: "@xc5_",
    tagline: "Bold conference event page with speakers",
    color: "from-blue-600 to-emerald-400",
    structure: [
      "Hero — event title, dates, city, ticket CTA",
      "Speakers grid — 12 portraits with talk titles",
      "Schedule — day-by-day session blocks",
      "Venue + travel info",
      "Sponsor wall + tier badges",
    ],
    prompt: `Build a tech conference microsite for "SHIFT/26" — a 2-day product engineering conference in Lisbon.

AESTHETIC
- Editorial-meets-tech, brutalist grid + serif touch
- Fonts: PP Editorial New (fallback Cormorant) display, Inter body, JetBrains Mono numbers
- Palette: paper #F2EFE8, ink #0F0F0F, electric #1F4FFF, sun #FBBF24

SECTIONS
1) HERO — paper bg. Tiny mono "13—14 NOVEMBER 2026 · LISBON". Massive serif italic clamp(80px,16vw,260px) "SHIFT/26" with year underlined sun. Sub mono 14px "Two days. Eighty speakers. One question: what's next?". Two CTAs: electric filled "Get tickets — €380" + "View schedule →".
2) SPEAKERS — 4-col grid, 12 speaker cards. Each: square gradient avatar + name serif italic 22px + role mono 12px ink/60 + talk title serif 16px + day badge "DAY 01"/"DAY 02".
3) SCHEDULE — 2-col split: DAY 01 · DAY 02. Each column: time-stamped session blocks, hairline border-t. e.g. "09:30 — KEYNOTE — Building for the Next Billion — Maya Obi". Click to expand abstract.
4) VENUE — split: left text (3 paragraphs about the venue + transit + hotels), right: rounded-3xl gradient placeholder map image, "Get directions" link.
5) SPONSORS — band: 3 tiers — TITLE / PARTNERS / FRIENDS — with sized logo placeholders shrinking by tier. Tiny "Become a sponsor →" link bottom.

ANIMATIONS
- Hero year underline: draw-on-load
- Speakers: hover lift + electric ring
- Schedule: expand session abstracts smoothly
- Map: parallax on scroll
- Sponsor wall: subtle hover desaturation reverse`,
  },

  // ──────────────── COMPARISON ────────────────
  {
    id: "comparison-vs",
    case: "Case 10",
    category: "Comparison",
    title: "Product VS Competitor Comparison Page",
    author: "@Magncsans",
    tagline: "Side-by-side migration / switch landing",
    color: "from-emerald-500 to-zinc-500",
    structure: [
      "Hero — 'Switch from X to Y in 5 minutes'",
      "Feature parity matrix — checked rows",
      "Migration steps — visualized",
      "Customer switch stories",
      "Free migration support CTA",
    ],
    prompt: `Build a competitor switch / migration landing page for "FORGE" (a code review tool) targeting users of "OldRev".

AESTHETIC
- Confident, technical, light-mode
- Fonts: Inter Display (display), Inter (body), JetBrains Mono (UI)
- Palette: paper #FFFFFF, ink #0F0F11, emerald #10B981, danger-soft #94A3B8, line #E2E8F0

SECTIONS
1) HERO — eyebrow tiny "SWITCH FROM OLDREV". Headline 56-96px font-display tracking-tight "Move to Forge in\\nan afternoon." Sub max-w-xl 17px ink/60. Two CTAs: emerald "Start free migration" + "Talk to us →" ghost. Right: split-screen visual showing OldRev (faded gray) → Forge (vivid emerald).
2) FEATURE PARITY MATRIX — table-style, 3 columns: Feature / OldRev / Forge. ~12 rows with check or x icons (X for OldRev = gray slash, check for Forge = emerald). Categories: Speed · CI integrations · Branch policies · Code search · AI review · Cost.
3) MIGRATION STEPS — 4 horizontal steps: 01 Connect repo / 02 Auto-import history / 03 Invite team / 04 Done. Each: emerald number circle + title 20px + 1-line.
4) CUSTOMER STORIES — 3 testimonial cards: company logo placeholder + quote + name/title + "Migrated in X days" emerald badge.
5) CTA — emerald band, "We'll do the migration for you. Free.", "Book a 30-min migration call" pill bg-ink text-emerald.

ANIMATIONS
- Hero split: animated cross-fade OldRev → Forge
- Matrix: row-by-row check reveal on scroll
- Step numbers: count animation
- Testimonial cards: hover lift
- Background subtle grid pattern`,
  },
];

export const PROMPT_CATEGORIES = ["All", ...Array.from(new Set(WEBSITE_PROMPTS.map((p) => p.category)))];