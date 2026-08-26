// KCC20 Wallet bridge — client only. No signing backend.
// Keys never hit Base44, entities, functions, or logs.
//
// KCC20 Wallet (https://kcc-20-wallet.vercel.app BUILD 121+) is a MetaMask-style
// dApp browser. On Profile it iframes https://tttz.xyz. Any TTT app inside that
// iframe talks to the PARENT wallet via postMessage (sdk.js handles this).
// When TTT is opened standalone, sdk.js opens a wallet popup instead.
//
// Live API:
//   request('connect') → { address, accounts, network, publicKey }
//   request('getBalance', { address }) → { balanceKAS, pending, address }
//   request('signPskt', { txJsonString, options: { signInputs } })
// NOT implemented: sendKaspa, signKCC20, signMessage, signCovenant.
// Build a PSKT, then signPskt. Never invent a txId.

export const KCC20_ORIGIN = "https://kcc-20-wallet.vercel.app";
export const KCC20_SDK = KCC20_ORIGIN + "/sdk.js?v=167";
export const KCC20_APP = KCC20_ORIGIN + "/index.html";

// True when TTT is running inside the KCC20 wallet's dApp browser iframe.
export function isInWalletIframe() {
  try { return window.parent !== window; } catch { return false; }
}

export function kcc20Provider() {
  try {
    if (typeof window !== "undefined" && window.kcc20 && window.kcc20.isKcc20) {
      return window.kcc20;
    }
  } catch {}
  return null;
}

export function isKcc20Detected() {
  return !!kcc20Provider() || isInWalletIframe();
}

export function loadKcc20Sdk() {
  return new Promise((resolve, reject) => {
    const have = kcc20Provider();
    if (have) { resolve(have); return; }
    const existing = document.querySelector("script[data-kcc20-sdk]");
    const onReady = (el) => {
      el.addEventListener("load", () => {
        const p = kcc20Provider();
        if (p) resolve(p);
        else reject(new Error("sdk loaded but window.kcc20 missing"));
      });
      el.addEventListener("error", () => reject(new Error("Could not reach KCC20 Wallet")));
    };
    if (existing) { onReady(existing); return; }
    const s = document.createElement("script");
    s.src = KCC20_SDK;
    s.async = true;
    s.dataset.kcc20Sdk = "1";
    onReady(s);
    document.head.appendChild(s);
  });
}

// Connect — calls window.kcc20.request('connect'). The sdk posts to the parent
// wallet (if iframed) or opens a popup (if standalone). TTT never sees the key.
export async function connectKcc20Pwa() {
  const p = await loadKcc20Sdk();
  if (typeof p.request === "function") {
    const r = await p.request("connect");
    const addr = r?.address || r?.accounts?.[0] || (Array.isArray(r) ? r[0] : "");
    if (!addr) throw new Error("KCC20 Wallet did not return an address");
    return { address: addr, via: "pwa" };
  }
  const acc = await p.connect();
  const addr = Array.isArray(acc) ? acc[0] : acc;
  if (!addr) throw new Error("KCC20 Wallet did not return an address");
  return { address: addr, via: "pwa" };
}

export async function disconnectKcc20Pwa() {
  const p = kcc20Provider();
  if (!p) return;
  try {
    if (typeof p.request === "function") await p.request("disconnect");
    else if (typeof p.disconnect === "function") await p.disconnect();
  } catch {}
}

// Sign an unsigned PSKT JSON. TTT never sees the key. Never invent a txId.
export async function signWithKcc20(txJsonString, signInputs = []) {
  const p = await loadKcc20Sdk();
  if (typeof p.request === "function") {
    return p.request("signPskt", { txJsonString, options: { signInputs } });
  }
  if (typeof p.signPskt === "function") {
    return p.signPskt({ txJsonString, options: { signInputs } });
  }
  throw new Error("KCC20 Wallet does not support signPskt");
}

// ── KCC20 token APIs (BUILD 141+) ──
// The parent wallet signs and broadcasts; TTT never sees keys.

// True when the KCC20 SDK is loaded AND we're inside the wallet's dApp browser.
export function isEmbeddedKcc20() {
  const p = kcc20Provider();
  if (!p) return false;
  if (typeof p.isEmbedded === "function") return !!p.isEmbedded();
  return isInWalletIframe();
}

// Send a KCC20 token (e.g. KKDAG) to a destination address.
// Returns { txId, amount, from, dest, explorer }.
export async function sendTokenKcc20({ tick, amount, dest }) {
  const p = await loadKcc20Sdk();
  if (typeof p.sendToken === "function") return p.sendToken({ tick, amount: String(amount), dest });
  if (typeof p.request === "function") return p.request("sendKcc20", { tick, amount: String(amount), dest });
  throw new Error("KCC20 Wallet does not support sendToken");
}

// Get the live token balance from the parent wallet.
// Returns { balance, raw, decimals }.
export async function getTokenBalanceKcc20(tick) {
  const p = kcc20Provider() || await loadKcc20Sdk();
  if (typeof p.getTokenBalance === "function") return p.getTokenBalance(tick);
  if (typeof p.request === "function") return p.request("getTokenBalance", { tick });
  throw new Error("KCC20 Wallet does not support getTokenBalance");
}

// Get the connected network. Returns 'kaspa_mainnet' | 'kaspa_testnet10' | …
export async function getNetworkKcc20() {
  const p = kcc20Provider() || await loadKcc20Sdk();
  if (typeof p.getNetwork === "function") return p.getNetwork();
  if (typeof p.request === "function") return p.request("getNetwork");
  return null;
}

// ── KRON swap APIs (SDK v167+) ──
// The wallet quotes and builds the same Home TRADE swap. TTT never sees keys.
// Buy: amount = KAS to spend (e.g. "10"). Returns { txId, quote, explorer }.
export async function buyKronKcc20({ tick, amount }) {
  const p = await loadKcc20Sdk();
  if (typeof p.buyKron === "function") return p.buyKron({ tick, amount: String(amount) });
  if (typeof p.request === "function") return p.request("buyKron", { tick, amount: String(amount) });
  throw new Error("KCC20 Wallet SDK does not support buyKron (need v167+)");
}

// Sell: amount = token amount to sell (not KAS).
export async function sellKronKcc20({ tick, amount }) {
  const p = await loadKcc20Sdk();
  if (typeof p.sellKron === "function") return p.sellKron({ tick, amount: String(amount) });
  if (typeof p.request === "function") return p.request("sellKron", { tick, amount: String(amount) });
  throw new Error("KCC20 Wallet SDK does not support sellKron (need v167+)");
}

// Optional preview quote. May throw — skip if it does (the Sign sheet still quotes).
export async function quoteKronKcc20({ tick, side, amount }) {
  const p = await loadKcc20Sdk();
  if (typeof p.quoteKron === "function") return p.quoteKron({ tick, side, amount: String(amount) });
  if (typeof p.request === "function") return p.request("quoteKron", { tick, side, amount: String(amount) });
  return null;
}

export function getKcc20SdkVersion() {
  const p = kcc20Provider();
  return p?.sdkVersion != null ? String(p.sdkVersion) : null;
}