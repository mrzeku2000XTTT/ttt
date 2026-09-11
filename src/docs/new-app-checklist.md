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

## Apps built with this checklist
- **Kanvas** (`/Kanvas`) — image markup, clip, crop & annotate studio, Scorpion-wallet-gated. Logo + hero generated 2026-09-11.
- **CAM** (`/CAM`) — cinematic camera controller: 10 camera moves over any image, shot sequences & storyboard export, Scorpion-wallet-gated. Logo + hero generated 2026-09-11.