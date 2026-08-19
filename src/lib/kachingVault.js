// KaChing wallet + multisig vault storage — all client-side, localStorage.
// Built on top of localKaspaWallet's address derivation so keys/addresses
// match the rest of TTT byte-for-byte.
//
// Multi-wallet model: a collection of wallets under `kaching_wallets`, with
// `kaching_active_wallet_id` pointing at the one in use. All the original
// single-wallet helpers (getKaChingWallet, saveWallet, deriveFreshReceiveAddress,
// getAllOwnedAddresses, getPrivateKeyFor …) operate on the ACTIVE wallet, so
// existing components keep working unchanged.
import { addressFromPrivateKey, addressFromPubKey, isValidKaspaAddress } from "@/lib/localKaspaWallet";
import { schnorr } from "@noble/curves/secp256k1";
import { secp256k1 } from "@noble/curves/secp256k1";

const WALLETS_KEY = "kaching_wallets";
const ACTIVE_KEY = "kaching_active_wallet_id";
// Legacy single-wallet key — migrated on first load.
const LEGACY_WALLET_KEY = "kaching_wallet";
const VAULTS_KEY = "kaching_vaults";
const PROPOSALS_KEY = "kaching_proposals";

function bytesToHex(bytes) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function hexToBytes(hex) {
  const h = String(hex).replace(/^0x/, "").toLowerCase();
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.substr(i * 2, 2), 16);
  return out;
}
function randPriv() {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  if (b.every((x) => x === 0)) b[0] = 1;
  return bytesToHex(b);
}
function xOnlyPubFromPriv(privHex) {
  return bytesToHex(secp256k1.getPublicKey(hexToBytes(privHex), true).slice(1));
}

export function newCosignerKeypair(label = "Cosigner") {
  const privateKey = randPriv();
  const pubKey = xOnlyPubFromPriv(privateKey);
  const address = addressFromPrivateKey(privateKey);
  return { privateKey, pubKey, address, label };
}

/* ── Multi-wallet storage ─────────────────────────────────────────────── */
function readWallets() {
  try { return JSON.parse(localStorage.getItem(WALLETS_KEY) || "[]"); } catch { return []; }
}
function writeWallets(arr) {
  try { localStorage.setItem(WALLETS_KEY, JSON.stringify(arr)); } catch {}
}
function readActiveId() {
  try { return localStorage.getItem(ACTIVE_KEY) || null; } catch { return null; }
}
function writeActiveId(id) {
  try { id ? localStorage.setItem(ACTIVE_KEY, id) : localStorage.removeItem(ACTIVE_KEY); } catch {}
}

// One-time migration of the legacy single-wallet record into the collection.
function migrateLegacy() {
  const arr = readWallets();
  if (arr.length > 0) return;
  try {
    const legacy = JSON.parse(localStorage.getItem(LEGACY_WALLET_KEY) || "null");
    if (legacy && Array.isArray(legacy.addresses) && legacy.addresses.length) {
      const id = crypto.randomUUID();
      const w = { id, name: legacy.imported ? "Imported" : "Wallet 1", createdAt: legacy.createdAt || Date.now(), imported: !!legacy.imported, addresses: legacy.addresses };
      writeWallets([w]);
      writeActiveId(id);
      localStorage.removeItem(LEGACY_WALLET_KEY);
    }
  } catch {}
}
migrateLegacy();

function findWallet(id) { return readWallets().find((w) => w.id === id) || null; }

function defaultName(arr, base) {
  const taken = new Set(arr.map((w) => w.name));
  let i = arr.length + 1;
  let name = `${base} ${i}`;
  while (taken.has(name)) name = `${base} ${++i}`;
  return name;
}

/* ── Active-wallet helpers (backward compatible) ──────────────────────── */
export function getKaChingWallet() {
  const id = readActiveId();
  return id ? findWallet(id) : (readWallets()[0] || null);
}
export function saveWallet(w) {
  if (!w || !w.id) return;
  const arr = readWallets();
  const idx = arr.findIndex((x) => x.id === w.id);
  if (idx >= 0) arr[idx] = w; else arr.push(w);
  writeWallets(arr);
  if (!readActiveId()) writeActiveId(w.id);
}
export function clearKaChingWallet() {
  // Remove the active wallet from the collection (legacy "clear" behaviour).
  const id = readActiveId();
  if (!id) return;
  writeWallets(readWallets().filter((w) => w.id !== id));
  writeActiveId(readWallets()[0]?.id || null);
}

/* ── New multi-wallet API ─────────────────────────────────────────────── */
export function listKaChingWallets() { return readWallets(); }
export function getActiveKaChingWalletId() {
  return readActiveId() || readWallets()[0]?.id || null;
}
export function setActiveKaChingWallet(id) {
  if (findWallet(id)) writeActiveId(id);
}

export function createKaChingWalletNamed(name) {
  const arr = readWallets();
  const privateKey = randPriv();
  const address = addressFromPrivateKey(privateKey);
  const w = {
    id: crypto.randomUUID(),
    name: name || defaultName(arr, "Wallet"),
    createdAt: Date.now(),
    addresses: [{ privateKey, address, label: "Primary", used: false, createdAt: Date.now() }],
  };
  arr.push(w);
  writeWallets(arr);
  writeActiveId(w.id);
  return w;
}
export function importKaChingWalletNamed(privateKeyHex, name) {
  const pk = String(privateKeyHex).trim().toLowerCase().replace(/^0x/, "");
  if (!/^[0-9a-f]{64}$/.test(pk)) throw new Error("Private key must be 64 hex chars");
  const arr = readWallets();
  const address = addressFromPrivateKey(pk);
  const w = {
    id: crypto.randomUUID(),
    name: name || defaultName(arr, "Imported"),
    createdAt: Date.now(),
    imported: true,
    addresses: [{ privateKey: pk, address, label: "Imported", used: false, createdAt: Date.now() }],
  };
  arr.push(w);
  writeWallets(arr);
  writeActiveId(w.id);
  return w;
}
export function renameKaChingWallet(id, name) {
  const arr = readWallets();
  const w = arr.find((x) => x.id === id);
  if (w) { w.name = String(name || "Wallet").slice(0, 40) || w.name; writeWallets(arr); }
}
export function deleteKaChingWallet(id) {
  let arr = readWallets().filter((w) => w.id !== id);
  writeWallets(arr);
  if (readActiveId() === id) writeActiveId(arr[0]?.id || null);
  return arr;
}

/** Exit / log out of the whole wallet session — wipes every stored wallet. */
export function exitKaChingSession() {
  writeWallets([]);
  writeActiveId(null);
  try { localStorage.removeItem(LEGACY_WALLET_KEY); } catch {}
}

/* ── Backward-compatible wallet factories (now multi-wallet aware) ─────── */
export function createKaChingWallet() { return createKaChingWalletNamed(); }
export function importKaChingWallet(privateKeyHex) { return importKaChingWalletNamed(privateKeyHex); }

/* ── Address derivation / lookup (operate on active wallet) ────────────── */
export function deriveFreshReceiveAddress(label = "") {
  const w = getKaChingWallet();
  if (!w) return null;
  const privateKey = randPriv();
  const address = addressFromPrivateKey(privateKey);
  const entry = {
    privateKey,
    address,
    label: label || `Address ${w.addresses.length + 1}`,
    used: false,
    createdAt: Date.now(),
  };
  w.addresses.push(entry);
  saveWallet(w);
  return entry;
}
export function markAddressUsed(address) {
  const w = getKaChingWallet();
  if (!w) return;
  const a = w.addresses.find((x) => x.address === address);
  if (a) { a.used = true; saveWallet(w); }
}
export function getAllOwnedAddresses() {
  const w = getKaChingWallet();
  return w ? w.addresses : [];
}
export function getPrivateKeyFor(address) {
  const w = getKaChingWallet();
  if (!w) return null;
  const a = w.addresses.find((x) => x.address === address);
  return a ? a.privateKey : null;
}
export { isValidKaspaAddress };

/* ── Multisig vaults (m-of-n co-signer approval) ────────────────────────── */
export function getVaults() {
  try { return JSON.parse(localStorage.getItem(VAULTS_KEY) || "[]"); } catch { return []; }
}
function saveVaults(v) { try { localStorage.setItem(VAULTS_KEY, JSON.stringify(v)); } catch {} }

export function createVault(name, threshold, cosigners) {
  const v = {
    id: crypto.randomUUID(),
    name: name || "Vault",
    threshold: Number(threshold),
    cosigners: cosigners.map((c) => ({
      label: c.label || "Cosigner",
      pubKey: c.pubKey,
      address: c.address || addressFromPubKey(c.pubKey),
    })),
    createdAt: Date.now(),
  };
  const all = getVaults();
  all.push(v);
  saveVaults(all);
  return v;
}
export function deleteVault(id) {
  saveVaults(getVaults().filter((v) => v.id !== id));
  saveProposals(getProposals().filter((p) => p.vaultId !== id));
}

/* ── Proposals ─────────────────────────────────────────────────────────── */
export function getProposals() {
  try { return JSON.parse(localStorage.getItem(PROPOSALS_KEY) || "[]"); } catch { return []; }
}
function saveProposals(p) { try { localStorage.setItem(PROPOSALS_KEY, JSON.stringify(p)); } catch {} }

function proposalMessage(p) {
  return new TextEncoder().encode(
    `${p.vaultId}|${p.fromAddress}|${p.toAddress}|${p.amountKas}|${JSON.stringify(p.selectedOutpoints || [])}`
  );
}

export function createProposal(vaultId, fromAddress, toAddress, amountKas, selectedOutpoints) {
  const p = {
    id: crypto.randomUUID(),
    vaultId,
    fromAddress,
    toAddress,
    amountKas: String(amountKas),
    selectedOutpoints: selectedOutpoints || [],
    signatures: [], // [{ pubKey, sig }]
    status: "pending", // pending | ready | executed
    createdAt: Date.now(),
  };
  const all = getProposals();
  all.push(p);
  saveProposals(all);
  return p;
}

// Sign a proposal as a cosigner. Returns the signature hex or throws.
export function signProposal(proposalId, signerPrivateKey) {
  const all = getProposals();
  const p = all.find((x) => x.id === proposalId);
  if (!p) throw new Error("Proposal not found");
  const priv = String(signerPrivateKey).trim().toLowerCase().replace(/^0x/, "");
  if (!/^[0-9a-f]{64}$/.test(priv)) throw new Error("Invalid private key");
  const pubKey = xOnlyPubFromPriv(priv);
  const msg = proposalMessage(p);
  const sig = schnorr.sign(msg, hexToBytes(priv));
  const sigHex = bytesToHex(sig);
  // remove any prior sig by this cosigner, then add
  p.signatures = (p.signatures || []).filter((s) => s.pubKey !== pubKey);
  p.signatures.push({ pubKey, sig: sigHex });
  const vault = getVaults().find((v) => v.id === p.vaultId);
  if (vault && p.signatures.length >= vault.threshold) p.status = "ready";
  saveProposals(all);
  return { pubKey, sig: sigHex, status: p.status };
}

export function proposalReady(p) {
  const vault = getVaults().find((v) => v.id === p.vaultId);
  if (!vault) return false;
  return (p.signatures || []).length >= vault.threshold;
}

export function markProposalExecuted(proposalId, txId) {
  const all = getProposals();
  const p = all.find((x) => x.id === proposalId);
  if (p) { p.status = "executed"; p.txId = txId; saveProposals(all); }
}

export function deleteProposal(id) {
  saveProposals(getProposals().filter((p) => p.id !== id));
}