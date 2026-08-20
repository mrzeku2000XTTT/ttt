# KaChing Wallet — Full Build Prompt

> Paste this into any capable AI app builder (Base44, v0, bolt, Claude, GPT) to regenerate the KaChing Wallet from scratch. It is a faithful spec of the shipping app.

---

## 1. Product

**KaChing Wallet** is a privacy-first, **non-custodial Kaspa (KAS) wallet** that lives entirely in the browser. Its three pillars are:

1. **Fresh receive addresses** — derive a brand-new Kaspa address for every receive, with a human label and a "used" flag, so your on-chain footprint stays private.
2. **Manual UTXO coin control** — send using the auto coin-selector *or* hand-pick the exact UTXOs you want to spend, for precise privacy and accounting.
3. **m-of-n multisig approval gate** — create a vault of co-signers, propose a transaction, collect Schnorr signatures off-chain, and execute on-chain once the threshold is met. This is an **off-chain approval gate**, *not* a covenant-script multisig — be explicit about that in the UI.

**Security model (non-negotiable):**
- Keys are generated, imported, and stored **100% on the device** (browser `localStorage`). Nothing sensitive is ever sent to a server.
- The wallet only ever talks to the host app's real Kaspa signing backend functions — it never ships its own private key to the network.
- Import is by **private hex key** (64 hex chars) only — no mnemonic phrases (derivation paths aren't standardized for Kaspa; mnemonic support risks fund loss).
- A one-time "Exit Wallet" wipes every wallet + key from the device.

**Multi-wallet:** a user can hold multiple wallets, switch between them, rename, reveal/copy keys, delete, and exit. One is "active" at a time; all legacy single-wallet helpers operate on the active wallet.

---

## 2. Tech stack

- **React 18 + Vite**, JavaScript (`.jsx`).
- **Tailwind CSS** for styling.
- **lucide-react** for icons.
- **framer-motion** for subtle motion (optional).
- **@noble/curves** (`secp256k1`, `schnorr`) for key derivation + multisig signatures.
- **qrcode** (or any QR lib) for receive-address QR codes.
- **Base44 BaaS** SDK (`base44` from `@/api/base44Client`) for the backend signing functions:
  - `base44.functions.invoke("getKaspaBalance", { address })` → `{ balanceKAS }`
  - `base44.functions.invoke("getKaspaUTXOs", { address })` → list of UTXOs
  - `base44.functions.invoke("sendKaspaTransaction", { fromAddress, toAddress, amountKas, privateKey })` → auto coin-select + sign + broadcast
  - `base44.functions.invoke("sendKaspaCoinControl", { fromAddress, toAddress, amountKas, privateKey, selectedOutpoints })` → sign a hand-picked UTXO set

> If you're not on Base44, replace those four `invoke` calls with your own Kaspa RPC + signing layer. Everything else stays identical.

---

## 3. File tree (what to build)

```
src/
  pages/
    KaChingWallet.jsx            # Page shell: onboarding vs. wallet, header, tab bar
  components/
    kaching/
      KaChingReceive.jsx         # Receive tab: addresses, QR, derive, labels, toggle used
      KaChingSend.jsx            # Send tab: Auto vs. Coin Control modes
      KaChingMultisig.jsx        # Approve tab: vaults, proposals, sign, execute
      KaChingTutorial.jsx        # Multi-step privacy/multisig onboarding modal
      KaChingWalletManager.jsx   # Multi-wallet + key manager modal (New/Import/Wallets)
  lib/
    kachingVault.js              # All localStorage wallet + vault + proposal logic
    localKaspaWallet.js          # addressFromPrivateKey, addressFromPubKey, isValidKaspaAddress
```

---

## 4. `lib/kachingVault.js` — the contract (build this first)

All client-side, localStorage only. Uses `localKaspaWallet` for address derivation so addresses match the host app byte-for-byte.

**Storage keys:** `kaching_wallets` (array), `kaching_active_wallet_id` (string), `kaching_vaults` (array), `kaching_proposals` (array). Migrate a legacy `kaching_wallet` single record into the collection on first load.

**Wallet shape:**
```js
{ id, name, createdAt, imported?: boolean,
  addresses: [{ privateKey, address, label, used, createdAt }] }
```

**Helpers to export:**
- `createKaChingWalletNamed(name?)` — `crypto.getRandomValues` → 32-byte private key → `addressFromPrivateKey`; pushes a new wallet, sets it active, returns it.
- `importKaChingWalletNamed(privateKeyHex, name?)` — validate `/^[0-9a-f]{64}$/`, derive address, store with `imported: true`.
- `listKaChingWallets()`, `getActiveKaChingWalletId()`, `setActiveKaChingWallet(id)`.
- `renameKaChingWallet(id, name)`, `deleteKaChingWallet(id)`, `exitKaChingSession()` (wipes everything).
- `getKaChingWallet()` → returns the active wallet (or first).
- `deriveFreshReceiveAddress(label?)` — new keypair, append to active wallet's addresses, return entry.
- `markAddressUsed(address)`, `getAllOwnedAddresses()`, `getPrivateKeyFor(address)`.
- `isValidKaspaAddress` (re-exported from `localKaspaWallet`).
- Backward-compat aliases: `createKaChingWallet`, `importKaChingWallet`, `clearKaChingWallet`, `saveWallet`.

**Cosigners:** `newCosignerKeypair(label)` → `{ privateKey, pubKey (x-only), address, label }`.

**Vaults:** `createVault(name, threshold, cosigners[])` → `{ id, name, threshold, cosigners:[{label, pubKey, address}], createdAt }`. `getVaults()`, `deleteVault(id)`.

**Proposals:** `createProposal(vaultId, fromAddress, toAddress, amountKas, selectedOutpoints)` → `{ id, vaultId, fromAddress, toAddress, amountKas, selectedOutpoints, signatures:[], status:"pending", createdAt }`.
- `signProposal(proposalId, signerPrivateKey)` — Schnorr-signs `TextEncoder(`${vaultId}|${from}|${to}|${amount}|${JSON.stringify(outpoints)}`)` with the signer's key, stores `{ pubKey, sig }`, flips `status` to `"ready"` once `signatures.length >= vault.threshold`.
- `proposalReady(p)`, `markProposalExecuted(proposalId, txId)`, `deleteProposal(id)`.

---

## 5. Page shell (`KaChingWallet.jsx`)

- If no active wallet → **onboarding**: KaChing logo, tagline ("Privacy-first Kaspa wallet — fresh receive addresses, manual UTXO coin control, and m-of-n multisig vaults"), a cyan **Create new wallet** button, and an **Import** card (paste 64-hex private key, validate, import). Tiny trust line: "Keys are generated + stored on this device only."
- If wallet exists → **Header** (back to store, logo, name, a **Key & Wallets** button 🔑, a **Tutorial** button 📖, a **Refresh** balance button, and a centered **Total balance** summing every owned address) + a **3-tab bottom nav**: **Receive · Send · Approve**.
- Header + bottom nav are `max-w-md mx-auto`, dark glass (`bg-black/90 backdrop-blur-xl`), safe-area aware (`env(safe-area-inset-bottom)`).
- Balance loader: `Promise.all(getAllOwnedAddresses().map(a => invoke("getKaspaBalance",{address:a.address})))`, sum `balanceKAS`. Refreshes after any manager action and any send/receive activity.

---

## 6. Receive tab (`KaChingReceive`)

- Shows the **primary** (first) address big, with a **QR code**.
- Buttons: **Copy**, **Derive fresh address** (with optional label input), and a toggle to mark an address **used** (affects nothing on-chain — it's a local privacy hint).
- An **address book** list below: each entry shows address (mono, truncable), label, used badge, copy button, and a "set as active display" action.
- After deriving or marking used, call `onActivity()` so the parent refreshes balances.

---

## 7. Send tab (`KaChingSend`)

Two modes, toggleable:

**Auto:** recipient address input, amount (KAS) input, validate address with `isValidKaspaAddress`, then `invoke("sendKaspaTransaction", { fromAddress, toAddress, amountKas, privateKey })`. Show the returned tx id.

**Coin Control:** pick a `fromAddress` (one of the owned addresses) → `invoke("getKaspaUTXOs", { address })` → render a checklist of UTXOs (outpoint + amount) the user can hand-select → enter recipient + amount → `invoke("sendKaspaCoinControl", { fromAddress, toAddress, amountKas, privateKey, selectedOutpoints })`. Warn if selected sum < amount + fee.

Get the `privateKey` for the chosen `fromAddress` via `getPrivateKeyFor(address)`. Never log it. Show inline errors; disable submit while a request is in flight. After a successful send, call `onActivity()`.

---

## 8. Approve tab (`KaChingMultisig`) — the off-chain approval gate

Frame it in the UI as an **off-chain approval gate**, not a covenant multisig. Flow:

1. **Create vault** — name, threshold `m`, generate `n` co-signer keypairs (`newCosignerKeypair`), store via `createVault`. Show each cosigner's pubKey/address.
2. **Propose** — pick a vault + a `fromAddress` you own + recipient + amount + (optional) selected UTXOs → `createProposal`.
3. **Sign** — each co-signer pastes their private key → `signProposal(proposalId, key)` → Schnorr signature stored. Progress shows `x / m signatures`.
4. **Execute** — once `proposalReady`, the **owner** of `fromAddress` signs the real on-chain tx (Auto or Coin Control depending on whether outpoints were selected) and `markProposalExecuted(id, txId)`.
5. List existing proposals with status badges (`pending · ready · executed`) and a delete action.

Never store co-signer private keys — only use them transiently to sign, then discard. Store only their pubKeys in the vault.

---

## 9. Tutorial modal (`KaChingTutorial`)

A multi-slide modal teaching: (a) keys are local-only, (b) why fresh receive addresses improve privacy, (c) UTXO coin control, (d) the m-of-n approval flow, (e) agent-integration tips. Progress dots, prev/next, dismiss. Triggered from the header 📖.

---

## 10. Wallet manager modal (`KaChingWalletManager`)

Bottom-sheet (mobile) / centered modal (desktop). Three tabs: **Wallets · New · Import**.
- Wallets: list every wallet, highlight active, inline rename, reveal/copy private key (eye toggle, masked `•`×64 by default), copy address, **Switch**, **Delete** (confirm), and an **Exit Wallet** (confirm, wipes all — backs up keys first warning).
- New: optional name → `createKaChingWalletNamed`.
- Import: optional name + 64-hex private key → `importKaChingWalletNamed`.
- Top banner: "Everything here is 100% local. Keys never leave this device."
- On any change call `onChanged()` so the parent re-syncs balance + active wallet.

---

## 11. Design system

- **Palette:** pure black `#000` background, white text, **cyan-400/500** as the single accent (buttons, active states, key highlights), red-500 for destructive (delete/exit), white/10 borders, white/5 surfaces.
- **Layout:** `max-w-md mx-auto` for the whole wallet — it's a phone-first single column. Bottom nav fixed, safe-area padded.
- **Type:** tight tracking, bold/black weights for balance + headings, mono for addresses/keys.
- **Motion:** subtle (framer-motion) — fade/scale on logo, slide on sheets. Nothing flashy.
- **Logo:** the KaChing icon (generate or supply) — rounded-2xl, cyan glow on the onboarding screen.
- **Mobile:** 16px font on inputs (no iOS zoom), `touch-action: manipulation`, safe-area insets respected.

---

## 12. Backend functions (if on Base44, create these four)

```
getKaspaBalance        { address }                 → { balanceKAS }
getKaspaUTXOs          { address }                 → [{ transactionId, transactionOutputIndex, amountSompi }]
sendKaspaTransaction   { fromAddress, toAddress, amountKas, privateKey }  → { txId }
sendKaspaCoinControl   { fromAddress, toAddress, amountKas, privateKey, selectedOutpoints }  → { txId }
```

`selectedOutpoints` = `[{ transactionId, transactionOutputIndex }]`. Convert KAS↔sompi at 1e8. Sign with the Kaspa Schnorr/Secp256k1 stack; broadcast to mainnet.

---

## 13. Definition of done

- A brand-new user can create a wallet, derive a receive address, see a QR, and copy it.
- They can import via 64-hex private key.
- They can send KAS in Auto mode and in Coin Control mode (selecting specific UTXOs).
- They can build an m-of-n vault, propose a tx, sign with co-signers, and execute once the threshold is met.
- They can hold multiple wallets, switch, rename, reveal/copy keys, delete, and exit-wipe.
- **No private key ever leaves the browser** except into the signing backend functions above (which act on the user's behalf).
- The UI is phone-first, black + cyan, safe-area aware, and clearly frames the multisig tab as an off-chain approval gate.

---

*Inspired by the real KaChing Wallet. Replace the Base44 backend calls with your own Kaspa RPC layer if you're not on Base44 — the entire client-side wallet, vault, and approval logic stays identical.*