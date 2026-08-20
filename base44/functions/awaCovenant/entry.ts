import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  buildCovenantChain, verifyFundingTx, getCurrentDaa, broadcastTx,
  buildRefundScriptSig, SOMPI_PER_KAS, DEFAULT_FEE_CHECKIN, DEFAULT_FEE_REFUND,
  DEFAULT_PERIOD_BLOCKS, MAX_EPOCHS, p2pkSpk
} from '../../shared/awaCovenant.ts';
import { p2pkScriptFromAddress, bytesToHex } from '../../shared/kaspaTx.ts';

// AWA Covenant Marketing Marketplace — sentinel-x402 covenant on Kaspa L1.
// Flow: quote (draft) -> claim (build covenant chain with worker key) -> deploy
// (marketer funds hop0 P2SH, verified on-chain) -> verify (post liveness) ->
// checkin (worker signs the sentinel-x402 spend, backend broadcasts) -> refund
// (permissionless CLTV refund to marketer).

const FEE_CHECKIN = Number(DEFAULT_FEE_CHECKIN);
const FEE_REFUND = Number(DEFAULT_FEE_REFUND);
const PERIOD_BLOCKS = DEFAULT_PERIOD_BLOCKS;

function kasToSompi(kas) { return BigInt(Math.round(Number(kas) * Number(SOMPI_PER_KAS))); }

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const action = body.action || '';

    // ── quote: LLM-encode a campaign brief into covenant terms, create a draft campaign ──
    if (action === 'quote') {
      const intent = String(body.intent || '').trim().slice(0, 1000);
      if (!intent) return Response.json({ error: 'Describe your campaign first' }, { status: 400 });
      const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are AWA, the Autonomous World of Agents covenant quote engine. A marketer describes a marketing campaign. Parse it into sentinel-x402 covenant terms.\n\nCampaign description: """${intent}"""\n\nReturn JSON with: description (1-2 sentence campaign brief), platform (target social platform, default "x/twitter"), total_kas (total budget in KAS, number 0.1-50), increment_kas (KAS released to the worker per check-in period, number 0.01-5), period_seconds (seconds between verifications, 3600-604800), num_epochs (number of check-in periods, 1-24). Pick sane values. A social post that must stay up is the deliverable.`,
        response_json_schema: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            platform: { type: 'string' },
            total_kas: { type: 'number' },
            increment_kas: { type: 'number' },
            period_seconds: { type: "number" },
            num_epochs: { type: 'number' }
          }
        }
      });
      const terms = typeof llm === 'string' ? JSON.parse(llm) : llm;
      const numEpochs = Math.max(1, Math.min(MAX_EPOCHS, Math.round(Number(terms.num_epochs) || 1)));
      const totalKas = Math.max(0.1, Math.min(50, Number(terms.total_kas) || 1));
      const incrementKas = Math.max(0.01, Math.min(5, Number(terms.increment_kas) || 0.1));
      const periodSeconds = Math.max(3600, Math.min(604800, Number(terms.period_seconds) || 3600));
      const totalSompi = kasToSompi(totalKas);
      let incSompi = kasToSompi(incrementKas);
      let finalEpochs = numEpochs;
      // Auto-fit the budget: shrink epochs (then increment) until the covenant is affordable.
      const fit = (inc, n) => inc * BigInt(n) + BigInt(FEE_CHECKIN) * BigInt(n) + BigInt(FEE_REFUND);
      while (finalEpochs > 1 && fit(incSompi, finalEpochs) > totalSompi) finalEpochs--;
      if (fit(incSompi, finalEpochs) > totalSompi) {
        // increment too big even for 1 epoch — shrink it to fit one period + refund fee
        const maxInc = totalSompi - BigInt(FEE_CHECKIN) - BigInt(FEE_REFUND);
        if (maxInc < BigInt(SOMPI_PER_KAS) / 10n) {
          return Response.json({ error: `Budget ${totalKas} KAS too small (need at least ~${Number(BigInt(FEE_CHECKIN) + BigInt(FEE_REFUND) + 10000000n) / 1e8} KAS for one period)` }, { status: 400 });
        }
        incSompi = maxInc;
      }
      const need = fit(incSompi, finalEpochs);
      const marketerWallet = String(body.marketer_wallet_address || '').trim();
      const campaign = await base44.asServiceRole.entities.AWACampaign.create({
        marketer_email: user.email,
        marketer_wallet_address: marketerWallet,
        description: terms.description || intent.slice(0, 300),
        platform: terms.platform || 'x/twitter',
        total_kas: totalKas,
        increment_kas: Number(incSompi) / Number(SOMPI_PER_KAS),
        period_seconds: periodSeconds,
        num_epochs: finalEpochs,
        status: 'open_for_workers',
        current_hop: 0,
        fees_checkin_sompi: FEE_CHECKIN,
        fees_refund_sompi: FEE_REFUND
      });
      return Response.json({
        campaign_id: campaign.id,
        terms: { description: terms.description, platform: terms.platform, total_kas: totalKas, increment_kas: Number(incSompi) / Number(SOMPI_PER_KAS), period_seconds: periodSeconds, num_epochs: finalEpochs },
        status: 'open_for_workers',
        note: 'Campaign is now open for worker agents to claim. Once a worker claims, the covenant address is generated and you fund it.'
      });
    }

    // ── claim: a worker agent claims an open campaign, then the covenant chain is built ──
    if (action === 'claim') {
      const campaignId = String(body.campaign_id || '');
      if (!campaignId) return Response.json({ error: 'campaign_id required' }, { status: 400 });
      const workerWallet = String(body.worker_wallet_address || '').trim();
      const workerPubKeyHex = String(body.worker_pubkey_hex || '').trim();
      if (!workerWallet || !workerPubKeyHex) return Response.json({ error: 'worker_wallet_address + worker_pubkey_hex (32-byte x-only Schnorr pubkey hex) required' }, { status: 400 });
      if (!/^[0-9a-f]{64}$/.test(workerPubKeyHex)) return Response.json({ error: 'worker_pubkey_hex must be 64 hex chars (32 bytes)' }, { status: 400 });
      const campaign = await base44.asServiceRole.entities.AWACampaign.get(campaignId);
      if (!campaign) return Response.json({ error: 'Campaign not found' }, { status: 404 });
      if (campaign.status !== 'open_for_workers') return Response.json({ error: 'Campaign is not open for workers' }, { status: 400 });
      if (campaign.marketer_email === user.email) return Response.json({ error: 'You cannot claim your own campaign' }, { status: 400 });
      const marketerWallet = String(campaign.marketer_wallet_address || body.marketer_wallet_address || '').trim();
      if (!marketerWallet) return Response.json({ error: 'Marketer refund wallet address required to build the covenant' }, { status: 400 });

      const currentDaa = await getCurrentDaa();
      const periodBlocks = Math.max(PERIOD_BLOCKS, Math.round((Number(campaign.period_seconds) || 3600) / 1));
      const workerSpk = p2pkSpk(workerPubKeyHex);
      const customerSpk = p2pkScriptFromAddress(marketerWallet);
      const hops = buildCovenantChain({
        totalSompi: kasToSompi(campaign.total_kas),
        incrementSompi: kasToSompi(campaign.increment_kas),
        numEpochs: Math.round(Number(campaign.num_epochs) || 1),
        feeCheckin: FEE_CHECKIN, feeRefund: FEE_REFUND,
        workerPubKeyHex, workerSpk, customerSpk: customerSpk,
        currentDaa, periodBlocks
      });
      const redeemScripts = hops.map((h) => h.scriptHex);
      const spks = hops.map((h) => h.spkHex);
      const deadlines = hops.map((h) => h.deadlineDaa);
      const updated = await base44.asServiceRole.entities.AWACampaign.update(campaign.id, {
        worker_email: user.email,
        worker_wallet_address: workerWallet,
        worker_agent_id: String(body.worker_agent_id || ''),
        covenant_address: hops[0].address,
        covenant_redeem_scripts: redeemScripts,
        covenant_spks: spks,
        covenant_deadlines: deadlines,
        cltv_base_daa: currentDaa,
        status: 'awaiting_fund'
      });
      return Response.json({
        campaign_id: campaign.id,
        covenant_address: hops[0].address,
        fund_amount_kas: campaign.total_kas,
        marketer_refund_address: marketerWallet,
        num_epochs: hops.length,
        first_deadline_daa: deadlines[0],
        status: 'awaiting_fund',
        note: `Send exactly ${campaign.total_kas} KAS to the covenant address, then call deploy with the fund tx id.`
      });
    }

    // ── deploy: marketer funds the covenant address, verify on L1, mark active ──
    if (action === 'deploy') {
      const campaignId = String(body.campaign_id || '');
      const fundTxId = String(body.fund_tx_id || '').toLowerCase().replace(/^0x/, '');
      if (!campaignId || !/^[0-9a-f]{64}$/.test(fundTxId)) return Response.json({ error: 'campaign_id + valid 64-hex fund_tx_id required' }, { status: 400 });
      const campaign = await base44.asServiceRole.entities.AWACampaign.get(campaignId);
      if (!campaign) return Response.json({ error: 'Campaign not found' }, { status: 404 });
      if (campaign.status !== 'awaiting_fund') return Response.json({ error: `Campaign is ${campaign.status}, not awaiting funding` }, { status: 400 });
      if (campaign.marketer_email !== user.email && user.role !== 'admin') return Response.json({ error: 'Only the marketer can fund this campaign' }, { status: 403 });
      const expectedSompi = kasToSompi(campaign.total_kas);
      const verify = await verifyFundingTx(fundTxId, campaign.covenant_address, expectedSompi);
      if (!verify.ok) return Response.json({ error: verify.reason }, { status: 402 });
      const marketerSpkHex = bytesToHex(p2pkScriptFromAddress(campaign.marketer_wallet_address));
      await base44.asServiceRole.entities.AWACampaign.update(campaign.id, {
        fund_tx_id: fundTxId,
        status: 'active',
        marketer_spk_hex: marketerSpkHex,
        hop_outpoint_txids: [fundTxId],
        hop_outpoint_indexes: [verify.outputIndex]
      });
      return Response.json({ campaign_id: campaign.id, funded: true, paid_sompi: verify.paidSompi, status: 'active', note: 'Covenant funded on L1. The verify-agent live-tracks the worker post and releases increments each period the post stays up.' });
    }

    // ── campaigns: list the caller's campaigns ──
    if (action === 'campaigns') {
      const list = await base44.asServiceRole.entities.AWACampaign.filter({ marketer_email: user.email }, '-created_date', 50);
      return Response.json({ campaigns: list });
    }

    // ── open_jobs: list campaigns open for workers ──
    if (action === 'open_jobs') {
      const list = await base44.asServiceRole.entities.AWACampaign.filter({ status: 'open_for_workers' }, '-created_date', 50);
      return Response.json({ jobs: list });
    }

    // ── submit_post: worker submits the social post URL they published ──
    if (action === 'submit_post') {
      const campaignId = String(body.campaign_id || '');
      const postUrl = String(body.post_url || '').trim();
      if (!campaignId || !postUrl) return Response.json({ error: 'campaign_id + post_url required' }, { status: 400 });
      const campaign = await base44.asServiceRole.entities.AWACampaign.get(campaignId);
      if (!campaign) return Response.json({ error: 'Campaign not found' }, { status: 404 });
      if (campaign.worker_email !== user.email && campaign.marketer_email !== user.email && user.role !== 'admin') return Response.json({ error: 'Not authorized' }, { status: 403 });
      await base44.asServiceRole.entities.AWACampaign.update(campaign.id, { post_url: postUrl, status: 'checking_in' });
      return Response.json({ campaign_id: campaign.id, post_url: postUrl, status: 'checking_in' });
    }

    // ── verify: server-side liveness check of the post URL ──
    if (action === 'verify') {
      const campaignId = String(body.campaign_id || '');
      if (!campaignId) return Response.json({ error: 'campaign_id required' }, { status: 400 });
      const campaign = await base44.asServiceRole.entities.AWACampaign.get(campaignId);
      if (!campaign) return Response.json({ error: 'Campaign not found' }, { status: 404 });
      if (!campaign.post_url) return Response.json({ error: 'No post_url submitted yet' }, { status: 400 });
      let alive = false; let reason = '';
      try {
        const r = await fetch(campaign.post_url, { redirect: 'follow', headers: { 'User-Agent': 'AWA-Verify-Agent/1.0' } });
        if (r.ok) {
          const html = await r.text();
          const lower = html.toLowerCase();
          const deadMarkers = ['this post has been deleted', 'account suspended', 'page not available', 'sorry, that page does not exist', 'this post is no longer available', 'tweet was deleted'];
          alive = html.length > 200 && !deadMarkers.some((m) => lower.includes(m));
          if (!alive) reason = 'Page returned a deletion/unavailable marker or empty body';
        } else { reason = `HTTP ${r.status}`; }
      } catch (e) { reason = e.message; }
      await base44.asServiceRole.entities.AWACampaign.update(campaign.id, {
        last_verified_at: new Date().toISOString(),
        last_verified_alive: alive
      });
      // Releasing the per-period increment requires the worker to sign the sentinel-x402
      // check-in spend client-side (non-custodial); the checkin action broadcasts that.
      // This verify step records liveness; the scheduled workflow triggers checkin.
      return Response.json({ campaign_id: campaign.id, alive, reason, last_verified_at: new Date().toISOString() });
    }

    // ── checkin: worker provides a signed check-in tx; backend broadcasts it ──
    if (action === 'checkin') {
      const campaignId = String(body.campaign_id || '');
      if (!campaignId) return Response.json({ error: 'campaign_id required' }, { status: 400 });
      const campaign = await base44.asServiceRole.entities.AWACampaign.get(campaignId);
      if (!campaign) return Response.json({ error: 'Campaign not found' }, { status: 404 });
      if (campaign.worker_email !== user.email && user.role !== 'admin') return Response.json({ error: 'Only the worker can check in' }, { status: 403 });
      if (campaign.status !== 'active' && campaign.status !== 'checking_in') return Response.json({ error: 'Campaign not active' }, { status: 400 });
      const hop = Number(campaign.current_hop) || 0;
      if (hop >= (campaign.covenant_redeem_scripts || []).length) return Response.json({ error: 'All epochs released' }, { status: 400 });
      const txObj = body.transaction;
      if (!txObj) return Response.json({ error: 'transaction object required (worker-built + signed check-in spend)' }, { status: 400 });
      const res = await broadcastTx(txObj);
      if (!res.ok) return Response.json({ error: `Broadcast failed: ${res.reason}` }, { status: 400 });
      const newCheckins = [...(campaign.check_in_tx_ids || []), res.txId];
      const nextHop = hop + 1;
      const allReleased = nextHop >= (campaign.covenant_redeem_scripts || []).length;
      // record the next hop's outpoint: the check-in relocks remainder to output1
      const hopTxids = [...(campaign.hop_outpoint_txids || [campaign.fund_tx_id])];
      const hopIdxs = [...(campaign.hop_outpoint_indexes || [])];
      if (hopTxids.length <= nextHop) { hopTxids.push(res.txId); hopIdxs.push(1); }
      await base44.asServiceRole.entities.AWACampaign.update(campaign.id, {
        check_in_tx_ids: newCheckins,
        current_hop: nextHop,
        hop_outpoint_txids: hopTxids,
        hop_outpoint_indexes: hopIdxs,
        status: allReleased ? 'completed' : campaign.status
      });
      return Response.json({ campaign_id: campaign.id, tx_id: res.txId, hop: nextHop, completed: allReleased });
    }

    // ── refund: after CLTV expiry, broadcast the permissionless refund to the marketer ──
    if (action === 'refund') {
      const campaignId = String(body.campaign_id || '');
      if (!campaignId) return Response.json({ error: 'campaign_id required' }, { status: 400 });
      const campaign = await base44.asServiceRole.entities.AWACampaign.get(campaignId);
      if (!campaign) return Response.json({ error: 'Campaign not found' }, { status: 404 });
      if (campaign.status === 'refunded') return Response.json({ error: 'Already refunded', refund_tx_id: campaign.refund_tx_id }, { status: 400 });
      if (!campaign.covenant_address || !campaign.fund_tx_id) return Response.json({ error: 'Campaign not funded' }, { status: 400 });
      const currentDaa = await getCurrentDaa();
      const hop = Number(campaign.current_hop) || 0;
      const deadlines = campaign.covenant_deadlines || [];
      if (hop >= deadlines.length) return Response.json({ error: 'No refundable hop' }, { status: 400 });
      if (currentDaa < deadlines[hop]) return Response.json({ error: `CLTV not yet elapsed (current ${currentDaa} < deadline ${deadlines[hop]})`, current_daa: currentDaa, deadline_daa: deadlines[hop] }, { status: 402 });
      const marketerSpk = campaign.marketer_spk_hex || bytesToHex(p2pkScriptFromAddress(campaign.marketer_wallet_address));
      const hopTxids = campaign.hop_outpoint_txids || [campaign.fund_tx_id];
      const hopIdxs = campaign.hop_outpoint_indexes || [];
      const hopOutpointTxid = hopTxids[hop] || (hop === 0 ? campaign.fund_tx_id : (campaign.check_in_tx_ids || [])[hop - 1]);
      const hopOutpointIndex = hopIdxs[hop] != null ? hopIdxs[hop] : (hop === 0 ? 0 : 1);
      const remaining = kasToSompi(campaign.total_kas) - BigInt(FEE_CHECKIN) * BigInt(hop) - kasToSompi(campaign.increment_kas) * BigInt(hop);
      const refundTotal = remaining - BigInt(FEE_REFUND);
      const refundAVal = refundTotal / 2n;
      const refundBVal = refundTotal - refundAVal;
      const scriptSig = buildRefundScriptSig(campaign.covenant_redeem_scripts[hop]);
      const txObj = {
        version: 1,
        inputs: [{ previousOutpoint: { transactionId: hopOutpointTxid, index: hopOutpointIndex }, signatureScript: scriptSig, sequence: 0, sigOpCount: 1, computeBudget: 2500 }],
        outputs: [
          { value: Number(refundAVal), scriptPublicKey: { script: marketerSpk, version: 0 } },
          { value: Number(refundBVal), scriptPublicKey: { script: marketerSpk, version: 0 } }
        ],
        lockTime: deadlines[hop],
        subnetworkId: '0000000000000000000000000000000000000000', gas: 0, payload: ''
      };
      const res = await broadcastTx(txObj);
      if (!res.ok) return Response.json({ error: `Refund broadcast failed: ${res.reason}`, current_daa: currentDaa, deadline_daa: deadlines[hop] }, { status: 400 });
      await base44.asServiceRole.entities.AWACampaign.update(campaign.id, { refund_tx_id: res.txId, status: 'refunded' });
      return Response.json({ campaign_id: campaign.id, refund_tx_id: res.txId, refunded_sompi: refundTotal.toString(), status: 'refunded' });
    }

    // ── sweep: scheduled maintenance — verify liveness + refund expired covenants ──
    if (action === 'sweep') {
      // Allow workflow (no user) or admin; block other users from direct calls.
      if (user && user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });
      const active = await base44.asServiceRole.entities.AWACampaign.filter({ status: 'checking_in' }, '-created_date', 100);
      const checking = await base44.asServiceRole.entities.AWACampaign.filter({ status: 'active' }, '-created_date', 100);
      const all = [...active, ...checking];
      const currentDaa = await getCurrentDaa();
      const results = { verified: 0, alive: 0, dead: 0, refunded: 0, refundFailed: 0 };
      for (const c of all) {
        if (!c.post_url) continue;
        let alive = false;
        try {
          const r = await fetch(c.post_url, { redirect: 'follow', headers: { 'User-Agent': 'AWA-Verify-Agent/1.0' } });
          if (r.ok) {
            const html = await r.text();
            const lower = html.toLowerCase();
            const deadMarkers = ['this post has been deleted', 'account suspended', 'page not available', 'sorry, that page does not exist', 'this post is no longer available', 'tweet was deleted'];
            alive = html.length > 200 && !deadMarkers.some((m) => lower.includes(m));
          }
        } catch {}
        results.verified++; alive ? results.alive++ : results.dead++;
        await base44.asServiceRole.entities.AWACampaign.update(c.id, { last_verified_at: new Date().toISOString(), last_verified_alive: alive });
        // Attempt permissionless refund when the current hop's CLTV has elapsed.
        const hop = Number(c.current_hop) || 0;
        const deadlines = c.covenant_deadlines || [];
        if (c.status !== 'refunded' && hop < deadlines.length && currentDaa >= deadlines[hop] && c.fund_tx_id) {
          const marketerSpk = c.marketer_spk_hex || bytesToHex(p2pkScriptFromAddress(c.marketer_wallet_address));
          const hopTxids = c.hop_outpoint_txids || [c.fund_tx_id];
          const hopIdxs = c.hop_outpoint_indexes || [];
          const hopOutpointTxid = hopTxids[hop] || (hop === 0 ? c.fund_tx_id : (c.check_in_tx_ids || [])[hop - 1]);
          const hopOutpointIndex = hopIdxs[hop] != null ? hopIdxs[hop] : (hop === 0 ? 0 : 1);
          const remaining = kasToSompi(c.total_kas) - BigInt(FEE_CHECKIN) * BigInt(hop) - kasToSompi(c.increment_kas) * BigInt(hop);
          const refundTotal = remaining - BigInt(FEE_REFUND);
          if (refundTotal > 0n) {
            const refundAVal = refundTotal / 2n;
            const refundBVal = refundTotal - refundAVal;
            const scriptSig = buildRefundScriptSig(c.covenant_redeem_scripts[hop]);
            const txObj = {
              version: 1,
              inputs: [{ previousOutpoint: { transactionId: hopOutpointTxid, index: hopOutpointIndex }, signatureScript: scriptSig, sequence: 0, sigOpCount: 1, computeBudget: 2500 }],
              outputs: [
                { value: Number(refundAVal), scriptPublicKey: { script: marketerSpk, version: 0 } },
                { value: Number(refundBVal), scriptPublicKey: { script: marketerSpk, version: 0 } }
              ],
              lockTime: deadlines[hop],
              subnetworkId: '0000000000000000000000000000000000000000', gas: 0, payload: ''
            };
            const res = await broadcastTx(txObj);
            if (res.ok) { await base44.asServiceRole.entities.AWACampaign.update(c.id, { refund_tx_id: res.txId, status: 'refunded' }); results.refunded++; }
            else { results.refundFailed++; }
          }
        }
      }
      return Response.json({ sweep: results, current_daa: currentDaa, processed: all.length });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}