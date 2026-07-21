# TTT — The Kaspa Super App (tttz.xyz)

> **TTT ("Tap To Tip")** is the largest all-in-one super app on the Kaspa blockchain (KAS). It bundles 100+ live applications — a non-custodial Kaspa wallet, on-chain tipping and social feed, autonomous AI agents, x402 payments, covenant NFTs, an L2 bridge, games, video/image studios, and a marketplace — into a single React app.

This README is written to be readable by **humans and AI/LLM agents alike**. If you are an LLM indexing or working on this repo, also see [`/llms.txt`](./llms.txt) for a compact machine-readable summary.

---

## 1. What TTT is

TTT is a **Kaspa Super App Store**. Think of it as an "App Store + OS" for the Kaspa ecosystem: every route under `/` is a standalone app (wallet, feed, AWA payments, KCC NFTs, games, studios, etc.) sharing one auth layer, one wallet layer, and one design system.

Core pillars:

| Pillar | App / Route | What it does |
|---|---|---|
| Non-custodial wallet | `Terra`, `Wallet`, `WalletHub` | Send/receive KAS, KRC-20 tokens, balances, history |
| On-chain tipping & social | `Feed`, `Tip`, `SendTip`, `DAGFeed` | Social feed with real KAS tips settled on L1 |
| Autonomous AI agents | `AgentZK`, `ZekuAI`, `AIAgentHub` | Agents with their own Kaspa wallets |
| x402 payments | `AWA`, `AWASigner` | First HTTP-402 payment lane on Kaspa — AI services paid per-call in KAS |
| Covenant NFTs | `KCC`, `KCCNft` | NFTs enforced by Kaspa L1 covenant++ scripts |
| Covenant deployer | `SuperZK` | Deploy zktimelock, zkescrow, zkvault on Kaspa |
| L2 bridge | `IgraHorizon`, `IgraAgent`, `DEX` | KAS ⇄ iKAS bridge to Igra EVM L2 |
| Analytics hubs | `Slobz`, `SlobzTxTracker`, `SlobzSiteTracker` | Kaspa TX narrative + website intelligence |
| P2P marketplace | `SlobzMarket`, `SlobzGigs` | Non-custodial offer board + covenant escrow gigs |
| Games & media | `Arcade`, `Motion`, `Hikaru`, `Kine`, `VideoStudio` | 100+ apps |

---

## 2. Tech stack

- **Frontend:** React 18 + Vite 6, React Router 6, Tailwind CSS 3, shadcn/ui (Radix primitives), Framer Motion, Recharts, Three.js / React-Three-Fiber, Leaflet, Remotion.
- **Backend-as-a-Service:** Base44 (`@base44/sdk`) — provides auth, entities (Mongo-style JSON schemas + RLS), backend functions (Deno Deploy handlers), integrations (InvokeLLM, UploadFile, SendEmail, GenerateImage, GenerateVideo, TTS), automations, and in-app agents.
- **Icons:** `lucide-react` only.
- **State/data:** `@tanstack/react-query` + Base44 SDK entity methods.

---

## 3. Repository layout

```
.
├── index.html                 # SEO meta, OG tags, boot overlay, Agent Control Bridge
├── src/
│   ├── App.jsx                # Router — ALL explicit <Route> definitions live here
│   ├── main.jsx               # Vite entry
│   ├── index.css              # Design tokens (HSL CSS vars) → Tailwind
│   ├── Layout.jsx             # Shared chrome: sidebar, nav, search, player
│   ├── pages.config.js         # LEGACY auto-page registry (old pages only — do NOT rely on for new routes)
│   ├── pages/                 # One file per route (e.g. Home.jsx, AWA.jsx, Slobz.jsx)
│   ├── components/
│   │   ├── ui/                 # shadcn/ui primitives (one export per file)
│   │   ├── slobz/              # Slobz hub sub-components
│   │   ├── sitetracker/        # Website crawler UI
│   │   ├── awasigner/          # x402 payment terminal
│   │   └── ...                 # Feature-scoped folders
│   ├── api/
│   │   ├── base44Client.js     # Pre-initialized Base44 SDK client
│   │   └── integrations.js
│   ├── lib/                    # Auth context, utils, query client, TitleManager
│   └── utils/                  # createPageUrl, animation helpers
├── base44/
│   ├── entities/               # JSON schema files (one per entity) — define DB + RLS
│   ├── functions/              # Backend functions: base44/functions/<name>/entry.ts (Deno)
│   ├── agents/                 # In-app AI agent configs (.jsonc)
│   └── config.jsonc            # App config
├── public/
│   ├── llms.txt                # Compact summary for AI agents (read this first!)
│   └── robots.txt
└── tailwind.config.js          # Maps CSS tokens → Tailwind classes
```

---

## 4. Architecture conventions (important for any contributor/AI)

1. **Routing:** `src/App.jsx` is the **single source of truth** for routes. `pages.config.js` is a legacy auto-registry that only covers old pages — **every new page must get an explicit `<Route>` added in `App.jsx`**, alongside the existing loop. Do not delete the loop; do not assume it covers your new page.
2. **Layout wrapping:** The `pagesConfig` loop wraps pages in `LayoutWrapper`. New routes added manually outside the loop must apply the same wrapper if they need the shared chrome.
3. **Entities:** `base44/entities/*.jsonc` — full JSON schema, no comments/placeholders. Built-in fields (`id`, `created_date`, `updated_date`, `created_by_id`) are never declared. RLS is declared per operation.
4. **Backend functions:** `base44/functions/<name>/entry.ts` — Deno `Deno.serve` handlers for external APIs/integrations not covered by built-in connectors. Use `createClientFromRequest(req)` to get the Base44 SDK.
5. **Styling:** `src/index.css` owns token values (`:root` + `.dark`); `tailwind.config.js` maps them to Tailwind classes. Use token classes (`bg-primary`, `font-heading`), never hardcoded hex.
6. **Auth:** Platform-owned. Login/Register/ForgotPassword/ResetPassword already exist at `src/pages/Login.jsx` etc. — never recreate them. Gate authenticated pages via `ProtectedRoute`.
7. **Secrets:** Declared via `set_secrets`; referenced in backend functions as `process.env.<SECRET_NAME>`.
8. **Import alias:** Use `@/` (maps to `src/`), never relative `src/...` paths.

---

## 5. The Slobz analytical hub & P2P marketplace

`Slobz` (`src/pages/Slobz.jsx`) is the central dashboard. Sub-modules:

- **`SlobzTxTracker`** — narrative, plain-English explanations of Kaspa transactions.
- **`SlobzSiteTracker`** — real website crawling (sitemap, Lighthouse, DNS, security headers) via `scrapeWebsiteStats` backend function; stored on `TrackedWebsite` entity.
- **`SlobzMarket` / `SlobzGigs`** — P2P offer board + gigs (admin-only).

---

## 6. Key entities (data model)

~120 entities. The most load-bearing:

- `User` — built-in, read-only (id, email, full_name, role). Invite via `base44.users.inviteUser`.
- `TrackedWebsite` — URL analytics with multi-page crawl reports.
- `SlobzEscrowGig` — Slobz gig record (admin-only).
- `AWAInvoice` — x402 invoice (service, amount_kas, pay_to, tx_id, result).
- `KCCNft` (via `KCC`) — covenant-enforced NFT.
- `IgraAgentWallet`, `IgraBridgeSwap` — L2 agent wallets + bridge swaps.
- `AdventSponsorTask`, `AdventProgress`, `AdventProof` — sponsored advent tasks.
- `SlobzWaitlist`, `SlobProfile`, `SlobMicroTask` — Slobz marketplace identity + micro-gigs.

---

## 7. Key backend functions (selection)

| Function | Purpose |
|---|---|
| `slobzEscrow` | Slobz gig lifecycle (admin-only) |
| `scrapeWebsiteStats` | Multi-page website crawl + Lighthouse + AI SEO analysis |
| `awaX402` | x402 HTTP-402 payment verification + service fulfillment |
| `kccNft`, `kccNftMintPayment` | KCC covenant NFT mint + payment |
| `igraBridge`, `igraAgent` | KAS⇄iKAS bridge + L2 agent signing |
| `sendKaspaTransaction`, `slobzTestnetSend` | On-chain KAS sends (mainnet/testnet) |
| `createKaspaWallet`, `deriveKaspaAddress` | Wallet generation/derivation |
| `getKaspaBalance`, `getKaspaTransactionDetails`, `getKaspaUTXOs` | Kaspa RPC reads |
| `verifyKaspaSelfTransaction`, `verifyKaspaSignature` | On-chain proof verification |
| `superzkDeployJob` | Deploy zktimelock/zkescrow/zkvault covenants |
| `agentZKKaspaNode`, `zkEndpointExecutor` | Agent ZK node + endpoint execution |

Full list in the Base44 dashboard or `base44/functions/`.

---

## 8. Local development

```bash
npm install
npm run dev      # Vite dev server
npm run build    # Production build
npm run lint     # ESLint
```

The app talks to the Base44 BaaS at runtime — entities, functions, auth, and integrations are live services, not local files.

---

## 9. For AI agents / LLMs working on this repo

- Read [`/llms.txt`](./llms.txt) first for a compact map.
- **Never delete working pages or code** (project rule). Prefer `find_replace` for edits; create new focused component files instead of bloating existing ones.
- Every new page → new file in `src/pages/` + explicit `<Route>` in `src/App.jsx`.
- Every new entity → new `base44/entities/<Name>.jsonc` (full schema).
- Every new backend function → `base44/functions/<name>/entry.ts` + test with `test_backend_function`.
- Use `@/` imports, `lucide-react` icons only, Tailwind token classes only.

---

## 10. Links

- Live site: <https://tttz.xyz>
- Kaspa: <https://kaspa.org>
- Base44 platform: <https://base44.com>

---

© TTT / tttz.xyz — Tap To Tip.