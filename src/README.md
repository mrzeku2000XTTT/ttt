# TTT · The Kaspa Super App

> **TTT — "Tap To Tip."** The landing page at [tttz.xyz](https://tttz.xyz) opens on a black void: three serif **T**s set in gold, lit like three crosses in the dark. Underneath, four words: `TAP · TO · TIP`. Then: `地球到火星 · POWERED BY KASPA` — *Earth to Mars*. The whole app flows from that single image.

TTT is the **Kaspa super app**: one React application bundling 100+ live Kaspa-native products — a non-custodial wallet, on-chain tipping and a social feed, autonomous AI agents, x402 payments, covenant NFTs, an L2 bridge, games, media studios, and a marketplace — all sharing one auth layer, one wallet layer, and one design system.

This is the core of the project. Everything else is implementation.

---

## Why this exists

TTT is built on a single contrarian bet, documented in full in [`TTT3_Manifesto.md`](./TTT3_Manifesto.md):

> **You do not build a supercomputer by assembling servers first and writing software second. You build the software first — thousands of small, useful, composable Kaspa applications — and then reverse-engineer the compute fabric from the usage graph those applications generate.**

When autonomous AI agents begin navigating and composing those applications across a network that settles in under a second, the aggregate behavior of millions of agent-to-agent interactions does not resemble an app store. It resembles a **distributed supercomputer that happens to run useful work.** This is the **Agent Internet.**

The application library already exists at a scale sufficient to begin that aggregation. That is what this repository is.

---

## Why Kaspa — how TTT sees it

TTT is Kaspa-native by conviction, not convenience. Every claim below is a measured property of the live mainnet — the same facts surfaced in the in-app **Kaspa onboarding** (`src/components/landing/KaspaPanel.jsx`) the first time a user opens the `[ KASPA ]` panel from the landing page:

1. **Not a chain. A graph.** Kaspa is proof-of-work, but not a blockchain. It uses a **BlockDAG** ordered by the GHOSTDAG protocol. Traditional chains process one block per height and orphan the rest; Kaspa adds blocks to a growing DAG and orders them without discarding any. Parallelism is not penalized — it is the default.
2. **10 blocks per second.** The mainnet targets 10 BPS. A broadcast transaction references a block at most ~100 ms old. Settles in seconds, not minutes.
3. **Sub-second visibility, single-digit-second finality.** Visible in the DAG within one block; high-confidence finality in ~10–30 s. Compare Bitcoin's 10-minute blocks and 60-minute "finality."
4. **Fair from day one.** No premine, no ICO, no dev allocation in genesis. The creators mined alongside everyone else.
5. **Schnorr over secp256k1, Bech32 `kaspa:` addresses, 1 KAS = 10⁸ sompi.** Mass-based fees (not percentage), so a 0.001 KAS transfer costs the same fee overhead as a 10,000 KAS transfer — agent-scale micropayments are economically rational.
6. **Capped declining supply (28.7B KAS)** with a smooth deflationary emission schedule.
7. **L1 token standards** — KRC-20 (fungible), KRC-721 (NFTs), and the KCC covenant roadmap.

On Bitcoin the Agent Internet is incoherent (settlement too slow). On Ethereum base layer it is incoherent (fees too high for micropayments). On proof-of-stake networks it is trust-fragile (committee finality ≠ hashpower finality). Kaspa is the only production PoW network whose physical parameters make agent-scale, micropayment-settled computation mechanically possible.

---

## The home page, decoded

`/` renders [`TTTLanding`](./src/pages/TTTLanding.jsx) — a cinematic title screen:

- A deferred WebGL **cybernetic eye sphere** behind a CRT scanline + noise grain field.
- The **TTT** wordmark in Georgia serif, gradient gold, three crosses glowing in the void. Clicking it enters `/TTTV3`.
- `▶ PRESS START` — pulses; opens the **music player** ("The Dollar Is Dying" by Kas Tunes). Reading the lyrics to the end unlocks `Enter →` to the `/TTTGate` portal.
- A horizontal menu: **TAP** (App Store), **TO** (Feed), **TIP** (Tip), **GATE** (portal), **WALLET**, and **ZK** (admin).
- Corner HUD buttons: `[ ADVENT ]`, `[ VISION ]`, `[ KASPA ]`, and admin-only `[ SCAN ]` (the ZK Agent panel).
- A `🌐` globe button zooms the entire page out into a small world and orbits across **the greater universe** — fifteen sectors: TTT Prime, Agentic World, Kaspa Nations, Igra Horizon, AWA, Sector 6, Sector VI, Igra Agent, Aporia DEX, Klipz, KCC NFT, Kas Command, Kascov, AWA Signer, Kas Signer.

Everything is one app. Every sector is a route.

---

## The core pillars

| Pillar | Routes | What it is |
|---|---|---|
| **Non-custodial wallet** | `Terra`, `Wallet`, `WalletHub`, `ZKWallet` | Send / receive KAS + KRC-20, balances, history, QR, multi-wallet (Kasware + TTT-managed) |
| **On-chain tipping & social** | `Feed`, `Tip`, `SendTip`, `DAGFeed` | Social feed with real KAS tips settled on L1 |
| **Autonomous AI agents** | `AgentZK`, `ZekuAI`, `AIAgentHub`, `Trinity` | Agents with their own Kaspa wallets; plan-act-verify runtime operating live app iframes |
| **x402 payments (AWA)** | `AWA`, `AWASigner` | The first HTTP-402 payment lane on Kaspa — AI services paid per-call in KAS, verified against consensus |
| **Covenant NFTs (KCC)** | `KCC`, `KCCNft` | NFTs enforced by Kaspa L1 covenant++ scripts |
| **Covenant deployer (SuperZK)** | `SuperZK` (admin) | Deploy `zktimelock`, `zkescrow`, `zkvault` on Kaspa |
| **L2 bridge (Igra)** | `IgraHorizon`, `IgraAgent`, `DEX` | KAS ⇄ iKAS bridge to the Igra EVM L2 |
| **Analytics hubs (Slobz)** | `Slobz`, `SlobzTxTracker`, `SlobzSiteTracker` | Plain-English Kaspa TX narratives + real website intelligence |
| **P2P marketplace** | `SlobzMarket`, `SlobzGigs` | Offer board + gig lifecycle (admin-governed) |
| **Games & media** | `Arcade`, `Motion`, `Hikaru`, `Kine`, `VideoStudio`, `BeatCut`, `Klippz` | 100+ apps |

---

## Tech stack

- **Frontend:** React 18 + Vite 6, React Router 6, Tailwind CSS 3, shadcn/ui (Radix), Framer Motion, Recharts, Three.js / React-Three-Fiber, Leaflet, Remotion.
- **BaaS:** Base44 (`@base44/sdk`) — auth, entities (JSON schemas + row-level security), backend functions (Deno Deploy), integrations (InvokeLLM, UploadFile, SendEmail, GenerateImage, GenerateVideo, TTS), automations, in-app agents.
- **Icons:** `lucide-react` only.

---

## Repository layout

```
index.html              # SEO meta, OG tags, boot overlay, Agent Control Bridge (iframe postMessage)
src/
  App.jsx               # Router — single source of truth for <Route>s
  pages/                # One file per route (Home, AWA, Slobz, TTTLanding, …)
  pages.config.js       # LEGACY auto-page registry (old pages only — new routes go in App.jsx)
  components/
    ui/                 # shadcn/ui primitives (one export per file)
    landing/            # Landing page: KaspaPanel, CyberneticEyeSphere, Advent, KaspaDashboard
    tttv3/              # Agent runtime: agentLoop, AgentComputer, ZK* panels, godEngine
    <feature>/          # Feature-scoped folders (slobz, awasigner, kutt, igra, …)
  api/base44Client.js   # Pre-initialized Base44 SDK client
  lib/                  # AuthContext, utils, query-client, TitleManager, NavigationTracker
  docs/TTT3_Manifesto.md   # The full 16-page platform thesis
base44/
  entities/             # JSON schema files (~120) — define DB + RLS
  functions/            # Backend functions: base44/functions/<name>/entry.ts (Deno, ~130)
  agents/               # In-app AI agent configs (.jsonc)
  config.jsonc
public/
  llms.txt              # Compact machine-readable map for AI agents
  robots.txt
```

---

## Conventions (for contributors and AI agents)

1. **Routing:** `src/App.jsx` is the only router. `pages.config.js` is a legacy loop covering old pages only — every new page needs an explicit `<Route>` in `App.jsx`. Never delete the loop.
2. **Never delete working pages or code.** Prefer `find_replace`; create focused new files over bloating existing ones.
3. **Imports** use the `@/` alias (→ `src/`). Never relative `src/…` paths.
4. **Styling:** tokens in `src/index.css`, mapped in `tailwind.config.js`. Use token classes (`bg-primary`, `font-heading`), never hardcoded hex.
5. **Auth** pages (Login/Register/ForgotPassword/ResetPassword) already exist — never recreate. Gate authenticated pages with `ProtectedRoute`.
6. **Entities:** `base44/entities/*.jsonc`, full JSON schema, never declare built-in fields (`id`, `created_date`, `updated_date`, `created_by_id`). RLS per operation.
7. **Backend functions:** `base44/functions/<name>/entry.ts` (Deno). Use `createClientFromRequest(req)` for the SDK.

---

## Local development

```bash
npm install
npm run dev      # Vite dev server
npm run build    # Production build
npm run lint     # ESLint
```

The app talks to the Base44 BaaS at runtime — entities, functions, auth, and integrations are live services, not local files.

---

## Read the thesis

The full technical and philosophical specification — sixteen pages, every claim traceable to a protocol property, a mainnet parameter, or a shipped implementation — is in [`TTT3_Manifesto.md`](./TTT3_Manifesto.md). It is designed for ingestion into a notebook LLM, with each page a discrete semantic unit.

For a compact machine-readable map, see [`public/llms.txt`](./public/llms.txt).

---

## Links

- **Live site:** <https://tttz.xyz>
- **Kaspa:** <https://kaspa.org>
- **Base44 platform:** <https://base44.com>

---

© TTT · Tap To Tip · Powered by Kaspa