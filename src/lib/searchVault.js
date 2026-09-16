// Search Kaspa SearchVault — Scorpion (KCC20 Wallet) client bridge.
// Wallet: https://kcc-20-wallet.vercel.app (BUILD 245+, SDK v171)
// Argent: https://kcc20-sdk.vercel.app/argent.js (v1.4.0)
// Silver: https://kcc20-sdk.vercel.app/silverscript.js (ABI encoder)
//
// Keys NEVER touch this app: Argent compiles/funds the kaspa:p P2SH inside the
// wallet, the user Approves + PINs, and every pay_search_fee is signed there.
// We only store the vault address + artifact (public covenant data).
import { base44 } from '@/api/base44Client';

const KCC20_ORIGIN = 'https://kcc-20-wallet.vercel.app';
const SDK_URL = `${KCC20_ORIGIN}/sdk.js?v=171`;
const ARGENT_URL = 'https://kcc20-sdk.vercel.app/argent.js';
const REQUIRED_SDK = '171';
const REQUIRED_ARGENT = '1.4.0';

// Official Search Kaspa / TTT treasury (ews chip) — 32-byte Schnorr pubkey,
// NOT a kaspa:q address. SearchVault pays this key per search fee.
export const TREASURY_PUBKEY = '284bb3e4d46276c03d2ef6aaa0e0d62ec2698f939d1b55a8011d77fe5ca6f7ba';
export const TREASURY_ADDRESS = 'kaspa:qq5yhvly6338dspa9mm24g8q6chvy6v0jww3k4dgqywh0lju5mmm5pj334ews';

const VAULT_KEY = 'search_kaspa_vault';

function injectScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Could not load ${src}`));
    document.head.appendChild(s);
  });
}

function pollFor(getter, ms = 8000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const iv = setInterval(() => {
      const v = getter();
      if (v) { clearInterval(iv); resolve(v); return; }
      if (Date.now() - started > ms) { clearInterval(iv); reject(new Error('Scorpion wallet SDK did not initialize')); }
    }, 100);
  });
}

async function waitForSdkInit(w) {
  if (w.isInitialized === false && typeof w.on === 'function') {
    await new Promise((res) => {
      const to = setTimeout(res, 5000);
      try {
        w.on('kcc20#initialized', () => { clearTimeout(to); res(); });
      } catch { clearTimeout(to); res(); }
    });
  }
}

// Wallet spec: load only on a USER CLICK. If a stale SDK is present, delete
// window.kcc20, remove its old script tag (the SDK's top guard would skip
// re-running otherwise), and inject the pinned v171 build fresh.
export async function ensureScorpionSdk() {
  const existing = window.kcc20;
  if (existing && String(existing.sdkVersion) === REQUIRED_SDK && existing.origin === KCC20_ORIGIN) {
    await waitForSdkInit(existing);
    return existing;
  }
  try { delete window.kcc20; } catch { /* ignore */ }
  document.querySelectorAll(`script[src^="${KCC20_ORIGIN}/sdk.js"]`).forEach((el) => el.remove());
  await injectScript(SDK_URL);
  const w = await pollFor(() => window.kcc20);
  await waitForSdkInit(w);
  if (String(w.sdkVersion) !== REQUIRED_SDK) {
    throw new Error(`Scorpion wallet SDK is v${w.sdkVersion} — need v${REQUIRED_SDK}. Hard-refresh the Scorpion wallet and try again.`);
  }
  return w;
}

export async function ensureArgent() {
  if (window.kcc20Argent && window.kcc20Argent.version === REQUIRED_ARGENT) return window.kcc20Argent;
  await injectScript(ARGENT_URL);
  const argent = await pollFor(() => window.kcc20Argent);
  if (argent.version !== REQUIRED_ARGENT) {
    throw new Error(`KCC20 Argent is v${argent.version} — need v${REQUIRED_ARGENT}.`);
  }
  return argent;
}

// Connect — opens the Scorpion popup. The user approves; we get their address
// and their 32-byte Schnorr public key (the vault's owner key).
export async function connectScorpionWallet() {
  const kcc = await ensureScorpionSdk();
  const res = await kcc.connect();
  const raw = res?.address || res?.accounts?.[0] || (Array.isArray(res) ? res[0] : null);
  if (!raw) throw new Error('Scorpion did not return an address');
  const address = `kaspa:${String(raw).replace(/^kaspa:/, '')}`;
  // connect() resolves to just the accounts array — the Schnorr public key
  // lives in the wallet session and must be requested separately.
  let publicKey = res?.publicKey || null;
  if (!publicKey && typeof kcc.getPublicKey === 'function') {
    try { publicKey = await kcc.getPublicKey(); } catch { /* fall through */ }
  }
  if (!publicKey && typeof kcc.getState === 'function') {
    try { const s = await kcc.getState(); publicKey = s?.publicKey || s?.pubKey || null; } catch { /* fall through */ }
  }
  publicKey = publicKey ? String(publicKey).replace(/^0x/, '').toLowerCase() : null;
  if (publicKey && publicKey.length === 66) publicKey = publicKey.slice(-64); // compressed → x-only
  if (!publicKey || !/^[0-9a-f]{64}$/.test(publicKey)) {
    throw new Error('Scorpion did not return your Schnorr public key (need wallet BUILD 245+)');
  }
  return { address, publicKey };
}

// ── Vault storage (local, public data only) ──
export function getSearchVault() {
  try { return JSON.parse(localStorage.getItem(VAULT_KEY)) || null; } catch { return null; }
}
export function saveSearchVault(vault) {
  localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
}
export function clearSearchVault() {
  localStorage.removeItem(VAULT_KEY);
}

// Step 1 — compile the SearchVault covenant with the official silverc v1.0.0
// (runs on our side, per the wallet spec; fee recipient is pinned server-side
// to the TTT treasury key). Returns the SilAbiArtifact.
export async function compileSearchVaultArtifact(ownerPubkey) {
  const res = await base44.functions.invoke('compileSearchVault', { owner_pubkey: ownerPubkey });
  const artifact = res?.data?.artifact;
  if (!artifact) throw new Error(res?.data?.error || 'Vault compilation failed');
  return artifact;
}

// Step 2 — fund the vault through Scorpion. The wallet builds the kaspa:p P2SH;
// the user Approves + PINs. Topping up = another fund to the same vault address.
export async function fundVaultWithScorpion({ artifact, ownerPubkey, amountKas }) {
  const kcc = await ensureScorpionSdk();
  const out = await kcc.compileVault({
    type: 'searchvault',
    amount: Number(amountKas),
    params: { artifact, contract: 'SearchVault' },
  });
  if (!out?.address) throw new Error('Scorpion did not return a vault address');
  const existing = getSearchVault();
  const funds = [
    ...((existing && existing.address === String(out.address) && Array.isArray(existing.funds)) ? existing.funds : []),
    { txId: out.txId || null, amountKas: Number(amountKas), at: Date.now() },
  ];
  const vault = {
    address: String(out.address),
    ownerPubkey,
    artifact,
    funds,
    createdAt: existing?.createdAt || Date.now(),
  };
  saveSearchVault(vault);
  return vault;
}