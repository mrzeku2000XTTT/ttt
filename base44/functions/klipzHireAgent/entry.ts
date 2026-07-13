import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const KLIPZ_ADDRESS = 'kaspa:qq5yhvly6338dspa9mm24g8q6chvy6v0jww3k4dgqywh0lju5mmm5pj334ews';
const PRICE_KAS = 1;

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { txHash, wallet, video, clips } = body;

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    if (!txHash || !video?.id || !Array.isArray(clips) || clips.length === 0) {
      return Response.json({ error: 'Missing txHash, video or clips' }, { status: 400 });
    }

    // Prevent tx reuse
    const existing = await base44.asServiceRole.entities.KlipzJob.filter({ tx_hash: txHash });
    if (existing.length > 0) {
      return Response.json({ error: 'This payment transaction was already used' }, { status: 409 });
    }

    // Verify the payment on-chain (retry while tx propagates)
    let tx = null;
    for (let i = 0; i < 8; i++) {
      const r = await fetch(`https://api.kaspa.org/transactions/${txHash}?inputs=false&outputs=true`);
      if (r.ok) { tx = await r.json(); break; }
      await new Promise((res) => setTimeout(res, 3000));
    }
    if (!tx) return Response.json({ error: 'Payment transaction not found on-chain yet — try again in a moment' }, { status: 402 });

    const paidOutput = (tx.outputs || []).find(
      (o) => o.script_public_key_address === KLIPZ_ADDRESS && (o.amount / 100000000) >= PRICE_KAS * 0.95
    );
    if (!paidOutput) {
      return Response.json({ error: `Payment of ${PRICE_KAS} KAS to the KLIPZ agent address not found in this transaction` }, { status: 402 });
    }

    // Deliver: save every clip to the user's library
    const records = clips.slice(0, 12).map((c) => ({
      user_email: user.email,
      wallet_address: wallet || '',
      tx_hash: txHash,
      video_id: video.id,
      video_title: video.title || '',
      video_thumbnail: video.thumbnail || '',
      clip_title: c.title || 'Untitled clip',
      reason: c.reason || '',
      start_s: Math.max(0, Math.floor(c.start_s || 0)),
      end_s: Math.floor(c.end_s || 0),
      score: c.score || 0,
      amount_kas: PRICE_KAS,
      status: 'delivered'
    }));

    const jobs = await base44.asServiceRole.entities.KlipzJob.bulkCreate(records);

    return Response.json({
      success: true,
      verified_amount: paidOutput.amount / 100000000,
      jobs
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});