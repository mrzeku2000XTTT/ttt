import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { SOMPI, paidToAddress } from '../../shared/evolveFactory.ts';

/**
 * evolveAgentMarket — player-to-player resale of AI agents, settled in real
 * TN-10 tKAS.
 *
 * Ownership is decided by EvolveAgentWallet.owner_user_id, a field only the
 * service role writes: a client cannot hand an agent to itself by editing its
 * own records. The buyer pays the seller's own kaspatest: address directly and
 * the agent moves ONLY after the chain confirms that exact payment.
 *
 * actions:
 *  info    → open listings, my listings, my purchases awaiting verification
 *  list    → put one of MY agents up for sale (owner-only)
 *  cancel  → withdraw an OPEN listing (never one a buyer has reserved)
 *  reserve → lock a listing to me, return the seller's payout address
 *  claim   → verify my TN-10 payment to the seller, then transfer ownership
 */
const RESERVE_MINUTES = 60;
const MIN_PRICE_KAS = 1;
const MAX_PRICE_KAS = 100000;

const lower = (v) => String(v || '').toLowerCase();

const publicListing = (l) => ({
  id: l.id,
  agentId: l.agent_id,
  agentCode: l.agent_code || '',
  agentName: l.agent_name || '',
  sellerCode: l.seller_code || '',
  sellerUserId: l.seller_user_id,
  priceKas: Number(l.price_sompi || 0) / SOMPI,
  status: l.status,
  buyerUserId: l.buyer_user_id || '',
  reservedAt: l.reserved_at || '',
  paymentTxid: l.payment_txid || '',
});

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const { action, experimentId } = body;
    if (!experimentId) return Response.json({ error: 'MISSING_PARAMS: experimentId' }, { status: 400 });

    const listings = await svc.entities.EvolveAgentListing.filter({ experiment_id: experimentId }, '-created_date', 300);

    /** Ownership of an agent, read from the ledger a client cannot write. */
    const ownerOf = async (agentId) => {
      const wallets = await svc.entities.EvolveAgentWallet.filter({ experiment_id: experimentId, agent_id: agentId });
      return wallets[0] || null;
    };

    // A reservation nobody paid for is released. One a payment is pinned to
    // stays with its buyer until they claim it — their money is already out.
    for (const l of listings) {
      if (l.status !== 'RESERVED' || l.payment_txid) continue;
      const age = Date.now() - new Date(l.reserved_at || l.updated_date || 0).getTime();
      if (age > RESERVE_MINUTES * 60000) {
        await svc.entities.EvolveAgentListing.update(l.id, {
          status: 'OPEN', buyer_user_id: '', buyer_code: '', reserved_at: '',
        });
        l.status = 'OPEN';
        l.buyer_user_id = '';
      }
    }

    if (action === 'info') {
      return Response.json({
        ok: true,
        reserveMinutes: RESERVE_MINUTES,
        limits: { minKas: MIN_PRICE_KAS, maxKas: MAX_PRICE_KAS },
        listings: listings.filter((l) => l.status === 'OPEN' && l.seller_user_id !== user.id).map(publicListing),
        mine: listings.filter((l) => l.seller_user_id === user.id && l.status !== 'SOLD').map(publicListing),
        buying: listings.filter((l) => l.buyer_user_id === user.id && l.status === 'RESERVED').map(publicListing),
      });
    }

    if (action === 'list') {
      const { agentId, agentCode, agentName, priceKas, payoutAddress, sellerCode } = body;
      if (!agentId) return Response.json({ ok: false, error: 'MISSING_PARAMS: agentId' });

      const price = Math.round(Number(priceKas) * SOMPI);
      if (!Number.isFinite(price) || price < MIN_PRICE_KAS * SOMPI || price > MAX_PRICE_KAS * SOMPI) {
        return Response.json({ ok: false, error: `Price must be between ${MIN_PRICE_KAS} and ${MAX_PRICE_KAS} tKAS` });
      }
      const payout = String(payoutAddress || '').trim();
      if (!payout.startsWith('kaspatest:') || payout.length < 20) {
        return Response.json({ ok: false, error: 'A kaspatest: payout address is required — buyers pay it directly' });
      }

      const wallet = await ownerOf(agentId);
      if (!wallet || wallet.owner_user_id !== user.id) {
        return Response.json({ ok: false, error: 'Only the owner of an agent can sell it' });
      }
      if (listings.some((l) => l.agent_id === agentId && (l.status === 'OPEN' || l.status === 'RESERVED'))) {
        return Response.json({ ok: false, error: 'This agent is already listed' });
      }

      const rec = await svc.entities.EvolveAgentListing.create({
        experiment_id: experimentId,
        listing_key: `LST_${String(listings.length + 1).padStart(4, '0')}_${Date.now().toString(36).toUpperCase()}`,
        agent_id: agentId,
        agent_code: agentCode || wallet.agent_code || '',
        agent_name: agentName || '',
        seller_user_id: user.id,
        seller_code: sellerCode || '',
        seller_address: payout,
        price_sompi: price,
        status: 'OPEN',
      });
      return Response.json({ ok: true, listing: publicListing(rec) });
    }

    if (action === 'cancel') {
      const l = listings.find((x) => x.id === body.listingId);
      if (!l) return Response.json({ ok: false, error: 'Listing not found' });
      if (l.seller_user_id !== user.id) return Response.json({ ok: false, error: 'Not your listing' });
      if (l.status === 'RESERVED') {
        return Response.json({ ok: false, error: 'A buyer has reserved this agent — it can no longer be withdrawn' });
      }
      if (l.status === 'SOLD') return Response.json({ ok: false, error: 'This agent is already sold' });
      await svc.entities.EvolveAgentListing.update(l.id, { status: 'CANCELLED' });
      return Response.json({ ok: true });
    }

    if (action === 'reserve') {
      const l = listings.find((x) => x.id === body.listingId);
      if (!l) return Response.json({ ok: false, error: 'Listing not found' });
      if (l.status !== 'OPEN') return Response.json({ ok: false, error: 'This agent is no longer available' });
      if (l.seller_user_id === user.id) return Response.json({ ok: false, error: 'You already own this agent' });

      const wallet = await ownerOf(l.agent_id);
      if (!wallet || wallet.owner_user_id !== l.seller_user_id) {
        return Response.json({ ok: false, error: 'The seller no longer owns this agent' });
      }

      await svc.entities.EvolveAgentListing.update(l.id, {
        status: 'RESERVED', buyer_user_id: user.id, buyer_code: body.buyerCode || '',
        reserved_at: new Date().toISOString(),
      });
      return Response.json({
        ok: true, listingId: l.id, agentCode: l.agent_code || '',
        priceKas: Number(l.price_sompi) / SOMPI, sellerAddress: l.seller_address,
      });
    }

    if (action === 'claim') {
      const { listingId, txid, senderAddress } = body;
      const l = listings.find((x) => x.id === listingId);
      if (!l) return Response.json({ ok: false, error: 'Listing not found' });
      if (l.status === 'SOLD') {
        return Response.json({ ok: true, already: true, agentId: l.agent_id, agentCode: l.agent_code || '' });
      }
      if (l.status !== 'RESERVED' || l.buyer_user_id !== user.id) {
        return Response.json({ ok: false, error: 'This agent is not reserved to you' });
      }
      if (!txid) return Response.json({ ok: false, error: 'MISSING_PARAMS: txid' });

      // One payment buys one agent.
      const used = listings.find((x) => x.payment_txid && lower(x.payment_txid) === lower(txid) && x.id !== l.id);
      if (used) return Response.json({ ok: false, error: 'This payment was already used for another purchase' });

      const tx = await paidToAddress(txid, l.seller_address);
      if (!tx.found) {
        // Pin the listing to this buyer so a paid purchase can never be stranded.
        await svc.entities.EvolveAgentListing.update(l.id, { payment_txid: txid });
        return Response.json({ ok: false, pending: true, error: 'Payment not visible on TN-10 yet — try again in a moment' });
      }
      if (tx.paidSompi < l.price_sompi) {
        return Response.json({ ok: false, error: 'Payment is below the asking price' });
      }
      if (senderAddress && tx.inputAddresses.length && !tx.inputAddresses.includes(senderAddress)) {
        return Response.json({ ok: false, error: 'Payment was not sent from your connected wallet' });
      }

      const wallet = await ownerOf(l.agent_id);
      if (!wallet || wallet.owner_user_id !== l.seller_user_id) {
        return Response.json({ ok: false, error: 'The seller no longer owns this agent' });
      }

      // Ownership moves server-side, in the ledger the client cannot edit.
      await svc.entities.EvolveAgentWallet.update(wallet.id, {
        owner_user_id: user.id,
        status: wallet.status === 'depleted' ? 'active' : wallet.status,
      });
      const agents = await svc.entities.EvolveAgent.filter({ experiment_id: experimentId, agent_key: l.agent_id });
      if (agents[0]) await svc.entities.EvolveAgent.update(agents[0].id, { owner_user_id: user.id });
      await svc.entities.EvolveAgentListing.update(l.id, {
        status: 'SOLD', payment_txid: txid, sold_at: new Date().toISOString(),
      });

      return Response.json({
        ok: true, agentId: l.agent_id, agentCode: l.agent_code || '',
        address: wallet.address, sellerCode: l.seller_code || '',
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[evolveAgentMarket]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}