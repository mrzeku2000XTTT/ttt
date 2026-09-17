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
const SILVER_URL = 'https://kcc20-sdk.vercel.app/silverscript.js';
const REQUIRED_SDK = '171';
// One pay_search_fee burns 100_000 sompi fee + 1000 sompi miner fee.
export const VAULT_SPEND_SOMPI = 101000;
const REQUIRED_ARGENT = '1.4.0';

// Official Search Kaspa / TTT treasury (ews chip) — 32-byte Schnorr pubkey,
// NOT a kaspa:q address. SearchVault pays this key per search fee.
export const TREASURY_PUBKEY = '284bb3e4d46276c03d2ef6aaa0e0d62ec2698f939d1b55a8011d77fe5ca6f7ba';
export const TREASURY_ADDRESS = 'kaspa:qq5yhvly6338dspa9mm24g8q6chvy6v0jww3k4dgqywh0lju5mmm5pj334ews';

const VAULT_KEY = 'search_kaspa_vault';

// A URL counts as loaded only after its onload fired. A FAILED injection
// leaves a dead <script> tag behind — treating "tag exists" as "script is
// loaded" made every later connect short-circuit and time out forever.
const loadedScripts = new Set();

function injectScript(src) {
  return new Promise((resolve, reject) => {
    if (loadedScripts.has(src)) { resolve(); return; }
    // Any existing tag with this exact src is dead or duplicate — a healthy
    // load would have set its global and the caller's fast path would have
    // skipped injectScript entirely. Removing it cancels/replaces cleanly.
    document.querySelectorAll(`script[src="${src}"]`).forEach((el) => el.remove());
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => { loadedScripts.add(src); resolve(); };
    s.onerror = () => { s.remove(); reject(new Error(`Could not load ${src}`)); };
    document.head.appendChild(s);
  });
}

function pollFor(getter, ms = 8000, message = 'Scorpion wallet SDK did not initialize') {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const iv = setInterval(() => {
      const v = getter();
      if (v) { clearInterval(iv); resolve(v); return; }
      if (Date.now() - started > ms) { clearInterval(iv); reject(new Error(message)); }
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
  // Kill the stale instance two ways — if delete fails (non-configurable
  // property), undefined still defeats the SDK's own top guard on re-inject.
  try { window.kcc20 = undefined; } catch { /* ignore */ }
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
  const argent = await pollFor(() => window.kcc20Argent, 8000, 'KCC20 Argent did not initialize');
  if (argent.version !== REQUIRED_ARGENT) {
    throw new Error(`KCC20 Argent is v${argent.version} — need v${REQUIRED_ARGENT}.`);
  }
  return argent;
}

// SilverScript ABI encoder (window.kcc20Silver.encodeEntry) — needed for the
// wallet to sign pay_search_fee / unlock against the stored silverc artifact.
export async function ensureSilver() {
  if (window.kcc20Silver) return window.kcc20Silver;
  await injectScript(SILVER_URL);
  return pollFor(() => window.kcc20Silver, 8000, 'SilverScript encoder did not initialize');
}

/** Truly disconnect: revoke the wallet-side session too, so the next Connect
 * runs the full Approve flow in Scorpion instead of silently reusing the
 * stale one (which can no longer yield a public key). No-op if the SDK
 * never loaded. */
export function disconnectScorpionSession() {
  try {
    const kcc = window.kcc20;
    if (kcc && typeof kcc.disconnect === 'function') kcc.disconnect().catch(() => {});
  } catch { /* wallet already gone */ }
}

// Connect — opens the Scorpion popup. The user approves; we get their address
// and their 32-byte Schnorr public key (the vault's owner key).
export async function connectScorpionWallet() {
  const kcc = await ensureScorpionSdk();
  await ensureArgent();
  await ensureSilver();
  const res = await kcc.connect();
  const raw = res?.address || res?.accounts?.[0] || (Array.isArray(res) ? res[0] : null);
  if (!raw) throw new Error('Scorpion did not return an address');
  const address = `kaspa:${String(raw).replace(/^kaspa:/, '')}`;
  if (typeof kcc.getNetwork === 'function') {
    let network = null;
    try { network = await kcc.getNetwork(); } catch { /* optional call */ }
    if (network && network !== 'kaspa_mainnet') {
      throw new Error(`Switch Scorpion to kaspa_mainnet (currently ${network}).`);
    }
  }
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
  const argent = await ensureArgent();
  // Argent intent gate — "fund search kaspa vault" must parse as the
  // searchvault covenant, never the generic capsule/Sweep sheet.
  const directed = typeof argent.direct === 'function'
    ? await argent.direct('fund search kaspa vault 1 kas')
    : null;
  if (directed?.type && directed.type !== 'searchvault') {
    throw new Error(`Argent understood this as "${directed.type}" — expected the SearchVault covenant.`);
  }
  const out = await kcc.compileVault({
    type: 'searchvault',
    amount: Number(amountKas),
    params: { artifact, contract: 'SearchVault' },
  });
  if (!out?.address) throw new Error('Scorpion did not return a vault address');
  const existing = getSearchVault();
  const sameVault = Boolean(existing && existing.address === String(out.address));
  const funds = [
    ...((sameVault && Array.isArray(existing.funds)) ? existing.funds : []),
    { txId: out.txId || null, amountKas: Number(amountKas), at: Date.now() },
  ];
  const prevRemaining = sameVault
    ? (Number.isFinite(existing.remainingSompi)
        ? existing.remainingSompi
        : (existing.funds || []).reduce((s, f) => s + Math.round(Number(f.amountKas) * 1e8), 0))
    : 0;
  const vault = {
    address: String(out.address),
    ownerPubkey,
    artifact,
    funds,
    remainingSompi: prevRemaining + Math.round(Number(amountKas) * 1e8),
    spentSearches: sameVault ? (existing.spentSearches || 0) : 0,
    createdAt: existing?.createdAt || Date.now(),
  };
  saveSearchVault(vault);
  return vault;
}

// Step D — each search spends the vault UTXO with entry pay_search_fee:
// exactly 100_000 sompi to the treasury P2PK and the change back to the SAME
// covenant. The owner signs in Scorpion (PIN/KasWare) — we never see a key,
// and this is NOT sendKas, NOT Sweep, NOT a capsule spend.
export async function spendSearchFee() {
  const vault = getSearchVault();
  if (!vault?.address || !vault?.artifact) throw new Error('No funded Search Vault on this device');
  const kcc = await ensureScorpionSdk();
  await ensureSilver();
  if (typeof kcc.spendSilverEntry !== 'function') {
    throw new Error('This Scorpion build cannot spend covenant entries yet — update the KCC20 wallet and retry.');
  }
  const out = await kcc.spendSilverEntry({
    address: vault.address,
    artifact: vault.artifact,
    contract: 'SearchVault',
    entry: 'pay_search_fee',
    args: [],
  });
  const txId = out?.txId || out?.txid || null;
  if (!txId) {
    throw new Error(out?.error || 'pay_search_fee did not complete — no tx id from Scorpion.');
  }
  vault.spentSearches = (vault.spentSearches || 0) + 1;
  vault.remainingSompi = Math.max(0, (Number.isFinite(vault.remainingSompi) ? vault.remainingSompi : 0) - VAULT_SPEND_SOMPI);
  vault.lastSpendTxId = txId;
  saveSearchVault(vault);
  return { txId };
}

// Step E — unlock returns ALL leftover KAS to the owner P2PK (one output).
// This is the emergency exit, NOT the search action; the vault is gone after.
export async function unlockVault() {
  const vault = getSearchVault();
  if (!vault?.address || !vault?.artifact) throw new Error('No vault to unlock');
  const kcc = await ensureScorpionSdk();
  await ensureSilver();
  if (typeof kcc.spendSilverEntry !== 'function') {
    throw new Error('This Scorpion build cannot spend covenant entries yet — update the KCC20 wallet and retry.');
  }
  const out = await kcc.spendSilverEntry({
    address: vault.address,
    artifact: vault.artifact,
    contract: 'SearchVault',
    entry: 'unlock',
    args: [],
  });
  const txId = out?.txId || out?.txid || null;
  if (!txId) {
    throw new Error(out?.error || 'unlock did not complete — no tx id from Scorpion.');
  }
  clearSearchVault();
  return { txId };
}