import React from 'react';
import { useEvolve } from '@/lib/evolve/useEvolve';

export default function ChainAmount({ actor, actors, direction = 'in', unit = false }) {
  const { chainHistory, chainBalances } = useEvolve();
  const addresses = [...new Set((actors || [actor]).map(chainBalances.addressFor))];
  if (!chainHistory.ready || addresses.some(address => !address.startsWith('kaspatest:'))) return <span>N/A</span>;
  let total = 0;
  for (const row of chainHistory.rows) {
    const pending = ['BROADCAST', 'CONFIRMING'].includes(row.status);
    if (direction === 'pending' ? !pending : !['CONFIRMED', 'SETTLED'].includes(row.status)) continue;
    const amount = Number(row.amount_sompi) / 1e8;
    if (!Number.isFinite(amount)) continue;
    const received = addresses.includes(row.recipient_address);
    const sent = addresses.includes(row.sender_address);
    if (direction === 'in' && received) total += amount;
    if (['out', 'pending'].includes(direction) && sent) total += amount;
    if (direction === 'net') total += (received ? amount : 0) - (sent ? amount : 0);
  }
  return <span title="Recorded EVOLVE transactions confirmed on TN-10">{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}{unit ? ' tKAS' : ''}</span>;
}