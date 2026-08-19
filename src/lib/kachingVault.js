// KaChing wallet + multisig vault storage — all client-side, localStorage.
// Built on top of localKaspaWallet's address derivation so keys/addresses
// match the rest of TTT byte-for-byte.
import { addressFromPrivateKey, addressFromPubKey, isValidKaspaAddress } from "@/lib/localKaspaWallet";
import { schnorr } from "@noble/curves/secp256k1";
import { secp256k1 } from "@noble/curves/secp256k1";

const WALLET_KEY = "kaching_wallet";
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

/* ── Wallet (collection of owned addresses + keys) ─────────────────────── */
export function createKaChingWallet() {
  const privateKey = randPriv();
  const address = addressFromPrivateKey(privateKey);
  const wallet = {
    createdAt: Date.now(),
    addresses: [{ privateKey, address, label: "Primary", used: false, createdAt: Date.now() }],
  };
  saveWallet(wallet);
  return wallet;
}

export function importKaChingWallet(privateKeyHex) {
  const pk = String(privateKeyHex).trim().toLowerCase().replace(/^0x/, "");
  if (!/^[0-9a-f]{64}$/.test(pk)) throw new Error("Private key must be 64 hex chars");
  const address = addressFromPrivateKey(pk);
  const wallet = {
    createdAt: Date.now(),
    imported: true,
    addresses: [{ privateKey: pk, address, label: "Imported", used: false, createdAt: Date.now() }],
  };
  saveWallet(wallet);
  return wallet;
}

export function saveWallet(w) {
  try { localStorage.setItem(WALLET_KEY, JSON.stringify(w)); } catch {}
}
export function getKaChingWallet() {
  try { const r = localStorage.getItem(WALLET_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
}
export function clearKaChingWallet() {
  try { localStorage.removeItem(WALLET_KEY); } catch {}
}

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