import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { generateTestnetWallet } from '../../shared/kaspaAddress.ts';
import { FACTORY_PARAMS, FACTORY_AGENT_ID, SOMPI, paidToAddress, unclaimedPayment } from '../../shared/evolveFactory.ts';
import { sendTn10 } from '../../shared/tn10Send.ts';

/**
 * evolveFactory — the AI Factory. After Genesis, no agent appears for free.
 *
 * ONE human signature: the buyer pays the FULL total (generation cost +
 * starting capital) to the Factory in a single TN-10 transaction. The Factory
 * then mints the agent's own wallet and forwards the starting capital into it
 * from its own key — the human never signs a second time.
 *
 * actions:
 *  info   → params, factory address, total, capacity used today, caller's active count, births awaiting funding
 *  birth  → verify the total paid to the factory, mint the agent wallet, forward its capital
 *  fund   → retry ONLY the capital forward for a birth that already paid (no new payment)
 */
export default async function (req) {
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

    const totalKas = FACTORY_PARAMS.generation_cost_kas + FACTORY_PARAMS.starting_capital_min_kas;
    const capitalSompi = BigInt(FACTORY_PARAMS.starting_capital_min_kas * SOMPI);

    const dayStart = new Date(); dayStart.setUTCHours(0, 0, 0, 0);
    const births = await svc.entities.EvolveAgentWallet.filter({ experiment_id: experimentId, origin: 'FACTORY' }, '-created_date', 500);
    const birthsToday = births.filter((b) => new Date(b.created_date) >= dayStart).length;
    const mine = births.filter((b) => b.owner_user_id === user.id && b.status !== 'archived');
    const spentTxids = births.map((b) => b.factory_fee_txid).filter(Boolean);

    if (action === 'info') {
      return Response.json({
        ok: true,
        params: FACTORY_PARAMS,
        factoryAddress: factory.address,
        totalKas,
        birthsToday,
        activeCount: mine.length,
        pending: mine.filter((b) => b.birth_status === 'FEE_PAID')
          .map((b) => ({ agentId: b.agent_id, agentCode: b.agent_code, address: b.address })),
        unclaimedTxid: await unclaimedPayment(factory.address, totalKas * SOMPI, spentTxids),
      });
    }

    /** Forward the starting capital from the Factory wallet into the agent's wallet. */
    const forwardCapital = async (rec) => {
      const key = (await svc.entities.EvolveAgentKey.filter({ agent_id: FACTORY_AGENT_ID }))[0];
      if (!key?.mnemonic) throw new Error('Factory signing key is unavailable');
      const { txId: capitalTxid } = await sendTn10({
        mnemonic: key.mnemonic,
        fromAddress: factory.address,
        toAddress: rec.address,
        amountSompi: capitalSompi,
      });
      await svc.entities.EvolveAgentWallet.update(rec.id, {
        birth_status: 'SPAWNED', capital_txid: capitalTxid, capital_sompi: Number(capitalSompi),
        status: 'funded', last_known_balance_sompi: Number(capitalSompi),
        last_balance_check: new Date().toISOString(),
      });
      return capitalTxid;
    };

    if (action === 'birth') {
      const { agentId, agentCode, txid, senderAddress } = body;
      if (!agentId) return Response.json({ error: 'MISSING_PARAMS: agentId' }, { status: 400 });
      if (mine.length >= FACTORY_PARAMS.max_active_per_human) {
        return Response.json({ ok: false, error: `Active agent limit reached (${FACTORY_PARAMS.max_active_per_human})` });
      }
      if (birthsToday >= FACTORY_PARAMS.daily_capacity) {
        return Response.json({ ok: false, error: 'Factory is at full capacity for today' });
      }

      // A payment may already be at the Factory: an earlier attempt whose
      // confirmation never came back (TN-10's index lags) is claimed here
      // rather than charging the buyer a second time.
      const paidTxid = txid || await unclaimedPayment(factory.address, totalKas * SOMPI, spentTxids);
      if (!paidTxid) {
        return Response.json({ ok: false, error: 'No Factory payment found — nothing to create' });
      }
      const reused = await svc.entities.EvolveAgentWallet.filter({ factory_fee_txid: paidTxid });
      if (reused.length) return Response.json({ ok: false, error: 'This payment was already used for a birth' });

      const tx = await paidToAddress(paidTxid, factory.address);
      if (!tx.found) return Response.json({ ok: false, pending: true, error: 'Payment not visible on TN-10 yet — try again in a moment' });
      const needed = totalKas * SOMPI;
      if (tx.paidSompi < needed) {
        return Response.json({ ok: false, error: `Payment is below the Factory total (${totalKas} tKAS)` });
      }
      if (senderAddress && tx.inputAddresses.length && !tx.inputAddresses.includes(senderAddress)) {
        return Response.json({ ok: false, error: 'Payment was not sent from your connected wallet' });
      }

      const { mnemonic, address } = generateTestnetWallet();
      await svc.entities.EvolveAgentKey.create({
        agent_id: agentId, label: agentCode || agentId, network: 'kaspa_testnet_10',
        address, mnemonic, derivation_path: "m/44'/111111'/0'/0/0",
      });
      const rec = await svc.entities.EvolveAgentWallet.create({
        experiment_id: experimentId, agent_id: agentId, agent_code: agentCode || '',
        wallet_id: `W${Date.now().toString(36).toUpperCase()}`, network: 'kaspa_testnet_10',
        address, status: 'active', owner_user_id: user.id, origin: 'FACTORY',
        birth_status: 'FEE_PAID', factory_fee_txid: paidTxid, created_at: new Date().toISOString(),
      });

      // Forward the capital. If the Factory can't send right now, the birth is
      // already paid — the caller can retry funding without paying again.
      try {
        const capitalTxid = await forwardCapital(rec);
        return Response.json({ ok: true, agentId, address, feeTxid: paidTxid, capitalTxid });
      } catch (e) {
        console.error('[evolveFactory] capital forward failed:', e.message);
        return Response.json({ ok: true, agentId, address, feeTxid: paidTxid, capitalPending: true, error: e.message });
      }
    }

    if (action === 'fund') {
      const { agentId } = body;
      const rec = mine.find((b) => b.agent_id === agentId);
      if (!rec) return Response.json({ ok: false, error: 'No paid birth found for this agent' });
      if (rec.birth_status === 'SPAWNED') return Response.json({ ok: true, address: rec.address, already: true });
      try {
        const capitalTxid = await forwardCapital(rec);
        return Response.json({ ok: true, agentId, address: rec.address, capitalTxid });
      } catch (e) {
        return Response.json({ ok: false, error: e.message });
      }
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[evolveFactory]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}