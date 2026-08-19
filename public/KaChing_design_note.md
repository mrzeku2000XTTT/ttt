# KaChing — Kaspa Wallet Privacy & Multisig Protocol

## Origin post (design brief)
Source: https://x.com/brt2412/status/2090140716534047222
Author: @brt2412 (building KasSigner-iOS)

### The two features every Kaspa wallet needs (bare minimum)
1. **Seamless multiple derived receive addresses** — one click → a fresh receive
   address. Only Kaspium does this today. Reusing one address for every DCA
   exposes your full balance + history to anyone reading the chain.
2. **Manual UTXO / coin-control selection** — choose *which* UTXOs to spend so
   DCA'd funds at fresh addresses don't get re-merged into a single change UTXO
   on send. No mobile Kaspa wallet does this today; every wallet combines all
   UTXOs as inputs, undoing all address hygiene.

### Thesis
Kaspa is a transparent chain, so wallet-level coin control is the *only* privacy
layer. Privacy is a human right and should be the #1 priority for every wallet
maker.

## KaChing solution (built on top of the existing TTT wallet)
KaChing is a new wallet protocol layered on top of the existing local Kaspa
wallet (`localKaspaWallet`) + the real P2PK signing path (`sendKaspaTransaction`).

- **Create / import** — on-device key generation, same address format as the
  rest of TTT (kaspa: bech32, Schnorr P2PK).
- **Fresh receive addresses** — one click derives a brand-new keypair + address
  stored in the wallet's address book; the wallet can spend from any of them.
- **Send (auto)** — reuses the existing `sendKaspaTransaction` path.
- **Send (coin control)** — new `sendKaspaCoinControl` backend function: the
  *caller* chooses which UTXOs to spend. The function fetches the selected
  outpoints, signs each input with its own key, and submits — so selected
  UTXOs are spent and the rest stay untouched.
- **Multisig vault** — an m-of-n co-signer approval protocol layered on top of
  the single-sig on-chain send. A vault defines a threshold + cosigners
  (x-only pubkeys). A spend becomes a *proposal* that needs m Schnorr
  approvals from cosigners before the owner broadcasts the on-chain tx. This
  is a policy/multisig coordinator built on top of the existing wallet — no new
  consensus rules, no custodial server.

> "New protocol!!! But built on top of existing wallet." — KaChing keeps the
> real on-chain signing intact and adds the privacy + approval layer the X
> post demands.
