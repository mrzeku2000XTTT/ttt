// KCC20 Wallet PWA bridge — detects + connects the hosted KCC20 wallet
// (https://kcc-20-wallet.vercel.app) the same way a dApp connects to KasWare,
// except the wallet is a PWA on Vercel, not a Chrome extension.
//
// Detection is NOT silent. Browsers cannot sniff an installed PWA. The dApp
// loads sdk.js (see index.html), which injects window.kcc20 on THIS origin.
// connect() opens a popup/tab to the Vercel PWA; the user approves there.
// Keys NEVER enter TTT. Never read, copy, log, or store a private key.

export const KCC20_ORIGIN = "https://kcc-20-wallet.vercel.app";
export const KCC20_SDK = KCC20_ORIGIN + "/sdk.js";
export const KCC20_APP = KCC20_ORIGIN + "/index.html";

export function kcc20Provider() {
  try {
    if (typeof window !== "undefined" && window.kcc20 && window.kcc20.isKcc20) {
      return window.kcc20;
    }
  } catch {}
  return null;
}

export function isKcc20Detected() {
  return !!kcc20Provider();
}

export function loadKcc20Sdk() {
  return new Promise((resolve, reject) => {
    const have = kcc20Provider();
    if (have) {
      resolve(have);
      return;
    }
    const existing = document.querySelector("script[data-kcc20-sdk]");
    const onReady = (el) => {
      el.addEventListener("load", () => {
        const p = kcc20Provider();
        if (p) resolve(p);
        else reject(new Error("sdk loaded but window.kcc20 missing"));
      });
      el.addEventListener("error", () => reject(new Error("Could not reach KCC20 Wallet")));
    };
    if (existing) {
      onReady(existing);
      return;
    }
    const s = document.createElement("script");
    s.src = KCC20_SDK;
    s.async = true;
    s.dataset.kcc20Sdk = "1";
    onReady(s);
    document.head.appendChild(s);
  });
}

export async function connectKcc20Pwa() {
  const p = await loadKcc20Sdk();
  if (typeof p.request === "function") {
    const r = await p.request("connect");
    const addr =
      r?.address ||
      r?.accounts?.[0] ||
      (Array.isArray(r) ? r[0] : "");
    if (!addr) throw new Error("KCC20 Wallet did not return an address");
    return { address: addr, provider: p, via: "pwa" };
  }
  const acc = await p.connect();
  const addr = Array.isArray(acc) ? acc[0] : acc;
  if (!addr) throw new Error("KCC20 Wallet did not return an address");
  return { address: addr, provider: p, via: "pwa" };
}

export async function disconnectKcc20Pwa() {
  const p = kcc20Provider();
  if (!p) return;
  try {
    if (typeof p.request === "function") await p.request("disconnect");
    else if (typeof p.disconnect === "function") await p.disconnect();
  } catch {}
}

// Sign an unsigned PSKT JSON using the connected KCC20 PWA. TTT never sees the key.
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