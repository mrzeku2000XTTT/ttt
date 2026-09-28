# New App Checklist — READ THIS BEFORE GENERATING ANY NEW APP

> Every new app in the TTT Super App Store must follow this checklist.
> Check this file first, then build. Do not skip steps.

---

## 1. Naming & identity
- Pick a unique, on-brand name (Kaspa / TTT flavor preferred).
- Generate a **unique logo** (flat neon-green vector icon on near-black, no text) via `generate_image`.
- Generate a **unique hero image** for the landing (blended edges, dark charcoal/eggplant theme, neon-green accents, no text) via `generate_image`.
- Never reuse another app's logo or hero.

## 2. Landing page (required for every new app)
- **LANDING FIRST — non-negotiable.** Opening the app's route must always show the landing page first, even if the wallet is already connected. Gate the studio behind a `sessionStorage` flag (e.g. `kanvas_entered`): until the user clicks the CTA, keep the landing on screen. CTA reads "Connect Scorpion" with no wallet, "Enter Studio / Enter workspace" when the wallet is already connected.
- Unique landing page with: topic headline, blended hero image, logo, and a short description.
- **Connect Scorpion wallet** button (use `useKcc20Wallet` from `@/lib/useKcc20Wallet`).
- **Back to landing** button (logo click returns to landing; studio has a "Home" button).
- **Exit to Store** button (navigates to `/AppStoreV2`).
- Apply the scoped dark theme (charcoal/black + `#00ff99` green accents). Reuse the `.kc-page` pattern or a scoped CSS block — do not leak colors to other apps.
- **Readability:** muted/secondary text must stay light (≥70% lightness) on dark backgrounds — never dark gray on black.
- **No overlapping UI:** hero stat cards, pills and badges must use normal flex/grid flow (or sit in a container with an explicit height) — never stacked absolutes inside a zero-height column, they collapse and pile on top of each other.

## 3. Studio / workspace (the actual app)
- Gated behind wallet connection — landing shows until connected, studio shows after.
- Full working feature, no stubs: every button works, content renders, export/finish flow completes.
- Non-scrollable dashboard where appropriate; big-box widgets avoided; minimal neon-green iconography.

## 3b. Mobile (phone) layout — required for every studio
- The studio must **fit the phone screen**: pin the root to the viewport (`h-[100dvh] overflow-hidden`, relaxed at `lg:`) and stop the page from scrolling — header, main surface and tool bar all stay put.
- Never stack the whole desktop column down the page. Either show **one panel at a time** behind a bottom tab bar (FRAMEZ: Director / Film / Code) or move the controls into a **slide-up sheet** (TALKSTICK studio).
- **Nothing may overlap.** Leave a clear lane for the global floating "Exit to Store" button (`pr-20 sm:pr-40` on the top bar), or add the route to `HIDDEN_PATHS` in `src/components/BackToStore.jsx` when the app has its own Store link (TALKSTICK does this for `/TalkStick` and `/TalkStickStudio`).
- Reserve the home indicator: `padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px))`. Touch targets ≥ 40px; inputs stay 16px so iOS never zooms.
- Anything that can outgrow the screen scrolls **inside itself**, never the page. Test at **320 / 360 / 390 / 440px** — see [`mobile-layout-standard.md`](./mobile-layout-standard.md).

## 4. Routing
- Add an explicit `<Route>` in `src/App.jsx` (the pagesConfig loop does NOT pick up new pages).
- Import the page near the other page imports.
- Add the app's route paths to `HIDDEN_PATHS` in `src/components/BackToStore.jsx` so the global floating "Exit to Store" button doesn't duplicate the in-app one.

## 5. App Store listing
- Add an entry at the **top** of `APPS` in `src/components/appstore2/appCatalog.js`:
  `{ name, path, cat, logo, desc }`
- Use the generated logo URL. Write a one-line description.

## 6. Don't
- Never delete working pages or code.
- Don't change business logic of unrelated apps.
- Don't add extra features the user didn't ask for.

---

> Landing pages: every app opens on a landing built to the shared layout in
> [`app-landing-standard.md`](./app-landing-standard.md). PRISM is the reference implementation.
>
> Phone layouts: every studio fits the screen with nothing overlapping — see
> [`mobile-layout-standard.md`](./mobile-layout-standard.md). TALKSTICK studio
> (sheet) and FRAMEZ (bottom tabs) are the reference implementations.

## Apps built with this checklist
- **TALKSTICK** (`/TalkStick`) — real-time talking characters: drop in artwork or pick a stickman, place the eyes/nose/mouth, drive the mouth from a mic or an audio file, build the scene from generated or uploaded props and caption it, then export frames. Landing at `/TalkStick`, studio at `/TalkStickStudio`. **Phone layout:** the stage and its timeline stay pinned and the whole controls panel moves into a slide-up sheet — reference implementation for the sheet pattern in [`mobile-layout-standard.md`](./mobile-layout-standard.md).
- **FRAMEZ** (`/FrameZ`) — coded motion films (HyperFrames for everyone): describe a film and the agent plans the shots, writes the HTML/JS for each one live as thinking bubbles, renders it in a same-origin iframe and exports a real video file. **Phone layout:** one panel at a time behind a Director / Film / Code bottom tab bar, auto-switching to the film when the build finishes — reference implementation for the tab pattern in [`mobile-layout-standard.md`](./mobile-layout-standard.md).
- **KYDONIA** (`/Kydonia`) — pasted-URL searchable database. Paste one link or a whole reading list; each page is fetched once (robots.txt honoured, no paywall or login bypass), cleaned and folded into a real inverted index built in the browser, then queried with BM25 — ranked verbatim passages with the match highlighted, plus a ranking explainer showing the per-term tf, idf and field boosts behind every score. Deterministic, offline, private per user (RLS owner-scoped), zero credits per query. Landing-first, KCC20-gated; Martian identity — near-black with rust→ember accents, monospace throughout, and a procedural ASCII Mars globe as the hero (drawn live in characters, no image asset). Logo generated 2026-09-26.
- **GLYPH** (`/Glyph`) — image → visual code. Drop any photo and it is rebuilt on the spot out of characters, dither, mosaic tiles, dots, halftone, crosshatch, LEGO, disco, matrix or mixed bands — 12 renderers plus a stackable effect pass (bloom, glow, CRT, scanlines, film grain, vignette, RGB split, glitch, blur), all drawn on canvas in the browser. Uploading always transforms: a controlled randomiser picks the renderer, character set, cell size, palette and 1–3 effects, and a seed makes every result reproducible. Draggable before/after slider, live sliders with no Apply, 1×/2×/4× PNG/JPG/WEBP export and a real WEBM recorder for the animated styles. Landing-first, KCC20-gated; soft-glass cyan→blue identity. Logo + hero generated 2026-09-26.
- **PRISM** (`/Prism`) — video inspector: drop any MP4 and it is decoded in the browser — sampled frames are measured for cuts, shot lengths, pacing, motion between samples, brightness, white coverage and palette by area, then a vision read reports the typography, the animation on each element and a keyframe recipe to rebuild the piece. Minimal white-light identity (scoped `.prism-page` theme, the only colour is the prism spectrum). Landing-first, KCC20-gated. Original logo + hero generated 2026-09-24.
- **Morph** (`/Morph`) — Motion Studio: a real animation engine with split VIEWPORT/FINAL surfaces, an RGB (X/Y/Z) transform gizmo, true point-by-point vector shape morphing, a keyframe timeline, and an AI director that writes the scene keyframes. Landing-first, KCC20-gated; monochrome identity to match the studio. Original logo + hero generated 2026-09-24.
- **Hybrid** (`/Hybrid`) — social engagement auditor: paste any channel/video/profile link, Hybrid resolves the real channel from the live web and returns an engagement score, what's holding you back, ranked weekly actions, content ideas with hooks, and a posting plan. Landing-first, KCC20-gated; docs curated in `appDocsData.js`. Original logo + hero generated 2026-09-23.
- **Product Studio** (`/ProductStudio`) — AI product-image asset collection with upload/paste references, draggable canvas, motion presets, and browser preview. Original logo + hero generated 2026-09-17.
- **ClutchKAS** (`/ClutchKAS`) — VALORANT highlight feed, uploaded MP4/WebM or YouTube embeds, fan-set KAS heart tips with Scorpion approval. Landing-first, KCC20-gated; TTT sign-in for publishing. Original logo + hero generated 2026-09-13.
- **Kanvas** (`/Kanvas`) — image markup, clip, crop & annotate studio, Scorpion-wallet-gated. Logo + hero generated 2026-09-11.
- **CAM** (`/CAM`) — cinematic camera controller: 10 camera moves over any image, shot sequences & storyboard export, Scorpion-wallet-gated. Logo + hero generated 2026-09-11.
- **BIBLIA** (`/Biblia`) — "The Bible: Scroll. Read. Reflect." infinite KJV verse feed; buttonless cream/gold landing that enters on any input; no wallet gate by explicit app spec (quiet by design). Logo + hero generated 2026-09-11. Verses served factually from bible-api.com (public-domain KJV) via `bibliaRandomVerse` function.
- **KILN** (`/Kiln`) — image → working UI components. Drop a screenshot, mock or component sheet (or paste an image link) and `kilnAgent` rebuilds it as one self-contained 1:1 HTML document, mapping every block onto the ETA component model (`src/docs/ETA_ANIMATION_EDITOR.md`, carried into the agent as `base44/shared/kilnEtaModel.ts`). The studio streams the real work as code while it builds, then keeps editing the component in chat with ETA components, text presets, keyframes and match transitions. Landing-first, KCC20-gated; cream/paper identity with dark-chocolate + amber gradient and pixel-block widgets. Logo + hero generated 2026-09-25.