import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import useTn10Balances from '@/lib/evolve/useTn10Balances';

export default function useEvolveChainBalances(engine, experimentId, wallet, player) {
  const { data: identities = [] } = useQuery({
    queryKey: ['evolve-wallet-identities', experimentId],
    enabled: !!experimentId,
    queryFn: () => base44.entities.EvolveAgentWallet.filter({ experiment_id: experimentId }, '-created_date', 500),
    refetchInterval: 15000,
  });
  const byAgent = new Map(identities.map(row => [row.agent_id, row]));
  const treasury = identities.find(row => row.is_treasury && !row.organization_id && row.agent_code !== 'FACTORY');
  const addressFor = actor => {
    if (!actor) return '';
    if (actor === player && wallet.isTN10) return wallet.address;
    if (actor === engine?.treasury) return treasury?.address || actor.address || '';
    const orgWallet = identities.find(row => row.organization_id === actor.id && row.is_treasury);
    return orgWallet?.address || byAgent.get(actor.agent_key || actor.id)?.address || actor.address || '';
  };
  const actors = [...(engine?.agents || []), ...(engine?.players || []), ...(engine?.orgs || []), engine?.treasury];
  const addresses = [...identities.map(row => row.address), ...actors.map(addressFor), wallet.isTN10 ? wallet.address : ''];
  const state = useTn10Balances(addresses);
  const balanceFor = actor => state.balances[addressFor(actor)];
  const totalFor = list => {
    if (!list.length) return 0;
    const addresses = [...new Set(list.map(addressFor))];
    if (addresses.some(address => !address.startsWith('kaspatest:') || state.balances[address] === undefined)) return undefined;
    return addresses.reduce((sum, address) => sum + state.balances[address], 0);
  };
  return { ...state, addressFor, balanceFor, totalFor };
}