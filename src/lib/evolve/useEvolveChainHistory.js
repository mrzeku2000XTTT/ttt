import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function useEvolveChainHistory(experimentId) {
  const query = useQuery({
    queryKey: ['evolve-chain-history', experimentId],
    enabled: !!experimentId,
    queryFn: () => base44.entities.EvolveChainTx.filter({ experiment_id: experimentId, network: 'kaspa_testnet_10' }, '-created_date', 500),
    refetchInterval: 15000,
  });
  const unique = new Map();
  for (const row of query.data || []) {
    if (/^[a-f0-9]{64}$/i.test(row.txid || '') && !unique.has(row.txid)) unique.set(row.txid, row);
  }
  return { rows: [...unique.values()], ready: !!query.data && !query.isError && query.data.length < 500 };
}