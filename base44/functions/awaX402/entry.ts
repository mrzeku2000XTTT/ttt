import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { buildProductivityPrompt } from '../../shared/productivityKnowledge.ts';

// AWA — x402-style payment gateway on Kaspa L1.
// Flow: request → HTTP 402 Payment Required (KAS quote) → pay on L1 → settle (tx verified on-chain) → AI service delivered.
const SERVICES = {
  "oracle-research": {
    name: "AWA Oracle — Live Deep Research Report",
    price_kas: 0.5,
    result_type: "markdown",
  },
  "forge-image": {
    name: "AWA Forge — AI Artwork Commission",
    price_kas: 0.25,
    result_type: "image_url",
  },
  "covenant-architect": {
    name: "AWA Architect — Covenant++ Blueprint",
    price_kas: 1,
    result_type: "markdown",
  },
  "productivity-coach": {
    name: "Better Ideas AI — Productivity Coach Reply",
    price_kas: 0.05,
    result_type: "markdown",
  },
  "tree-campaign": {
    name: "AWA Tree — Full Ad Campaign Unlock",
    price_kas: 0.5,
    result_type: "markdown",
  },
};

// Treasury address that receives every AWA x402 payment on Kaspa L1.
const PAY_TO = "qrvsw0p7w5ksgsz3q08glnp0r65yvmp9cx83lajqgtx8v9527z2hkzqgwekq3";

const KASPA_API = "https://api.kaspa.org";

function sompiToKas(sompi) {
  if (sompi == null) return 0;
  return Number(sompi) / 1e8;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  let user = null;
  try { user = await base44.auth.me(); } catch { /* anonymous */ }

  const body = await req.json().catch(() => ({}));
  const action = body.action;

  // ---- REQUEST: create an invoice and return HTTP 402 ----
  if (action === "request") {
    const svc = SERVICES[body.service_id];
    if (!svc) return json({ error: "Unknown service" }, 400);
    if (!body.input) return json({ error: "Missing service input" }, 400);
    if (!user) return json({ error: "Authentication required" }, 401);

    let invoice;
    try {
      invoice = await base44.asServiceRole.entities.AWAInvoice.create({
        service_id: body.service_id,
        service_name: svc.name,
        input: String(body.input).slice(0, 4000),
        amount_kas: svc.price_kas,
        pay_to: PAY_TO,
        buyer_email: user.email,
        status: "payment_required",
        result_type: svc.result_type,
      });
    } catch (e) {
      return json({ error: "Could not create invoice: " + (e?.message || "unknown") }, 500);
    }

    // x402: return 402 with the payment challenge.
    return json({
      accepts: [{
        invoice_id: invoice.id,
        pay_to: PAY_TO,
        amount_kas: svc.price_kas,
        service_id: body.service_id,
      }],
    }, 402);
  }

  // ---- SETTLE: verify the on-chain payment, then fulfill ----
  if (action === "settle") {
    if (!body.invoice_id || !body.tx_id) return json({ error: "invoice_id and tx_id required" }, 400);

    let invoice;
    try {
      invoice = await base44.asServiceRole.entities.AWAInvoice.get(body.invoice_id);
    } catch { return json({ error: "Invoice not found" }, 404); }
    if (!invoice) return json({ error: "Invoice not found" }, 404);
    if (invoice.status === "fulfilled") return json({ result: invoice.result, already_settled: true });

    // Verify the tx on Kaspa L1.
    const txId = String(body.tx_id).toLowerCase().replace(/^0x/, "");
    const headers = { "X-API-KEY": Deno.env.get("KASPA_API_KEY") || "" };
    let txData = null;
    for (let i = 0; i < 3; i++) {
      try {
        const r = await fetch(`${KASPA_API}/transactions/${txId}?resolve_previous_outpoints=light`, { headers });
        if (r.ok) { txData = await r.json(); break; }
        if (r.status === 404) break;
      } catch { /* retry */ }
      await new Promise((s) => setTimeout(s, 700));
    }
    if (!txData) {
      return json({
        error: "Could not verify payment yet — the tx may still be confirming. Wait a few seconds and retry Settle.",
      }, 500);
    }

    // Sum every output paying the invoice's pay_to address.
    const needed = Number(invoice.amount_kas) || 0;
    let paid = 0;
    for (const out of (txData.outputs || [])) {
      const addr = out.script_public_key_address || out.script_public_key?.address;
      if (addr && String(addr) === String(invoice.pay_to)) {
        paid += sompiToKas(out.amount);
      }
    }
    if (paid + 1e-8 < needed) {
      return json({
        error: `Payment not verified — expected ${needed} KAS to ${invoice.pay_to}, found ${paid.toFixed(6)} KAS. Send the exact amount and retry Settle.`,
      }, 400);
    }

    // Fulfill the service.
    let result = "";
    try {
      if (invoice.service_id === "productivity-coach") {
        const r = await base44.asServiceRole.integrations.Core.InvokeLLM({
          model: "claude_sonnet_4_6",
          prompt: buildProductivityPrompt(invoice.input),
        });
        result = typeof r === "string" ? r : (r?.response || r?.text || JSON.stringify(r));
      } else if (invoice.service_id === "tree-campaign") {
        // The Tree campaign is generated client-side; settle just verifies the
        // on-chain payment and unlocks viewing in the Tree app.
        result = "Campaign unlocked — view your full ad set in the Tree app.";
      } else if (invoice.service_id === "forge-image") {
        const r = await base44.asServiceRole.integrations.Core.GenerateImage({ prompt: invoice.input });
        result = r?.url || "";
      } else if (invoice.service_id === "oracle-research" || invoice.service_id === "covenant-architect") {
        const r = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: invoice.input,
          add_context_from_internet: true,
          model: "gemini_3_flash",
        });
        result = typeof r === "string" ? r : (r?.response || r?.text || "");
      } else {
        result = "Service fulfilled.";
      }
    } catch (e) {
      try { await base44.asServiceRole.entities.AWAInvoice.update(invoice.id, { status: "failed", tx_id: txId }); } catch {}
      return json({ error: "Fulfillment failed: " + (e?.message || "unknown") }, 500);
    }

    try {
      await base44.asServiceRole.entities.AWAInvoice.update(invoice.id, {
        status: "fulfilled", tx_id: txId, result,
      });
    } catch {}

    return json({ result, invoice_id: invoice.id, status: "fulfilled" });
  }

  return json({ error: "Unknown action" }, 400);
});