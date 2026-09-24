# App landing standard

**Every app in the TTT super app store opens on a landing page built to this layout.**
PRISM (`/Prism`) is the reference implementation — `src/components/prism/PrismLanding*.jsx`.

## Why

A landing page is the app's front door. It has to say what the app does, show what it produces,
and give one obvious way in — before anything asks the visitor to log in or connect a wallet.

## The layout, in order

| # | Section | What goes in it |
|---|---------|-----------------|
| 1 | **Header** | Logo + app name + a one-line descriptor. A short nav. A `Store` button back to the app store, and an `Account` button showing the connected wallet or the connect action. |
| 2 | **Hero** | Left: a small badge, a two-line headline (the second line carries the gradient), a one-sentence subhead, and the app's primary input — a real drop zone / picker. A privacy line underneath if the app works locally. Right: a live preview of the app's actual output. |
| 3 | **Feature bar** | 4–5 short items: icon, title, half-line of body. Scannable, one row on desktop. |
| 4 | **Workflow** | Kicker + headline + one-line subhead, then 3–4 numbered steps from input to result. |
| 5 | **What it extracts / produces** | A grid of cards, each with icon, title, body and one real sample value. The last cell is the dark CTA box. |
| 6 | **CTA box** | Dark gradient panel: app name, a one-line promise, and the same primary action as the hero. |
| 7 | **Footer** | Logo, who it is built for, and one line on how it treats the user's data. |

## Rules

- **Landing first.** The working app is never the first thing a visitor sees. Entry is remembered for the session, and the landing has a way back to it.
- **One gate, at the door.** If the app needs a wallet or an account, that happens once when entering — never as a surprise halfway through a task.
- **Every nav item resolves.** An in-page anchor or a route that actually exists. Never ship a nav link to a page that isn't there.
- **The hero input is real.** The drop zone on the landing feeds the app's own input — it is not a decoration that re-opens the app empty.
- **Show the output, don't describe it.** The hero preview uses the app's real numbers and real interface, built in HTML rather than a screenshot so it stays sharp.
- **No invented sample values.** Sample figures in the preview and cards come from a real run of the app.

## Styling

- Background `#FFFFFF`, primary text `#000000`, secondary text `#666666`, hairlines `#F0F0F0` / `#ECECEC`.
- One accent only: the gradient `#0000FF → #A020F0`, used on the headline's second line, step numbers, and the CTA panel. Nowhere else.
- Type: system sans, tight tracking on headlines, 12–14px body, 10–11px for labels and kickers.
- Generous whitespace, centred section headers, rounded 16px cards, hairline borders, no heavy shadows.
- One idea per section. If a section needs a paragraph to explain itself, it is the wrong section.

## Reference files

- `src/components/prism/PrismLanding.jsx` — header, hero split, composition
- `src/components/prism/PrismLandingHero.jsx` — copy + drop zone
- `src/components/prism/PrismHeroMockup.jsx` — the live output preview
- `src/components/prism/PrismLandingFeatures.jsx` — feature bar + workflow
- `src/components/prism/PrismLandingExtracts.jsx` — cards + CTA box
- `src/components/prism/PrismLandingFooter.jsx