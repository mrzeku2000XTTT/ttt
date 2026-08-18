/**
 * Agent training log — every self-send transaction is one training epoch,
 * timestamped and anchored by its Kaspa txid. Kept in localStorage so guests
 * can train without an account.
 */

const KEY = "agent_internet_training_log";
const MAX = 200;

export function getEpochs() {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function addEpoch(epoch) {
  const list = [epoch, ...getEpochs()].slice(0, MAX);
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {}
  return list;
}

export function clearEpochs() {
  try { localStorage.removeItem(KEY); } catch {}
}

/** Derived training stats used by the studio UI. */
export function getTrainingStats() {
  const epochs = getEpochs();
  const confirmed = epochs.filter((e) => e.txId);
  const kas = confirmed.reduce((s, e) => s + (Number(e.amountKas) || 0), 0);
  return {
    total: epochs.length,
    confirmed: confirmed.length,
    kasCycled: kas,
    // Agent "level" grows with proven on-chain training epochs.
    level: Math.floor(confirmed.length / 5) + (confirmed.length ? 1 : 0),
  };
}