/**
 * KaspaService — the ONLY component allowed to speak to a ledger.
 * The rest of EVOLVE calls this interface and never a blockchain library directly,
 * so MockKaspaService can be swapped for TN10KaspaService without touching the app.
 *
 * Private signing material never leaves this layer. Callers only ever receive
 * addresses, balances and transaction records.
 */

import { isolatedMockEnabled, tn10BlockedMessage } from '@/lib/evolve/tn10Safety';
export const NETWORK = "kaspa-tn10";

export class KaspaService {
  constructor() {
    this.network = NETWORK;
    this.ledger = "unknown";
  }
  createAgentWallet() { throw new Error("createAgentWallet not implemented"); }
  getBalance() { throw new Error("getBalance not implemented"); }
  sendPayment() { throw new Error("sendPayment not implemented"); }
  watchAddress() { throw new Error("watchAddress not implemented"); }
  getTransaction() { throw new Error("getTransaction not implemented"); }
  confirmTransaction() { throw new Error("confirmTransaction not implemented"); }
  tick() { return []; }
}

/**
 * DEVELOPMENT LEDGER — simulates wallets, balances, sends and confirmations.
 * Confirmation timing is wall-clock based and is deliberately NOT accelerated by
 * simulation speed, exactly as the real network would behave.
 */
export class MockKaspaService extends KaspaService {
  constructor({ confirmAfterMs = 9000 } = {}) {
    super();
    if (!isolatedMockEnabled) throw new Error('MOCK_LEDGER_DISABLED: isolated development opt-in required');
    this.ledger = "mock";
    this.confirmAfterMs = confirmAfterMs;
    this.seq = 0;
    this.pending = [];
    this.watched = new Set();
    this.byTx = new Map();
    this.balances = new Map();
  }

  createAgentWallet(agentId) {
    this.seq += 1;
    // Deliberately non-blockchain identifier, never a fabricated kaspatest address.
    const address = `mock:${agentId}:${this.seq}`;
    this.watched.add(address);
    return { walletId: `W${String(this.seq).padStart(5, "0")}`, address, agentId, network: this.network, ledger: "mock" };
  }

  credit(address, amount) {
    this.balances.set(address, Number((this.balances.get(address) || 0) + amount));
    return this.balances.get(address);
  }

  getBalance(address) {
    return Number(this.balances.get(address) || 0);
  }

  sendPayment({ from, to, amount, note = "" }) {
    const txid = `mock${(this.seq += 1).toString(16).padStart(8, "0")}${Math.floor(Math.random() * 1e8)
      .toString(16)
      .padStart(8, "0")}`;
    const tx = {
      txid,
      from,
      to,
      amount: Number(amount) || 0,
      note,
      status: "PENDING",
      confirmations: 0,
      ledger: "mock",
      created_at: Date.now(),
    };
    this.pending.push(tx);
    this.byTx.set(txid, tx);
    return tx;
  }

  /** Wall-clock only. Simulation speed never touches this. */
  tick(now = Date.now()) {
    const done = [];
    this.pending = this.pending.filter((tx) => {
      const elapsed = now - tx.created_at;
      tx.confirmations = Math.min(3, Math.floor((elapsed / this.confirmAfterMs) * 3));
      if (elapsed >= this.confirmAfterMs) {
        tx.status = "CONFIRMED";
        tx.confirmations = 3;
        done.push(tx);
        return false;
      }
      return true;
    });
    return done;
  }

  watchAddress(address) {
    this.watched.add(address);
    return true;
  }

  getTransaction(txid) {
    return this.byTx.get(txid) || null;
  }

  confirmTransaction(txid) {
    const tx = this.byTx.get(txid);
    if (!tx) return null;
    tx.status = "CONFIRMED";
    tx.confirmations = 3;
    return tx;
  }
}

/**
 * Real TN-10 adapter. Phase 5 replaces the mock with this — the interface is
 * identical, so no UI or engine code changes.
 */
export class TN10KaspaService extends KaspaService {
  constructor({ rpcUrl } = {}) {
    super();
    this.ledger = "tn10";
    this.rpcUrl = rpcUrl || "";
  }
  _todo() {
    throw new Error(tn10BlockedMessage);
  }
  createAgentWallet() { return this._todo(); }
  getBalance() { return this._todo(); }
  sendPayment() { return this._todo(); }
  watchAddress() { return this._todo(); }
  getTransaction() { return this._todo(); }
  confirmTransaction() { return this._todo(); }
}

export function createKaspaService(mode = "tn10") {
  // Legacy experiment settings cannot opt production into mock execution.
  return mode === 'mock' && isolatedMockEnabled ? new MockKaspaService() : new TN10KaspaService();
}