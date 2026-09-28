# Mobile Layout Standard — phones first, nothing overlapping

> Every studio, workspace and dashboard in the TTT Super App Store must work on a
> phone. Read this alongside [`new-app-checklist.md`](./new-app-checklist.md)
> before building any app.
>
> Reference implementations: **TALKSTICK studio** (`/TalkStickStudio`) and
> **FRAMEZ** (`/FrameZ`).

---

## 1. The rule: fit the screen, don't scroll the page

A phone is not a narrow desktop. The desktop layout may **never** be stacked down
the page — the header, the main surface and the tool bar stay on screen while you
work.

- Pin the root to the viewport, then relax it at desktop:
  `h-[100dvh] overflow-hidden lg:h-auto lg:min-h-screen lg:overflow-visible`.
- The middle surface takes what is left: `flex-1 min-h-0`.
- Anything that can outgrow the screen scrolls **inside itself** — never the page.

## 2. Two approved patterns

Pick one; don't invent a third.

**A. One panel at a time — bottom tab bar.** Use when the app has 2–4 distinct
surfaces. FRAMEZ shows `Director | Film | Code`; the bar is pinned to the bottom
and each panel fills the space above it. Auto-switch to the result panel when a
long job finishes, so the payoff lands on screen.

**B. Slide-up sheet.** Use when the app has one main canvas plus a control panel.
The TALKSTICK studio keeps the stage and timeline pinned and moves the whole
controls panel into a sheet: a header toggle opens it, a scrim closes it, and it
scrolls inside itself.

```css
.sheet { position: fixed; left: 0; right: 0; bottom: 0; z-index: 80;
         max-height: 78dvh; transform: translateY(101%); transition: transform .24s ease; }
.sheet.is-open { transform: translateY(0); }
```

## 3. Never overlap

- Leave a clear lane for the global floating **Exit to Store** button: give the
  top bar `pr-20 sm:pr-40`.
- If the app already has its own Store link in its header, add the route to
  `HIDDEN_PATHS` in `src/components/BackToStore.jsx` instead — TALKSTICK does
  this for `/TalkStick` and `/TalkStickStudio`.
- Never place two absolutely-positioned elements in the same corner, and never
  let a badge or pill float over a control.
- Truncate long titles (`min-w-0` + `truncate`) instead of letting them push
  buttons off screen.

## 4. The detail that makes it feel premium

- Reserve the home indicator:
  `padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px))`.
- Touch targets ≥ 40px tall; inputs stay at **16px** so iOS never zooms on focus.
- Dim the secondary line rather than dropping it; keep the mark, hide the badge
  below 760px (`.ts-head .ts-badge { display: none }`).
- Below 400px tighten padding and type rather than wrapping the header.
- Respect `prefers-reduced-motion` on every sheet/tab transition.

## 5. Test matrix

Check every studio at **320, 360, 390 and 440px** wide, portrait and landscape:
nothing overflows, nothing overlaps, no horizontal scrollbar, and the primary
action is reachable without scrolling.