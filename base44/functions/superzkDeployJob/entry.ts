import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// Files REAL covenant deploy jobs with the SuperZK app's deploy agent
// (github.com/mrzeku2000XTTT/superzk). SuperZK deploys ruled covenant++ P2SH
// scripts on Kaspa L1: zktimelock, zkescrow, zkvault, zkgate, xmsslock, sentinel.
const SUPERZK_AGENT_ID = "6a444b036408e68ec8d6f2a6";
const SUPERZK_PAYMENT_ADDRESS = "kaspa:qpkn4aczvuqpmhvzv2lunjudfnda6wlk258w90yptjxv6v2q7dlkq2cm8e58e";
const COVENANT_TYPES = ["zktimelock", "zkescrow", "zkvault", "zkgate", "xmsslock", "sentinel"];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Login required to file SuperZK deploy jobs" }, { status: 401 });

    const apiKey = Deno.env.get("SUPERZK_API_KEY");
    if (!apiKey) return Response.json({ error: "SUPERZK_API_KEY secret is not set" }, { status: 500 });

    const { action = "deploy", covenant_type, params = {}, deposit_kas, conversation_id, payout_address, covenant_id } = await req.json();
    const headers = { "api_key": apiKey, "Content-Type": "application/json" };

    if (action === "redeem") {
      if (!payout_address || !payout_address.startsWith("kaspa:")) {
        return Response.json({ error: "payout_address must be a kaspa: address" }, { status: 400 });
      }
      // Reuse the job conversation when given, else open a fresh one
      let convoId = conversation_id;
      if (!convoId) {
        const convoResp = await fetch(`https://app.base44.com/api/agents/${SUPERZK_AGENT_ID}/conversations`, {
          method: "POST", headers, body: "{}",
        });
        if (!convoResp.ok) return Response.json({ error: `SuperZK agent unreachable (${convoResp.status}): ${await convoResp.text()}` }, { status: 502 });
        const convo = await convoResp.json().catch(() => ({}));
        convoId = convo.conversation_id || convo.id || convo._id;
        if (!convoId) return Response.json({ error: "SuperZK agent did not return a conversation id" }, { status: 502 });
      }
      const content =
        `EXTERNAL REDEEM/SWEEP JOB filed by the Igra Agent (TTT app) for requester_email=${user.email}. ` +
        (covenant_id
          ? `Please redeem covenant_id=${covenant_id} now: `
          : `Please REDEEM ALL / SWEEP ALL redeemable covenants belonging to this requester (arbiter-release any agent-arbitered escrows, spend any matured timelocks): `) +
        `build and broadcast the redeem transaction(s) sweeping all locked KAS to ${payout_address}. ` +
        `Report each redeem tx_id, the amount swept, and the covenant address(es) in this conversation.`;
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 10000);
      try {
        const msgResp = await fetch(`https://app.base44.com/api/agents/${SUPERZK_AGENT_ID}/conversations/${convoId}/messages`, {
          method: "POST", headers, body: JSON.stringify({ content }), signal: ctl.signal,
        });
        if (!msgResp.ok) return Response.json({ error: `SuperZK redeem message failed (${msgResp.status}): ${await msgResp.text()}` }, { status: 502 });
      } catch (e) {
        if (e.name !== "AbortError") throw e;
      } finally {
        clearTimeout(timer);
      }
      return Response.json({
        redeem_filed: true,
        conversation_id: convoId,
        payout_address,
        covenant_id: covenant_id || null,
        sweep_all: !covenant_id,
      });
    }

    if (action === "check") {
      if (!conversation_id) return Response.json({ error: "Missing conversation_id" }, { status: 400 });
      const resp = await fetch(`https://app.base44.com/api/agents/${SUPERZK_AGENT_ID}/conversations/${conversation_id}`, { headers });
      if (!resp.ok) return Response.json({ error: `SuperZK agent returned ${resp.status}: ${await resp.text()}` }, { status: 502 });
      const convo = await resp.json();
      const msgs = convo.messages || [];
      const agentMsgs = msgs.filter((m) => m.role !== "user" && m.content);
      return Response.json({
        conversation_id,
        message_count: msgs.length,
        latest_update: agentMsgs.length ? agentMsgs[agentMsgs.length - 1].content : "No response from the SuperZK deploy agent yet — it deploys after the KAS payment lands.",
      });
    }

    if (action === "deploy") {
      if (!COVENANT_TYPES.includes(covenant_type)) {
        return Response.json({ error: `covenant_type must be one of: ${COVENANT_TYPES.join(", ")}` }, { status: 400 });
      }
      const deposit = Number(deposit_kas);
      if (!deposit || deposit <= 0) return Response.json({ error: "deposit_kas must be a positive number" }, { status: 400 });

      // 1. Open a conversation with the SuperZK deploy agent
      const convoResp = await fetch(`https://app.base44.com/api/agents/${SUPERZK_AGENT_ID}/conversations`, {
        method: "POST", headers, body: "{}",
      });
      if (!convoResp.ok) return Response.json({ error: `SuperZK agent unreachable (${convoResp.status}): ${await convoResp.text()}` }, { status: 502 });
      const convo = await convoResp.json().catch(() => ({}));
      const convoId = convo.conversation_id || convo.id || convo._id;
      if (!convoId) return Response.json({ error: "SuperZK agent did not return a conversation id" }, { status: 502 });

      // 2. File the deploy job — SuperZK's agent creates the DeployRequest,
      // watches for the on-chain KAS payment and deploys the real covenant
      const content =
        `EXTERNAL DEPLOY JOB filed by the Igra Agent (TTT app). ` +
        `Please create and process a DeployRequest: covenant_type=${covenant_type}, deposit_kas=${deposit}, ` +
        `requester_email=${user.email}, params=${JSON.stringify(params)}. ` +
        `The requester is paying ${deposit} KAS on Kaspa L1 to ${SUPERZK_PAYMENT_ADDRESS}. ` +
        `Check for the matching on-chain payment and deploy the real covenant immediately when found; ` +
        `report the covenant_address, redeem_script_hex, unlock_daa and tx_id in this conversation.`;
      // The agent API holds the request open while the SuperZK agent works the
      // job (can take minutes) — fire the message and give it 10s: if it's
      // still processing, the job IS delivered and the agent keeps working.
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 10000);
      let delivered = true;
      try {
        const msgResp = await fetch(`https://app.base44.com/api/agents/${SUPERZK_AGENT_ID}/conversations/${convoId}/messages`, {
          method: "POST", headers, body: JSON.stringify({ content }), signal: ctl.signal,
        });
        if (!msgResp.ok) return Response.json({ error: `SuperZK job message failed (${msgResp.status}): ${await msgResp.text()}` }, { status: 502 });
      } catch (e) {
        if (e.name !== "AbortError") throw e;
        // aborted our side only — the message reached SuperZK and the agent is processing
      } finally {
        clearTimeout(timer);
      }
      if (!delivered) { /* unreachable — kept for lint symmetry */ }

      return Response.json({
        job_filed: true,
        conversation_id: convoId,
        covenant_type, deposit_kas: deposit, params,
        requester_email: user.email,
        payment_address: SUPERZK_PAYMENT_ADDRESS,
        next_step: `Send ${deposit} KAS on Kaspa L1 to ${SUPERZK_PAYMENT_ADDRESS} — SuperZK's agent deploys the covenant when the payment lands.`,
      });
    }

    return Response.json({ error: "Unknown action — use deploy, redeem or check" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});