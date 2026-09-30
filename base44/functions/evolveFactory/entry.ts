import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { generateTestnetWallet } from '../../shared/kaspaAddress.ts';
import { FACTORY_PARAMS, FACTORY_AGENT_ID, SOMPI, paidToAddress } from '../../shared/evolveFactory.ts';

/**
 * evolveFactory — the AI Factory. After Genesis, no agent appears for free:
 * every Factory birth is backed by a verified TN-10 payment.
 *
 * actions:
 *  info    → params, factory address, capacity used today, caller's active count, paid-but-unspawned births
 *  birth   → verify generation-cost tx paid to the factory, mint the agent's own TN-10 wallet
 *  spawn   → verify starting-capital tx paid to the agent's wallet, mark SPAWNED
 */
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const { action, experimentId } = body;
    if (!experimentId) return Response.json({ error: 'MISSING_PARAMS: experimentId' }, { status: 400 });

    // Factory wallet: created once, key stays server-side.
    let factory = (await svc.entities.EvolveAgentWallet.filter({ agent_id: FACTORY_AGENT_ID }))[0];
    if (!factory) {
      const { mnemonic, address } = generateTestnetWallet();
      await svc.entities.EvolveAgentKey.create({
        agent_id: FACTORY_AGENT_ID, label: 'EVOLVE AI Factory', network: 'kaspa_testnet_10',
        address, mnemonic, derivation_path: "m/44'/111111'/0'/0/0",
      });
      factory = await svc.entities.EvolveAgentWallet.create({
        experiment_id: experimentId, agent_id: FACTORY_AGENT_ID, agent_code: 'FACTORY',
        wallet_id: 'WFACTORY', network: 'kaspa_testnet_10', address, status: 'active', is_treasury: true,
      });
    }

    const dayStart = new Date(); dayStart.setUTCHours(0, 0, 0, 0);
    const births = await svc.entities.EvolveAgentWallet.filter({ experiment_id: experimentId, origin: 'FACTORY' }, '-created_date', 500);
    const birthsToday = births.filter((b) => new Date(b.created_date) >= dayStart).length;
    const mine = births.filter((b) => b.owner_user_id === user.id && b.status !== 'archived');

    if (action === 'info') {
      return Response.json({
        ok: true,
        params: FACTORY_PARAMS,
        factoryAddress: factory.address,
        birthsToday,
        activeCount: mine.length,
        pending: mine.filter((b) => b.birth_status === 'FEE_PAID')
          .map((b) => ({ agentId: b.agent_id, agentCode: b.agent_code, address: b.address })),
      });
    }

    if (action === 'birth') {
      const { agentId, agentCode, feeTxid, senderAddress } = body;
      if (!agentId || !feeTxid) return Response.json({ error: 'MISSING_PARAMS: agentId, feeTxid' }, { status: 400 });
      if (mine.length >= FACTORY_PARAMS.max_active_per_human) {
        return Response.json({ ok: false, error: `Active agent limit reached (${FACTORY_PARAMS.max_active_per_human})` });
      }
      if (birthsToday >= FACTORY_PARAMS.daily_capacity) {
        return Response.json({ ok: false, error: 'Factory is at full capacity for today' });
      }
      const reused = await svc.entities.EvolveAgentWallet.filter({ factory_fee_txid: feeTxid });
      if (reused.length) return Response.json({ ok: false, error: 'This payment was already used for a birth' });

      const tx = await paidToAddress(feeTxid, factory.address);
      if (!tx.found) return Response.json({ ok: false, pending: true, error: 'Payment not visible on TN-10 yet — try again in a moment' });
      const needed = FACTORY_PARAMS.generation_cost_kas * SOMPI;
      if (tx.paidSompi < needed) return Response.json({ ok: false, error: 'Payment to the Factory is below the generation cost' });
      if (senderAddress && tx.inputAddresses.length && !tx.inputAddresses.includes(senderAddress)) {
        return Response.json({ ok: false, error: 'Payment was not sent from your connected wallet' });
      }

      const { mnemonic, address } = generateTestnetWallet();
      await svc.entities.EvolveAgentKey.create({
        agent_id: agentId, label: agentCode || agentId, network: 'kaspa_testnet_10',
        address, mnemonic, derivation_path: "m/44'/111111'/0'/0/0",
      });
      await svc.entities.EvolveAgentWallet.create({
        experiment_id: experimentId, agent_id: agentId, agent_code: agentCode || '',
        wallet_id: `W${Date.now().toString(36).toUpperCase()}`, network: 'kaspa_testnet_10',
        address, status: 'active', owner_user_id: user.id, origin: 'FACTORY',
        birth_status: 'FEE_PAID', factory_fee_txid: feeTxid, created_at: new Date().toISOString(),
      });
      return Response.json({ ok: true, agentId, address });
    }

    if (action === 'spawn') {
      const { agentId, capitalTxid } = body;
      const rec = mine.find((b) => b.agent_id === agentId);
      if (!rec) return Response.json({ ok: false, error: 'No paid birth found for this agent' });
      if (rec.birth_status === 'SPAWNED') return Response.json({ ok: true, address: rec.address, already: true });
      const tx = await paidToAddress(capitalTxid, rec.address);
      if (!tx.found) return Response.json({ ok: false, pending: true, error: 'Capital payment not visible on TN-10 yet — try again in a moment' });
      if (tx.paidSompi < FACTORY_PARAMS.starting_capital_min_kas * SOMPI) {
        return Response.json({ ok: false, error: 'Starting capital is below the minimum' });
      }
      await svc.entities.EvolveAgentWallet.update(rec.id, {
        birth_status: 'SPAWNED', capital_txid: capitalTxid, capital_sompi: tx.paidSompi, status: 'funded',
        last_known_balance_sompi: tx.paidSompi, last_balance_check: new Date().toISOString(),
      });
      return Response.json({ ok: true, address: rec.address, capitalSompi: tx.paidSompi });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[evolveFactory]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}