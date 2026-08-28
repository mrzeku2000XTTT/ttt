// Submit a paid advertisement for the crypto news ticker.
// Users pay 1 KAS to the ad treasury address, submit their txid + ad content,
// and the ad goes live for 1 hour (fact-checked before activation).
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const AD_TREASURY = Deno.env.get('BRIDGE_WALLET_ADDRESS') || '';
const AD_COST_SOMPI = 100000000; // 1 KAS = 100,000,000 sompi
const KASPA_API = 'https://api.kaspa.org';

async function verifyPayment(txid, treasury) {
  try {
    const apiKey = Deno.env.get('KASPA_API_KEY') || '';
    const headers = { 'X-API-KEY': apiKey };

    let res;
    for (let i = 0; i < 3; i++) {
      try {
        res = await fetch(`${KASPA_API}/transactions/${txid}?resolve_previous_outpoints=light`, { headers });
      } catch (e) {
        if (i < 2) { await new Promise(s => setTimeout(s, 800)); continue; }
        return false;
      }
      if (res.ok || res.status === 404) break;
      if (i < 2) { await new Promise(s => setTimeout(s, 600)); }
    }

    if (!res || !res.ok) return false;

    const tx = await res.json();
    const outputs = tx.outputs || [];

    for (const out of outputs) {
      const amount = out.amount || 0;
      const addr = out.script_public_key_address || out.script_public_key?.address || '';
      if (Number(amount) >= AD_COST_SOMPI) {
        if (!treasury || addr === treasury) return true;
      }
    }
    return false;
  } catch (e) {
    console.error('Payment verification error:', e);
    return false;
  }
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // Info request — frontend calls this to get the treasury address
    if (body.action === 'info') {
      return Response.json({
        treasury_address: AD_TREASURY,
        cost_kas: 1,
        cost_sompi: AD_COST_SOMPI,
        duration_hours: 1,
      });
    }

    const { ad_text, ad_link, advertiser_email, payment_txid, sender_address } = body;

    if (!ad_text || !ad_link || !advertiser_email || !payment_txid) {
      return Response.json({ error: 'Missing required fields: ad_text, ad_link, advertiser_email, payment_txid' }, { status: 400 });
    }

    if (!AD_TREASURY) {
      return Response.json({ error: 'Ad treasury address not configured. Please contact support.' }, { status: 500 });
    }

    // 1. Check for duplicate txid (prevent double-use of one payment)
    const existing = await base44.asServiceRole.entities.KaspaHotTopic.filter(
      { ad_payment_txid: payment_txid },
      '-created_date',
      1
    );
    if (existing.length > 0) {
      return Response.json({ error: 'This payment has already been used for an ad.' }, { status: 400 });
    }

    // 2. Verify the 1 KAS payment on-chain
    const verified = await verifyPayment(payment_txid, AD_TREASURY);
    if (!verified) {
      return Response.json({
        error: 'Payment not verified. Send exactly 1 KAS to the treasury address, then paste the correct transaction ID.',
        treasury_address: AD_TREASURY,
      }, { status: 400 });
    }

    // 3. Fact-check the ad content (reject scams / phishing / misleading claims)
    let factCheckApproved = true;
    let factCheckReason = '';
    try {
      const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are a fact-checker for a crypto news ticker advertisement. Review this ad submission:

Ad text: ${ad_text}
Ad link: ${ad_link}

Check for:
- Is it a scam, phishing, or fraud?
- Is it misleading or making false claims?
- Is it appropriate for a public crypto news feed?
- Does the link look like a valid URL?

Return JSON: { "approved": boolean, "reason": string }`,
        response_json_schema: {
          type: 'object',
          properties: {
            approved: { type: 'boolean' },
            reason: { type: 'string' },
          },
        },
      });
      const fc = typeof res === 'string' ? JSON.parse(res) : res;
      factCheckApproved = fc.approved !== false;
      factCheckReason = fc.reason || '';
    } catch (e) {
      console.error('Fact-check error (fail open):', e);
    }

    if (!factCheckApproved) {
      return Response.json({ error: `Ad rejected: ${factCheckReason}` }, { status: 400 });
    }

    // 4. Create the ad record — active for 1 hour from now
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);

    let host = '';
    try { host = new URL(ad_link).host.replace(/^www\./, ''); } catch { /* keep default */ }

    await base44.asServiceRole.entities.KaspaHotTopic.create({
      author_handle: host || 'sponsored',
      author_name: ad_text.slice(0, 200),
      profile_image_url: '',
      content: ad_text.slice(0, 500),
      tweet_url: ad_link,
      posted_at: now.toISOString(),
      hour_key: '',
      scraped_at: now.toISOString(),
      category: 'advertisement',
      is_advertisement: true,
      advertiser_email,
      ad_payment_txid: payment_txid,
      ad_payment_address: sender_address || '',
      ad_expires_at: expiresAt.toISOString(),
      ad_status: 'active',
    });

    return Response.json({
      success: true,
      message: 'Your ad is now live! It will appear in the news ticker for the next hour.',
      expires_at: expiresAt.toISOString(),
      treasury_address: AD_TREASURY,
    });
  } catch (error) {
    console.error('[submitCryptoAd] error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}