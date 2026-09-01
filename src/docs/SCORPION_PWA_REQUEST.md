# Request to the Scorpion (KCC-20) PWA maintainer

**From:** TTT — the Kaspa super app that connects to Scorpion as a dApp.
**Goal:** Let a TTT user who has already connected Scorpion actually **perform the self-send KAS step without the wallet disappearing**, so they can unlock the TTT app store.

## The problem we have today

1. TTT loads `https://kcc-20-wallet.vercel.app/sdk.js` and calls `window.kcc20.request('connect')`.
2. When TTT runs **standalone** (not inside the Scorpion iframe), the SDK opens a Scorpion popup. The user approves → `connect` resolves with an address → **the popup closes itself**.
3. Now the user has a connected address but **no visible wallet UI**. To self-send KAS they need Scorpion's Send screen, but it's gone. There is no SDK method to bring it back.
4. Result: the user is stuck. We currently hack around it by linking to `https://kcc-20-wallet.vercel.app/index.html` in a new tab, but that opens a fresh wallet instance — not the same session/connection — so it's clunky and confusing.

## What we need from Scorpion (one or both)

### Option A — `request('openWallet', { to, screen })`
A new SDK request that **re-opens / focuses the Scorpion wallet window** and (optionally) jumps straight to the Send screen with the recipient pre-filled:

```js
// TTT side
await window.kcc20.request('openWallet', {
  screen: 'send',           // 'send' | 'home' | 'tokens'
  to: 'kaspa:qrhr....77jq', // optional: pre-fill recipient (the user's own address)
  amount: null,             // optional: pre-fill amount
});
```

Behavior:
- If the wallet popup is still alive → focus it and navigate to the requested screen.
- If it was closed → reopen it, restore the connected session, and navigate to the screen.
- Never auto-broadcast; the user still reviews and confirms inside Scorpion. TTT never sees the key.

### Option B — `request('sendKaspa', { to, amount })`
A higher-level send that opens the Scorpion Sign sheet directly (like `sendToken`/`buyKron` already do for KCC-20 tokens), so TTT can trigger a plain KAS self-send in one call:

```js
const res = await window.kcc20.request('sendKaspa', {
  to: 'kaspa:qrhr....77jq',
  amount: '1', // KAS, or omit for user to fill
});
// res: { txId, amount, from, to, explorer }
```

This mirrors the existing `sendToken` / `buyKron` pattern, so it should be the smallest lift on your side and the cleanest UX on ours.

## Why this matters

The TTT app store unlocks for 30 minutes when the user self-sends KAS (pays only the miner fee). That self-send is the entire gate. Without a reliable way to surface Scorpion's Send screen on demand, the flow breaks for every standalone (non-iframe) user.

## Non-asks (so we're clear)

- We do **not** want TTT to hold keys or build/broadcast raw transactions.
- We do **not** want auto-send without the user confirming in Scorpion.
- We only want Scorpion's own UI to be reachable after `connect` resolves.

## Context for your side

- SDK version we load: `https://kcc-20-wallet.vercel.app/sdk.js?v=167`
- We already use: `connect`, `getBalance`, `signPskt`, `sendToken`, `getTokenBalance`, `buyKron`, `sellKron`, `quoteKron`.
- The iframe path (TTT inside Scorpion's Profile) already works fine — the wallet is always visible as the parent. This request is specifically for the **standalone popup** path.

A `sendKaspa` request (Option B) would unblock us immediately and match the existing token-send pattern. Let us know which option you can ship and the minimum SDK build number we should pin.