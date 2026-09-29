import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { generateTestnetWallet } from '../../shared/kaspaAddress.ts';

/**
 * evolveCreateAgentWallet — mints a FRESH Kaspa testnet (TN-10) wallet for an
 * autonomous AI agent. The mnemonic is stored SERVER-SIDE ONLY in EvolveAgentKey
 * (read:false RLS — never returned to the browser). Only the public kaspatest:
 * address leaves this function.
 *
 * The agent can later sign its own transactions autonomously using the stored
 * key via a server-side signer.
 */
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { experimentId, agentId, agentCode, label } = await req.json().catch(() => ({}));
    if (!experimentId || !agentId) {
      return Response.json({ error: 'MISSING_PARAMS: experimentId and agentId required' }, { status: 400 });
    }

    // 1. Generate a fresh testnet wallet (mnemonic + kaspatest: address).
    const { mnemonic, address } = generateTestnetWallet();

    // 2. Store the mnemonic SERVER-SIDE ONLY. read:false RLS means no client
    //    can ever read it back. asServiceRole elevates so the key persists.
    const svc = base44.asServiceRole;
    await svc.entities.EvolveAgentKey.create({
      agent_id: agentId,
      label: label || agentCode || 'EVOLVE agent',
      network: 'kaspa_testnet_10',
      address,
      mnemonic,
      derivation_path: "m/44'/111111'/0'/0/0",
    });

    // 3. Create the public wallet record (cache-only balance, real address).
    const walletRecord = await svc.entities.EvolveAgentWallet.create({
      experiment_id: experimentId,
      agent_id: agentId,
      agent_code: agentCode || '',
      wallet_id: `W${Date.now().toString(36).toUpperCase()}`,
      network: 'kaspa_testnet_10',
      address,
      status: 'active',
      last_known_balance_sompi: 0,
    });

    console.log(`[evolveCreateAgentWallet] ${agentId} → ${address}`);

    return Response.json({
      ok: true,
      address,
      agentId,
      walletId: walletRecord.wallet_id,
      network: 'kaspa_testnet_10',
    });
  } catch (error) {
    console.error('[evolveCreateAgentWallet] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}