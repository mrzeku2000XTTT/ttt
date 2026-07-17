// ─────────────────────────────────────────────────────────────
// TTT Platform Updates Registry
// ─────────────────────────────────────────────────────────────
// Add your newest feature/app/release at the TOP of this list.
// The NewsToast component automatically surfaces the most recent
// 3 entries here before rotating into live Kaspa news.
//
// Format:
//   { id, title, summary, tag, date (YYYY-MM-DD), link? }
// ─────────────────────────────────────────────────────────────

export const TTT_UPDATES = [
  {
    id: "sector6-hub-launch",
    title: "Sector 6 Hub — All Sectors Merged",
    summary: "Sector 6 is live as a unified white-space hub. Explore the 3D room, orbit and zoom, and jump into AWA, Igra Horizon, Aporia DEX, Kas Command, Kascov, KCC NFT, and more — all from one sector.",
    tag: "New Hub",
    date: "2026-07-17",
    link: "/Sector6",
  },
  {
    id: "kas-signer-airgapped",
    title: "KasSigner — Air-Gapped Transaction Signing",
    summary: "Sign Kaspa transactions offline with biometric-protected keys. QR-based payload transfer, WebAuthn verification, and zero network exposure for maximum security.",
    tag: "Security",
    date: "2026-07-16",
    link: "/KasSigner",
  },
  {
    id: "awa-airgapped-payments",
    title: "AWA — Air-Gapped AI Payments",
    summary: "Request AI services, generate unsigned KSPT payment payloads, sign offline, and broadcast — all through an air-gapped payment terminal with live KAS pricing.",
    tag: "New App",
    date: "2026-07-15",
    link: "/AWA",
  },
  {
    id: "kas-dollar-kusd",
    title: "KAS Dollar (KUSD) Stablecoin System",
    summary: "Mint and redeem KUSD — a Kaspa-backed dollar stablecoin. Vault health dashboard, mint forms, and redemption flow now live.",
    tag: "DeFi",
    date: "2026-07-14",
    link: "/KASDollar",
  },
  {
    id: "aporia-dex-igra",
    title: "Aporia DEX — Igra Ecosystem Trading",
    summary: "Trade on the Igra Agent ecosystem with real-time market data, candlestick charts, order book, and on-chain liquidity tools.",
    tag: "DeFi",
    date: "2026-07-13",
    link: "/Aporia",
  },
  {
    id: "kaspa-toccata-live-july",
    title: "Kaspa Toccata Hard Fork Goes Live on Mainnet",
    summary: "Toccata is now active on Kaspa mainnet — native tokens, covenants, ZK verification, and DeFi primitives all live on L1. Exchanges resuming deposits and withdrawals.",
    tag: "Kaspa",
    date: "2026-07-10",
    link: "/WhatIsKaspa",
  },
  {
    id: "kas-command-intel",
    title: "Kaspa Command — Global Node Intelligence",
    summary: "Real-time visualization of Kaspa network nodes, infrastructure data, threat intel feeds, and live analytics — all in one OSIRIS-themed dashboard.",
    tag: "New App",
    date: "2026-07-08",
    link: "/KaspaCommand",
  },
  {
    id: "tree-ai-campaigns",
    title: "Tree — AI Ad Campaign Generator",
    summary: "Generate multi-template ad campaigns with AI — hooks, scripts, captions, CTAs, images, and narration. Pick a product, audience, and tone, then deploy.",
    tag: "New App",
    date: "2026-07-05",
    link: "/Tree",
  },
  {
    id: "ok-motion-lab-appstore",
    title: "oK Motion Lab Added to App Store",
    summary: "oK — the high-performance 3D studio for rendering and animating brand logos — is now featured in the TTT App Store with fullscreen iframe support.",
    tag: "New App",
    date: "2026-06-27",
    link: "/AppStoreV2",
  },
  {
    id: "kaspa-toccata-mainnet-june-2026",
    title: "Kaspa Toccata Hard Fork — Mainnet Activation",
    summary: "Kaspa's biggest upgrade ever is activating on mainnet in late June 2026. Toccata brings native token issuance, covenants, and ZK verification directly to L1.",
    tag: "Kaspa",
    date: "2026-06-26",
    link: "/WhatIsKaspa",
  },
  {
    id: "kaspaforge-launch",
    title: "KaspaForge — Smart Contract Deployer",
    summary: "Deploy timelocks, escrows, payment splits, vesting schedules, and custom scripts on Kaspa — no coding required. Connect Kasware and deploy in minutes.",
    tag: "New App",
    date: "2026-06-20",
    link: "/KaspaForge",
  },
  {
    id: "quick-storyboard-crab-ai",
    title: "Quick Storyboard Crab AI Upgraded",
    summary: "StoryboardCrabBot now has a cleaner Crab AI button plus continuous voice input for faster creative direction and storyboard feedback.",
    tag: "AI Studio",
    date: "2026-05-25",
    link: "/QuickStoryboard",
  },
  {
    id: "moodboard-continuity-studio",
    title: "Mood Board Continuity Tools",
    summary: "Mood Board now helps extend storyboard scenes with stronger continuity prompts, scene logic, and copy-ready motion cut direction.",
    tag: "Creative Tools",
    date: "2026-05-24",
    link: "/MoodBoard",
  },
  {
    id: "hiro-launch",
    title: "Hiro — AI Typography Studio",
    summary: "Design on-brand fonts, wordmarks, and type systems. Build your Type Kit once, generate letterforms that actually belong to your brand.",
    tag: "New App",
    date: "2026-04-19",
    link: "/Hiro",
  },
  {
    id: "listing-apps",
    title: "List Your App",
    summary: "Anyone can now submit apps to the TTT App Store. Admin-reviewed, one-click approval flow.",
    tag: "Platform",
    date: "2026-04-19",
    link: "/AppStoreV2",
  },
  {
    id: "oneshot-studio",
    title: "OneShot Studio",
    summary: "Clone any UI and vibe-code with AI clusters. Live preview, chat-driven edits, full studio workspace.",
    tag: "New App",
    date: "2026-04-10",
    link: "/OneShotStudio",
  },
  {
    id: "tttv2-launch",
    title: "TTT 2.0 is Live",
    summary: "Redesigned landing, new hero, community videos, cleaner navigation. The Kaspa super-app, refined.",
    tag: "Release",
    date: "2026-04-01",
    link: "/TTTV2",
  },
];

/** Returns the N most recent updates sorted by date desc. */
export function getLatestUpdates(limit = 3) {
  return [...TTT_UPDATES]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, limit)
    .map((u) => ({ ...u, isPlatformUpdate: true }));
}