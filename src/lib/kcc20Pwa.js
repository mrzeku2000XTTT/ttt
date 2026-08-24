// KCC20 Wallet bridge.
// On tttz.xyz / *.base44.app / localhost we open /KCC20 (the in-app iframe page)
// instead of a Vercel popup. DD and /KCC20 communicate via sessionStorage:
//   kcc20_ttt_pending  — DD writes a request before navigating to /KCC20
//   kcc20_ttt_result   — /KCC20 writes the result; DD reads it on return
// Keys NEVER enter TTT. Never read, copy, log, or store a private key.
// Never call sendKaspa / signKCC20 / signMessage / signCovenant — build a PSKT, then signPskt.

export const KCC20_ORIGIN = "https://kcc-20-wallet.vercel.app";
export const KCC20_SDK = KCC20_ORIGIN + "/sdk.js";
export const KCC20_APP = KCC20_ORIGIN + "/index.html";
export const KCC20_ROUTE = "/KCC20";

const PENDING_KEY = "kcc20_ttt_pending";
const RESULT_KEY = "kcc20_ttt_result";

export function isLocalHosted() {
  try {
    const h = window.location.hostname;
    return h === "tttz.xyz" || h === "localhost" || h === "127.0.0.1" || h.endsWith(".base44.app");
  } catch {
    return false;
  }
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

// --- sessionStorage bridge ---

function setPending(req) {
  try { sessionStorage.setItem(PENDING_KEY, JSON.stringify(req)); } catch {}
}
export function getPending() {
  try { return JSON.parse(sessionStorage.getItem(PENDING_KEY) || "null"); } catch { return null; }
}
export function clearPending() {
  try { sessionStorage.removeItem(PENDING_KEY); } catch {}
}
export function setResult(res) {
  try { sessionStorage.setItem(RESULT_KEY, JSON.stringify(res)); } catch {}
}
export function consumeResult() {
  try {
    const raw = sessionStorage.getItem(RESULT_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(RESULT_KEY);
    return JSON.parse(raw);
  } catch { return null; }
}

// Write a pending request and navigate to /KCC20. Returns the request id.
export function openKcc20Route(type, params = {}, returnUrl = "/DD") {
  const id = (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : String(Date.now() + Math.random());
  setPending({ id, type, ...params, returnUrl });
  window.location.href = KCC20_ROUTE;
  return id;
}

// Connect. On local hosted hosts, route through /KCC20 (sessionStorage bridge).
export async function connectKcc20Pwa() {
  if (isLocalHosted()) {
    openKcc20Route("connect", {}, "/DD");
    // Page navigates to /KCC20; DD reads the result on return via consumeResult().
    return new Promise(() => {});
  }
  const p = await loadKcc20Sdk();
  if (typeof p.request === "function") {
    const r = await p.request("connect");
    const addr = r?.address || r?.accounts?.[0] || (Array.isArray(r) ? r[0] : "");
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

// Sign an unsigned PSKT JSON. On local hosted, route through /KCC20.
// TTT never sees the key. Never invent a txId — the caller broadcasts the signed tx.
export async function signWithKcc20(txJsonString, signInputs = []) {
  if (isLocalHosted()) {
    openKcc20Route("signPskt", { txJsonString, signInputs }, "/DD");
    return new Promise(() => {});
  }
  const p = await loadKcc20Sdk();
  if (typeof p.request === "function") {
    return p.request("signPskt", { txJsonString, options: { signInputs } });
  }
  if (typeof p.signPskt === "function") {
    return p.signPskt({ txJsonString, options: { signInputs } });
  }
  throw new Error("KCC20 Wallet does not support signPskt");
}