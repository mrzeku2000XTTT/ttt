import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// KCC — Kaspa Covenant Collectibles. NFTs whose rules are ENFORCED on Kaspa L1:
// each NFT is a covenant++ P2SH UTXO deployed via the SuperZK deploy agent.
// The covenant script IS the rule (soulbound timelock, gated transfer, escrow
// sale, vault, post-quantum lock, sentinel) — no indexer trust like KRC-721.
const COVENANT_TYPES = ["zktimelock", "zkescrow", "zkvault", "zkgate", "xmsslock", "sentinel"];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Login required" }, { status: 401 });

    const { action, nft_id, name, description, image_url, covenant_type, deposit_kas, rule_params = {}, payout_address } = await req.json();

    if (action === "mint") {
      if (!name) return Response.json({ error: "Missing NFT name" }, { status: 400 });
      if (!COVENANT_TYPES.includes(covenant_type)) {
        return Response.json({ error: `covenant_type must be one of: ${COVENANT_TYPES.join(", ")}` }, { status: 400 });
      }
      const deposit = Number(deposit_kas);
      if (!deposit || deposit <= 0) return Response.json({ error: "deposit_kas must be a positive number" }, { status: 400 });

      // File the REAL covenant deploy job with the SuperZK agent
      const job = await base44.functions.invoke("superzkDeployJob", {
        action: "deploy", covenant_type, deposit_kas: deposit,
        params: { ...rule_params, kcc_nft: name },
      });
      const j = job.data;
      if (j.error) return Response.json({ error: j.error }, { status: 502 });

      const nft = await base44.asServiceRole.entities.KCCNft.create({
        name, description: description || "", image_url: image_url || "",
        covenant_type, rule_params, deposit_kas: deposit,
        owner_email: user.email,
        conversation_id: j.conversation_id, payment_address: j.payment_address,
        status: "pending_payment",
      });
      return Response.json({ nft, next_step: j.next_step });
    }

    if (action === "check") {
      if (!nft_id) return Response.json({ error: "Missing nft_id" }, { status: 400 });
      const nft = (await base44.asServiceRole.entities.KCCNft.filter({ id: nft_id }))[0];
      if (!nft) return Response.json({ error: "NFT not found" }, { status: 404 });

      const res = await base44.functions.invoke("superzkDeployJob", {
        action: "check", conversation_id: nft.conversation_id,
      });
      const update = res.data.latest_update || "";

      // Parse the agent's report for the deployed covenant details
      const addrMatch = update.match(/kaspa:[a-z0-9]{61,63}/);
      const txMatch = update.match(/\b[0-9a-f]{64}\b/);
      const daaMatch = update.match(/unlock_daa[^0-9]*(\d{6,})/i);
      const patch = {};
      if (nft.status === "pending_payment" && addrMatch) {
        patch.covenant_address = addrMatch[0];
        patch.status = "minted";
        if (txMatch) patch.tx_id = txMatch[0];
        if (daaMatch) patch.unlock_daa = daaMatch[1];
        const scriptMatch = update.match(/redeem_script(?:_hex)?[^0-9a-f]*([0-9a-f]{20,})/i);
        if (scriptMatch) patch.redeem_script_hex = scriptMatch[1];
      }
      if (Object.keys(patch).length > 0) {
        await base44.asServiceRole.entities.KCCNft.update(nft.id, patch);
      }
      return Response.json({ nft_id: nft.id, status: patch.status || nft.status, latest_update: update, ...patch });
    }

    if (action === "redeem") {
      if (!nft_id) return Response.json({ error: "Missing nft_id" }, { status: 400 });
      if (!payout_address || !payout_address.startsWith("kaspa:")) {
        return Response.json({ error: "payout_address must be a kaspa: address" }, { status: 400 });
      }
      const nft = (await base44.asServiceRole.entities.KCCNft.filter({ id: nft_id }))[0];
      if (!nft) return Response.json({ error: "NFT not found" }, { status: 404 });
      if (nft.owner_email !== user.email && user.role !== "admin") {
        return Response.json({ error: "Only the NFT owner can redeem it" }, { status: 403 });
      }
      if (nft.status !== "minted") return Response.json({ error: `NFT is ${nft.status} — only minted NFTs can be redeemed` }, { status: 400 });

      const res = await base44.functions.invoke("superzkDeployJob", {
        action: "redeem", conversation_id: nft.conversation_id,
        covenant_id: nft.covenant_address, payout_address,
      });
      if (res.data.error) return Response.json({ error: res.data.error }, { status: 502 });
      await base44.asServiceRole.entities.KCCNft.update(nft.id, { status: "redeem_filed" });
      return Response.json({ redeem_filed: true, nft_id: nft.id, payout_address });
    }

    return Response.json({ error: "Unknown action — use mint, check or redeem" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});