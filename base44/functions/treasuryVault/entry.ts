// TREASURY — covenant-guarded community KCC-20 vault, integrated into BIBLIA.
// Actions:
//   status (public):  active vault address + KAS balance + covenant guard terms
//   init (admin):     generate the vault wallet once via the existing
//                     createKaspaWallet function, store it (service role)
//   covenant_lock (admin): build the sentinel-x402 covenant chain guarding the
//                     vault's KAS — same builder as AWA (shared/awaCovenant.ts),
//                     worker key = vault pubkey, refunds flow back to the vault.
//   claim_reward (public): donors receive a small KAS blessing from the vault —
//                     requires a prior TreasuryTip, once per wallet per day,
//                     paid server-side with the vault key via sendKaspaTransaction.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import {
  buildCovenantChain, p2pkSpk, getCurrentDaa,
  DEFAULT_FEE_CHECKIN, DEFAULT_FEE_REFUND, DEFAULT_PERIOD_BLOCKS, MAX_EPOCHS, SOMPI_PER_KAS
} from '../../shared/awaCovenant.ts';
import { p2pkScriptFromAddress, decodeAnyKaspaAddress, bytesToHex } from '../../shared/kaspaTx.ts';

const FEE_CHECKIN = Number(DEFAULT_FEE_CHECKIN);
const FEE_REFUND = Number(DEFAULT_FEE_REFUND);
const kasToSompi = (kas) => BigInt(Math.round(Number(kas) * Number(SOMPI_PER_KAS)));

// functions.invoke responses may arrive as { data } (axios shape) or raw — normalize
const payload = (r) => (r && typeof r === 'object' && 'data' in r ? r.data : r);

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || 'status');

    const getActiveVault = async () => {
      const list = await base44.asServiceRole.entities.TreasuryVault.filter({ is_active: true }, '-created_date', 5);
      return list[0] || null;
    };

    // ── status: public — vault address + covenant terms, never the seed ──
    if (action === 'status') {
      const vault = await getActiveVault();
      if (!vault) return Response.json({ address: null, balance_kas: null, covenant: null });
      let balanceKas = null;
      try {
        const r = await fetch(`https://api.kaspa.org/addresses/${vault.kaspa_address}`);
        if (r.ok) { const j = await r.json(); balanceKas = Number(j.balance) / 1e8; }
      } catch {}
      const hasCovenant = !!vault.covenant_address;
      return Response.json({
        address: vault.kaspa_address,
        balance_kas: balanceKas,
        covenant: hasCovenant ? {
          address: vault.covenant_address,
          status: vault.covenant_status,
          total_kas: vault.covenant_total_kas,
          increment_kas: vault.covenant_increment_kas,
          epochs: vault.covenant_epochs,
          period_seconds: vault.covenant_period_seconds,
          first_deadline_daa: (vault.covenant_deadlines || [])[0] || null
        } : null
      });
    }

    // ── init: admin — generate the vault wallet once via createKaspaWallet ──
    if (action === 'init') {
      const user = await base44.auth.me();
      if (user?.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });
      const existing = await getActiveVault();
      if (existing) return Response.json({ success: true, address: existing.kaspa_address, exists: true });
      const wallet = payload(await base44.functions.invoke('createKaspaWallet', { wordCount: 24 }));
      if (!wallet?.address || !wallet?.mnemonic) {
        return Response.json({ error: wallet?.error || 'Wallet generation failed' }, { status: 500 });
      }
      await base44.asServiceRole.entities.TreasuryVault.create({
        kaspa_address: wallet.address,
        seed_phrase: wallet.mnemonic,
        is_active: true,
        covenant_status: 'none'
      });
      return Response.json({ success: true, address: wallet.address, created: true });
    }

    // ── covenant_lock: admin — build the sentinel-x402 guard chain over the vault ──
    if (action === 'covenant_lock') {
      const user = await base44.auth.me();
      if (user?.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });
      const vault = await getActiveVault();
      if (!vault) return Response.json({ error: 'Initialize the vault first' }, { status: 400 });
      const totalKas = Number(body.total_kas) || 0;
      const incrementKas = Number(body.increment_kas) || 0;
      const numEpochs = Math.max(1, Math.min(MAX_EPOCHS, Math.round(Number(body.num_epochs) || 1)));
      const periodSeconds = Math.max(3600, Math.min(604800, Number(body.period_seconds) || 86400));
      if (totalKas <= 0 || incrementKas <= 0) {
        return Response.json({ error: 'total_kas and increment_kas must be positive' }, { status: 400 });
      }
      const inc = kasToSompi(incrementKas);
      if (inc * BigInt(numEpochs) + BigInt(FEE_CHECKIN) * BigInt(numEpochs) + BigInt(FEE_REFUND) > kasToSompi(totalKas)) {
        return Response.json({ error: 'total_kas too small for increments + fees — raise the total or lower the increment/epochs' }, { status: 400 });
      }

      // The vault's x-only pubkey is embedded in its P2PK address payload.
      const workerPubKeyHex = bytesToHex(decodeAnyKaspaAddress(vault.kaspa_address).slice(1));

      const currentDaa = await getCurrentDaa();
      const periodBlocks = Math.max(DEFAULT_PERIOD_BLOCKS, Math.round(periodSeconds));
      const hops = buildCovenantChain({
        totalSompi: kasToSompi(totalKas),
        incrementSompi: inc,
        numEpochs,
        feeCheckin: FEE_CHECKIN,
        feeRefund: FEE_REFUND,
        workerPubKeyHex,
        workerSpk: p2pkSpk(workerPubKeyHex),
        customerSpk: p2pkScriptFromAddress(vault.kaspa_address), // refunds flow back to the vault itself
        currentDaa,
        periodBlocks
      });
      await base44.asServiceRole.entities.TreasuryVault.update(vault.id, {
        covenant_address: hops[0].address,
        covenant_redeem_scripts: hops.map((h) => h.scriptHex),
        covenant_deadlines: hops.map((h) => h.deadlineDaa),
        covenant_total_kas: totalKas,
        covenant_increment_kas: incrementKas,
        covenant_epochs: numEpochs,
        covenant_period_seconds: periodSeconds,
        covenant_cltv_base_daa: currentDaa,
        covenant_status: 'locked'
      });
      return Response.json({
        success: true,
        covenant_address: hops[0].address,
        epochs: hops.length,
        first_deadline_daa: hops[0].deadlineDaa,
        note: `Send ${totalKas} KAS to the covenant address to arm the guard. It releases ${incrementKas} KAS per period (${periodSeconds}s epochs) and refunds the remainder to the vault after timeout — permissionless.`
      });
    }

    // ── claim_reward: public — donors receive a small KAS blessing from the vault.
    // Eligibility: at least one TreasuryTip from this wallet. Rate limit: one
    // blessing per wallet per day. The payout is signed with the vault seed
    // server-side via the shared sendKaspaTransaction function.
    if (action === 'claim_reward') {
      // admin-only while BIBLIA is in testing — reopen to donors when it ships
      const caller = await base44.auth.me();
      if (caller?.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });
      const wallet = String(body.wallet || '').replace(/^kaspa:/, '').trim();
      if (!wallet) return Response.json({ error: 'Connect your Scorpion wallet first' }, { status: 400 });
      const vault = await getActiveVault();
      if (!vault) return Response.json({ error: 'The treasury is still being prepared' }, { status: 400 });

      // give first — the blessing follows a gift
      const tips = await base44.asServiceRole.entities.TreasuryTip.filter({ sender_wallet: wallet }, '-created_date', 50);
      if (tips.length === 0) return Response.json({ error: 'Give first — the blessing follows a gift' }, { status: 400 });

      // one blessing per wallet per day
      const DAY_MS = 24 * 60 * 60 * 1000;
      const claims = await base44.asServiceRole.entities.TreasuryRewardClaim.filter({ wallet }, '-created_date', 20);
      const recent = claims.find((c) => Date.now() - new Date(c.created_date).getTime() < DAY_MS);
      if (recent) {
        return Response.json({
          error: 'A blessing was already received today — return tomorrow',
          next_at: new Date(new Date(recent.created_date).getTime() + DAY_MS).toISOString()
        }, { status: 429 });
      }

      // only pay while the vault can afford reward + fees
      const REWARD_KAS = 0.05;
      let balanceSompi = null;
      try {
        const r = await fetch(`https://api.kaspa.org/addresses/${vault.kaspa_address}`);
        if (r.ok) balanceSompi = Number((await r.json()).balance);
      } catch {}
      if (balanceSompi == null || balanceSompi < Math.round((REWARD_KAS + 0.001) * 1e8)) {
        return Response.json({ error: 'The treasury is resting right now — blessings return soon' }, { status: 400 });
      }

      // pay from the vault wallet — the seed never leaves the server
      const payout = payload(await base44.functions.invoke('sendKaspaTransaction', {
        mnemonic: vault.seed_phrase,
        fromAddress: vault.kaspa_address,
        toAddress: wallet,
        amountKas: REWARD_KAS,
      }));
      const txId = payout?.txId || payout?.data?.txId || null;
      if (!txId) return Response.json({ error: payout?.error || payout?.data?.error || 'The payout could not be sent' }, { status: 500 });

      await base44.asServiceRole.entities.TreasuryRewardClaim.create({
        wallet,
        kas_amount: REWARD_KAS,
        tx_hash: txId
      });
      return Response.json({ success: true, kas_amount: REWARD_KAS, tx_hash: txId });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}