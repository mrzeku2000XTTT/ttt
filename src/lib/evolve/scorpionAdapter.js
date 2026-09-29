/**
 * ScorpionWalletAdapter — the ONLY frontend module allowed to touch window.kcc20.
 *
 * Scorpion is a hosted PWA wallet. Its SDK (loaded in index.html) injects
 * `window.kcc20`. The dApp (EVOLVE) builds transactions; Scorpion signs and
 * broadcasts. Private keys, seeds, and PINs NEVER enter EVOLVE.
 *
 * Flow:  EVOLVE BUILDS → SCORPION SIGNS → KASPA TN10 BROADCASTS → EVOLVE OBSERVES TX
 *
 * This adapter is intentionally thin: it wraps the raw SDK calls and normalizes
 * errors. It contains NO economic logic — EVOLVE decides who pays whom and why.
 */

export const SCORPION_RDNS = "app.kcc20.wallet";
export const EVOLVE_NETWORK = "kaspa_testnet_10";
export const EVOLVE_ADDRESS_PREFIX = "kaspatest:";

/** Connection states — UI reacts to these. */
export const ScorpionConnectionState = {
  DISCONNECTED: "DISCONNECTED",
  CONNECTING: "CONNECTING",
  CONNECTED_WRONG_NETWORK: "CONNECTED_WRONG_NETWORK",
  CONNECTED_TN10: "CONNECTED_TN10",
  SIGNING: "SIGNING",
  BROADCASTING: "BROADCASTING",
  ERROR: "ERROR",
};

/** Wait for window.kcc20 to appear (SDK script is async). */
export function waitForSdk(timeoutMs = 8000) {
  return new Promise((resolve) => {
    if (window.kcc20) return resolve(true);
    const start = Date.now();
    const iv = setInterval(() => {
      if (window.kcc20) {
        clearInterval(iv);
        resolve(true);
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(iv);
        resolve(false);
      }
    }, 120);
  });
}

/** True only when the address is a TN10 kaspatest: address. */
export function isTN10Address(addr) {
  return typeof addr === "string" && addr.startsWith(EVOLVE_ADDRESS_PREFIX);
}

/**
 * Coerce whatever the SDK returns for "network" into a comparable string.
 * Some KCC20 wallets return "testnet-10", others "kaspa_testnet_10",
 * others an object — normalize before comparing.
 */
export function normalizeNetwork(net) {
  if (!net) return "";
  if (typeof net === "string") return net;
  if (typeof net === "object") return net.network || net.id || net.name || "";
  return String(net);
}

/** True when the wallet is on Kaspa TN-10, regardless of string formatting. */
export function isTN10Network(net) {
  const n = normalizeNetwork(net).toLowerCase().replace(/[-_\s]/g, "");
  return n === "kaspatestnet10" || n === "testnet10" || n === "tn10";
}

export class ScorpionWalletAdapter {
  constructor() {
    this._kcc = null;
  }

  /** Resolve the raw SDK. Throws a friendly error if Scorpion is unavailable. */
  async _sdk() {
    const ok = await waitForSdk();
    if (!ok || !window.kcc20) {
      const err = new Error("SCORPION SDK UNAVAILABLE");
      err.code = "SDK_MISSING";
      throw err;
    }
    this._kcc = window.kcc20;
    return this._kcc;
  }

  /** Connect to Scorpion. Returns the approved account address. */
  async connect() {
    const kcc = await this._sdk();
    let accounts = [];
    try {
      accounts = await kcc.connect();
    } catch (e) {
      const err = new Error("Scorpion connection rejected");
      err.code = "CONNECT_REJECTED";
      err.cause = e;
      throw err;
    }
    if (!accounts || !accounts.length) {
      const err = new Error("No accounts returned by Scorpion");
      err.code = "NO_ACCOUNTS";
      throw err;
    }
    return accounts[0];
  }

  /** Restore a session silently after a page refresh (no approval prompt). */
  async silentAccounts() {
    const kcc = await this._sdk();
    try {
      const accounts = await kcc.getAccounts();
      return accounts || [];
    } catch {
      return [];
    }
  }

  async getNetwork() {
    const kcc = await this._sdk();
    return kcc.getNetwork();
  }

  /** Ask Scorpion to switch to TN10. The wallet handles user confirmation. */
  async switchToTN10() {
    const kcc = await this._sdk();
    await kcc.switchNetwork(EVOLVE_NETWORK);
    return this.getNetwork();
  }

  async getPublicKey() {
    const kcc = await this._sdk();
    return kcc.getPublicKey();
  }

  async getUtxos(address) {
    const kcc = await this._sdk();
    return kcc.getUtxoEntries(address);
  }

  /**
   * Balance. Returns { confirmed, unconfirmed, address } with SOMPI integer
   * values. We never use floating-point for blockchain amounts.
   */
  async getBalance(address) {
    const kcc = await this._sdk();
    const res = await kcc.getBalance(address);
    return {
      confirmed: BigInt(res?.confirmed ?? 0),
      unconfirmed: BigInt(res?.unconfirmed ?? 0),
      address: res?.address || address,
    };
  }

  async getHoldings() {
    const kcc = await this._sdk();
    try {
      return await kcc.getHoldings();
    } catch {
      return [];
    }
  }

  /**
   * Simple user-confirmed KAS payment. Scorpion opens its approval sheet,
   * the user PIN-signs, and Scorpion broadcasts. EVOLVE never bypasses this.
   * Returns { txId, ... } — we read result.txId, never assume a bare string.
   */
  async sendKaspa({ to, amountSompi }) {
    const kcc = await this._sdk();
    const result = await kcc.sendKaspa({ to, amount: String(amountSompi.toString()) });
    const txId = result?.txId || result?.txid || result?.tx_id || null;
    if (!txId) {
      const err = new Error("Scorpion did not return a transaction id");
      err.code = "NO_TXID";
      err.raw = result;
      throw err;
    }
    return { txId, raw: result };
  }

  /**
   * Sign an unsigned rusty-kaspa Safe JSON PSKT. `signInputs` are GLOBAL tx.inputs[]
   * indexes for the wallet's own P2PK funding inputs — never covenant/pool inputs.
   * sighashType 1 = SIGHASH_ALL.
   */
  async signPskt({ txJsonString, signInputs }) {
    const kcc = await this._sdk();
    const signed = await kcc.signPskt({
      txJsonString,
      options: { signInputs, sighashType: 1 },
    });
    return signed;
  }

  /** Broadcast a signed Safe JSON. Returns { txId }. */
  async pushTx(signedTxJsonString) {
    const kcc = await this._sdk();
    const result = await kcc.pushTx(signedTxJsonString);
    const txId = result?.txId || result?.txid || result?.tx_id || null;
    if (!txId) {
      const err = new Error("pushTx did not return a transaction id");
      err.code = "NO_TXID";
      err.raw = result;
      throw err;
    }
    return { txId, raw: result };
  }

  /** Send a KCC20 token. Kept available but not required for core gameplay. */
  async sendToken({ tick, amount, dest }) {
    const kcc = await this._sdk();
    return kcc.sendToken({ tick, amount, dest });
  }

  /** Open the Scorpion wallet UI itself (for SEND / TOKENS / key management). */
  async openWallet() {
    const kcc = await this._sdk();
    return kcc.openWallet();
  }

  async disconnect() {
    const kcc = await this._sdk();
    try {
      await kcc.disconnect();
    } catch {
      /* disconnect only severs the EVOLVE↔wallet session, not the wallet itself */
    }
  }
}

/** Singleton — there is one Scorpion session per EVOLVE tab. */
export const scorpion = new ScorpionWalletAdapter();

/**
 * KIP-12 provider discovery. Scorpion announces itself via a `kaspa:provider`
 * event and identifies with rdns `app.kcc20.wallet`. We request providers by
 * dispatching `kaspa:requestProvider`. Future wallets (KasWare) can hook in here.
 */
export function discoverProviders(onProvider) {
  if (typeof window === "undefined") return () => {};
  const handler = (e) => {
    const info = e?.detail || {};
    if (info?.rdns === SCORPION_RDNS || info?.name?.toLowerCase?.().includes("scorpion")) {
      onProvider({ rdns: info.rdns || SCORPION_RDNS, name: info.name || "Scorpion", kcc20: true });
    } else if (info?.rdns) {
      onProvider({ rdns: info.rdns, name: info.name || info.rdns, kcc20: false });
    }
  };
  window.addEventListener("kaspa:provider", handler);
  try {
    window.dispatchEvent(new Event("kaspa:requestProvider"));
  } catch {}
  return () => window.removeEventListener("kaspa:provider", handler);
}