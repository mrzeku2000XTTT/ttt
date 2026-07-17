import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const KASPA_API = 'https://api.kaspa.org';

// Public projection — never leaks the escrow mnemonic
function publicGig(g) {
  return {
    id: g.id,
    title: g.title,
    task_description: g.task_description,
    requirements: g.requirements,
    amount_kas: g.amount_kas,
    poster_wallet: g.poster_wallet,
    escrow_address: g.escrow_address,
    funding_tx: g.funding_tx,
    worker_wallet: g.worker_wallet,
    proof_url: g.proof_url,
    review_reason: g.review_reason,
    payout_tx: g.payout_tx,
    status: g.status,
    created_date: g.created_date,
  };
}

function normAddr(a) {
  if (!a || typeof a !== 'string') return null;
  const addr = a.trim().startsWith('kaspa:') ? a.trim() : `kaspa:${a.trim()}`;
  return /^kaspa:[a-z0-9]{61,63}$/.test(addr) ? addr : null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { action } = body;
    const Gigs = base44.asServiceRole.entities.SlobzEscrowGig;

    // ── List marketplace gigs (public fields only) ──
    if (action === 'list') {
      const gigs = await Gigs.list('-created_date', 100);
      return Response.json({ gigs: gigs.filter((g) => g.status !== 'awaiting_funding' || body.include_unfunded).map(publicGig) });
    }

    // ── Employer posts a gig → a fresh covenant escrow wallet is created ──
    if (action === 'create') {
      const { title, task_description, requirements, amount_kas, poster_wallet } = body;
      const poster = normAddr(poster_wallet);
      if (!title || !task_description || !poster) {
        return Response.json({ error: 'title, task_description and a valid poster_wallet are required' }, { status: 400 });
      }
      const amount = Number(amount_kas);
      if (!amount || amount < 1 || amount > 10000) {
        return Response.json({ error: 'amount_kas must be between 1 and 10000' }, { status: 400 });
      }

      const walletRes = await base44.asServiceRole.functions.invoke('createKaspaWallet', {});
      const w = walletRes?.data || walletRes;
      if (!w?.address || !w?.mnemonic) {
        return Response.json({ error: 'Failed to create escrow wallet' }, { status: 500 });
      }

      const gig = await Gigs.create({
        title: String(title).slice(0, 120),
        task_description: String(task_description).slice(0, 2000),
        requirements: String(requirements || task_description).slice(0, 2000),
        amount_kas: amount,
        poster_wallet: poster,
        escrow_address: w.address,
        escrow_mnemonic: w.mnemonic,
        status: 'awaiting_funding',
      });

      return Response.json({
        gig_id: gig.id,
        escrow_address: w.address,
        amount_kas: amount,
        message: `Send exactly ${amount} KAS to the escrow address, then verify with the transaction hash to open the gig.`,
      });
    }

    // ── Verify the employer funded the escrow on-chain ──
    if (action === 'verify_funding') {
      const { gig_id, tx_hash } = body;
      if (!gig_id || !tx_hash) return Response.json({ error: 'gig_id and tx_hash required' }, { status: 400 });

      const gig = (await Gigs.filter({ id: gig_id }))[0];
      if (!gig) return Response.json({ error: 'Gig not found' }, { status: 404 });
      if (gig.status !== 'awaiting_funding') return Response.json({ error: 'This gig is not awaiting funding' }, { status: 400 });

      const dupes = await Gigs.filter({ funding_tx: tx_hash });
      if (dupes.length > 0) return Response.json({ error: 'This transaction was already used to fund another gig' }, { status: 400 });

      const txRes = await fetch(`${KASPA_API}/transactions/${tx_hash}`, { signal: AbortSignal.timeout(15000) });
      if (!txRes.ok) return Response.json({ error: 'Transaction not found on the Kaspa network yet — wait a few seconds and try again' }, { status: 400 });
      const tx = await txRes.json();
      const requiredSompi = gig.amount_kas * 1e8;
      const paid = (tx.outputs || []).some((o) =>
        o.script_public_key_address === gig.escrow_address && Number(o.amount) >= requiredSompi
      );
      if (!paid) return Response.json({ error: `Transaction does not pay ${gig.amount_kas} KAS to the escrow address` }, { status: 400 });

      await Gigs.update(gig.id, { funding_tx: tx_hash, status: 'open' });
      return Response.json({ status: 'open', message: 'Escrow funded and verified on-chain. Your gig is live on the marketplace.' });
    }

    // ── Worker claims an open gig ──
    if (action === 'claim') {
      const { gig_id, worker_wallet } = body;
      const worker = normAddr(worker_wallet);
      if (!gig_id || !worker) return Response.json({ error: 'gig_id and a valid worker_wallet required' }, { status: 400 });

      const gig = (await Gigs.filter({ id: gig_id }))[0];
      if (!gig) return Response.json({ error: 'Gig not found' }, { status: 404 });
      if (gig.status !== 'open') return Response.json({ error: 'This gig is not open' }, { status: 400 });
      if (worker === gig.poster_wallet) return Response.json({ error: 'You cannot claim your own gig' }, { status: 400 });

      await Gigs.update(gig.id, { worker_wallet: worker, status: 'claimed' });
      return Response.json({ status: 'claimed', message: 'Gig claimed. Complete the task and submit proof to release the escrow.' });
    }

    // ── Worker submits proof → AI escrow agent checks work → funds release on-chain ──
    if (action === 'submit_proof') {
      const { gig_id, worker_wallet, proof_url, notes } = body;
      const worker = normAddr(worker_wallet);
      if (!gig_id || !worker || !proof_url) {
        return Response.json({ error: 'gig_id, worker_wallet and proof_url required' }, { status: 400 });
      }

      const gig = (await Gigs.filter({ id: gig_id }))[0];
      if (!gig) return Response.json({ error: 'Gig not found' }, { status: 404 });
      if (gig.status !== 'claimed' && gig.status !== 'pending_review') {
        return Response.json({ error: 'This gig is not awaiting proof' }, { status: 400 });
      }
      if (gig.worker_wallet !== worker) return Response.json({ error: 'This gig is claimed by a different wallet' }, { status: 403 });

      const verdict = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are the SLOBZ COVENANT ESCROW AGENT. KAS is locked in escrow for this gig and only releases if the submitted work genuinely meets the requirements.

GIG: "${gig.title}"
TASK: "${gig.task_description}"
ACCEPTANCE CRITERIA: "${gig.requirements}"
WORKER NOTES: "${(notes || '').slice(0, 500)}"

Examine the attached proof file carefully. Decide if it genuinely demonstrates the task was completed per the acceptance criteria. Be fair but strict — real money releases on your verdict. Reject blank images, unrelated screenshots, or obvious fakes.

Return JSON: { "approved": boolean, "confidence": number between 0 and 1, "reason": "one-sentence explanation" }`,
        file_urls: [proof_url],
        response_json_schema: {
          type: 'object',
          properties: {
            approved: { type: 'boolean' },
            confidence: { type: 'number' },
            reason: { type: 'string' },
          },
          required: ['approved', 'confidence'],
        },
      });

      const approved = verdict?.approved === true;
      const confidence = verdict?.confidence ?? 0;
      const reason = verdict?.reason || '';

      if (approved && confidence < 0.7) {
        await Gigs.update(gig.id, { proof_url, proof_notes: (notes || '').slice(0, 500), review_reason: reason, status: 'pending_review' });
        return Response.json({ status: 'pending_review', reason: 'Your proof looks plausible but needs a manual review before the escrow releases.' });
      }

      if (!approved) {
        await Gigs.update(gig.id, { proof_url, proof_notes: (notes || '').slice(0, 500), review_reason: reason, status: 'claimed' });
        return Response.json({ status: 'rejected', reason: reason || 'The proof does not show the task was completed. Fix it and resubmit.' });
      }

      // APPROVED — release escrow on-chain, keeping a small fee buffer
      const payoutKas = Math.max(0.2, Math.round((gig.amount_kas - 0.1) * 100) / 100);
      let sendResult;
      try {
        sendResult = await base44.asServiceRole.functions.invoke('sendKaspaTransaction', {
          mnemonic: gig.escrow_mnemonic,
          fromAddress: gig.escrow_address,
          toAddress: worker,
          amountKas: payoutKas,
        });
      } catch (sendErr) {
        const detail = sendErr?.response?.data?.error || sendErr?.message || String(sendErr);
        await Gigs.update(gig.id, { proof_url, proof_notes: (notes || '').slice(0, 500), review_reason: reason, status: 'pending_review' });
        return Response.json({ status: 'payout_failed', reason: `Work approved but escrow release failed: ${detail}. Try again shortly.` }, { status: 500 });
      }
      const txHash = sendResult?.data?.txId || sendResult?.txId;
      if (!txHash) {
        await Gigs.update(gig.id, { proof_url, proof_notes: (notes || '').slice(0, 500), review_reason: reason, status: 'pending_review' });
        return Response.json({ status: 'payout_failed', reason: 'Work approved but the escrow release transaction failed. Try again shortly.' }, { status: 500 });
      }

      await Gigs.update(gig.id, {
        proof_url,
        proof_notes: (notes || '').slice(0, 500),
        review_reason: reason,
        payout_tx: txHash,
        status: 'paid',
      });

      return Response.json({ status: 'paid', tx_hash: txHash, amount_kas: payoutKas, reason });
    }

    return Response.json({ error: 'Unknown action — use list, create, verify_funding, claim or submit_proof' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});