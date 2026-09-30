import React from 'react';
import { useEvolve } from '@/lib/evolve/useEvolve';

export default function LiveBalance({ actor, actors, median = false, unit = false }) {
  const { chainBalances } = useEvolve();
  let value = actors ? chainBalances.totalFor(actors) : chainBalances.balanceFor(actor);
  if (median && actors && value !== undefined) {
    const sorted = actors.map(chainBalances.balanceFor).sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    value = !sorted.length ? 0 : sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return <span title="TN-10 chain balance · refreshes every 15 seconds">{value === undefined ? (chainBalances.loading ? '…' : 'N/A') : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}{unit && value !== undefined ? ' tKAS' : ''}</span>;
}