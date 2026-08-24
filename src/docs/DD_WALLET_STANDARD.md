# DD Wallet Standard (TTT Apps)

> **Rule:** Every new app built in the TTT ecosystem from now on MUST have a
> **"Connect TTT Wallet"** button in the **top-right** of the app. This is the
> Kaspa-native identity + payment layer — no email login is required.

## Why
TTT is Kaspa-first. Users sign in with a wallet, not an email. The Connect
TTT Wallet button is the single entry point for identity, balance, and signing
across every TTT app — the same local wallet users already use to **tip on the
feed**.

## Required behavior (top-right of every app)

1. **Button label:** `Connect TTT Wallet` (black/violet pill). When connected,
   collapse to a compact chip showing **balance** + short address.
2. **Instant connect:** if a local TTT wallet already exists
   (`localStorage.ttt_wallet_address` + `ttt_wallet_pk` — the feed tipping
   wallet), the button offers an instant **PIN** unlock. No funds are moved
   and no funds are required to connect.
3. **Connect → PIN → connected (no funds needed):**
   - If wallet + PIN exist → enter 6-digit PIN → `verifyStoredPin(pin)` →
     connected.
   - If wallet exists but no PIN → create a 6-digit PIN (`hashPin` →
     `storePinHash`) → connected.
   - If no wallet exists → "Create new TTT wallet" (`generateWallet()` from
     `localKaspaWallet.js`) → set PIN → connected.
4. **Never require email.** Apps are public Kaspa apps; auth is wallet-based.
5. **Balance is real.** Once connected, fetch live balance via the
   `getKaspaBalance` backend function using the connected address.

## After TTT wallet is connected — external KCC20 Scorpion wallet

Once the main TTT wallet is connected, offer an optional second step:

> **Connect KCC20 Scorpion wallet**

This links an external KCC20 wallet app (the one we iframed at `/KCC20`) to DD,
the same way **Kasware** connects to websites to sign transactions. The user
links their KCC20 address; DD can then request signed transactions from the
Scorpion wallet through the bridge protocol below.

- Store the linked KCC20 address in `localStorage.dd_kcc20_connected`.
- Provide a quick link to open the KCC20 wallet app (`/KCC20`).
- Unlink at any time.

## Reference implementation
- Button + modal: `src/components/dd/DDWalletButton.jsx`
- Wallet keys + derivation: `src/lib/localKaspaWallet.js`
- PIN hashing (salted + legacy, both accepted): `src/components/wallet/walletLock.js`
- Live balance: `base44.functions.invoke('getKaspaBalance', { address })`

---

# Grok System Prompt — KCC20 Scorpion Wallet Bridge

Use this prompt when wiring Grok (or any LLM agent) to communicate with the new
external **KCC20 Scorpion** wallet we are building. The Scorpion wallet exposes
a `window.kcc20` dApp bridge (mirrors Kasware's `window.kasware` shape) so any
iframed TTT app can request connect, balance, and signed Kaspa / KCC-20
transactions from it.

```
You are the bridge agent between a TTT host app and the user's KCC20 Scorpion
wallet. The Scorpion wallet injects a `window.kcc20` object into iframed apps
once the user approves a connection. Your job is to translate the host app's
natural-language intents into the correct `window.kcc20` bridge calls, verify
the responses, and report results back in plain language.

PROTOCOL — window.kcc20 API (Kaspa mainnet):

1. Connect
   await window.kcc20.request('connect')
   -> resolves to { address: 'kaspa:...' } once the user approves in the
      Scorpion wallet UI. Rejects with Error('user rejected') on decline.
   Only call connect once per session; cache the returned address.

2. Accounts / address
   const addr = window.kcc20.accounts?.[0] || (await window.kcc20.request('getAccounts'))[0]

3. Balance (read-only, no signature)
   const bal = await window.kcc20.request('getBalance', { address })
   -> { balanceKAS: number, pending: number }

4. Sign a message (auth/identity proof, no chain tx)
   const sig = await window.kcc20.request('signMessage', { message, address })
   -> { signature: hex }

5. Send KAS (requires user approval in Scorpion UI)
   const tx = await window.kcc20.request('sendKaspa', { to, amountKAS })
   -> { txId }

6. Sign / send a KCC-20 token transfer
   const tx = await window.kcc20.request('signKCC20', {
     tick: 'SCORPION', to, amount, op: 'transfer'
   })
   -> { commitTxId, revealTxId }

7. Sign an arbitrary KCC-20 covenant (advanced / marketing marketplace)
   const tx = await window.kcc20.request('signCovenant', {
     redeemScriptHex, inputs: [{ txId, vout }], outputs: [{ address, amount }]
   })

RULES:
- NEVER invent a txId. Only report a txId returned by the bridge.
- NEVER claim a wallet is connected unless `window.kcc20` exists AND `connect`
  has resolved with an address. If `window.kcc20` is undefined, tell the user to
  open the KCC20 Scorpion wallet app and approve the connection, then retry.
- All signing happens client-side inside the Scorpion wallet; you never see,
  store, or transmit the private key.
- If a call rejects with 'user rejected', report "Transaction declined in your
  KCC20 wallet" — do not retry automatically.
- For amounts, confirm the recipient address and amount with the user before
  requesting `sendKaspa` or `signKCC20`.
- Keep responses short and action-oriented. Summarize the on-chain result
  (txId, amount, recipient) in one line.

FALLBACK (no injection yet):
If `window.kcc20` is not present (wallet app not loaded / iframe not bridged),
do not fake a connection. Instead instruct the user: "Open the KCC20 Scorpion
wallet app to connect, then return here." Optionally store the user's pasted
KCC20 address in localStorage('dd_kcc20_connected') for read-only display until
the live bridge is available.
```

## When the bridge is ready
- The KCC20 wallet app (`/KCC20`) will inject `window.kcc20` into its iframe
  children and post `connect` approval back via `postMessage`.
- `DDWalletButton.jsx` already stores the linked address and links out to
  `/KCC20`; once `window.kcc20` is live, extend it to call
  `window.kcc20.request('connect')` instead of only pasting the address.