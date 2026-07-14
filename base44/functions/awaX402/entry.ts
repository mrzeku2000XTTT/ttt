import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

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
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const action = body.action;
    let payTo = Deno.env.get("BRIDGE_WALLET_ADDRESS") || "";
    if (!payTo.startsWith("kaspa:")) {
      // Fall back to the desk's KAS funding wallet (same treasury that powers the bridge)
      const info = await base44.asServiceRole.functions.invoke("igraBridge", { action: "info" });
      payTo = info?.data?.kas_deposit_address || "";
    }
    if (!payTo.startsWith("kaspa:")) return Response.json({ error: "AWA treasury address not configured" }, { status: 500 });

    // ── Catalog ──
    if (action === "services") {
      return Response.json({
        services: Object.entries(SERVICES).map(([id, s]) => ({ id, name: s.name, price_kas: s.price_kas, result_type: s.result_type })),
      });
    }

    // ── x402 request → 402 Payment Required ──
    if (action === "request") {
      const svc = SERVICES[body.service_id];
      if (!svc) return Response.json({ error: "Unknown service" }, { status: 400 });
      const input = String(body.input || "").trim();
      if (!input) return Response.json({ error: "Missing service input" }, { status: 400 });

      const invoice = await base44.asServiceRole.entities.AWAInvoice.create({
        service_id: body.service_id,
        service_name: svc.name,
        input: input.slice(0, 2000),
        amount_kas: svc.price_kas,
        pay_to: payTo,
        buyer_email: user.email,
        result_type: svc.result_type,
        status: "payment_required",
      });

      // x402-shaped response body, HTTP 402
      return Response.json({
        x402_version: 1,
        error: "Payment Required",
        accepts: [{
          scheme: "kaspa-l1",
          network: "kaspa-mainnet",
          asset: "KAS",
          pay_to: payTo,
          amount_kas: svc.price_kas,
          invoice_id: invoice.id,
          description: svc.name,
          settle_hint: "POST action=settle with invoice_id + tx_id after paying on Kaspa L1",
        }],
      }, { status: 402 });
    }

    // ── Settle: verify KAS payment on-chain, then fulfill the AI service ──
    if (action === "settle") {
      const invoiceId = String(body.invoice_id || "");
      const txId = String(body.tx_id || "").toLowerCase();
      if (!invoiceId || !/^[0-9a-f]{64}$/.test(txId)) {
        return Response.json({ error: "invoice_id and a 64-hex Kaspa tx_id are required" }, { status: 400 });
      }

      const invoice = await base44.asServiceRole.entities.AWAInvoice.get(invoiceId);
      if (!invoice) return Response.json({ error: "Invoice not found" }, { status: 404 });
      if (invoice.status === "fulfilled") {
        return Response.json({ fulfilled: true, invoice_id: invoice.id, result: invoice.result, result_type: invoice.result_type, note: "Already fulfilled" });
      }

      // Replay protection — one tx settles one invoice, ever
      const dup = await base44.asServiceRole.entities.AWAInvoice.filter({ tx_id: txId });
      if (dup.length > 0) return Response.json({ error: "This transaction was already used to settle an invoice" }, { status: 409 });

      // Verify the payment on Kaspa L1
      const txRes = await fetch(`https://api.kaspa.org/transactions/${txId}?inputs=false&outputs=true&resolve_previous_outpoints=no`);
      if (!txRes.ok) return Response.json({ error: "Transaction not found on Kaspa L1 yet — wait a few seconds and retry" }, { status: 400 });
      const tx = await txRes.json();
      const requiredSompi = Math.round(invoice.amount_kas * 1e8);
      const paidOutput = (tx.outputs || []).find((o) =>
        o.script_public_key_address === invoice.pay_to && Number(o.amount) >= requiredSompi
      );
      if (!paidOutput) {
        return Response.json({ error: `Payment not found: tx must send ≥ ${invoice.amount_kas} KAS to ${invoice.pay_to}` }, { status: 402 });
      }

      // Payment verified — fulfill the AI service
      let result = "";
      let status = "fulfilled";
      try {
        if (invoice.service_id === "oracle-research") {
          const r = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `You are AWA Oracle, a paid research agent. Produce a thorough, current, fact-dense markdown research report on: """${invoice.input}"""\n\nStructure: # Title, ## Executive Summary (bullets), ## Findings (concrete facts, numbers, dates, names), ## Outlook, ## Sources (URLs). Use real live web data. No filler.`,
            add_context_from_internet: true,
            model: "gemini_3_flash",
          });
          result = typeof r === "string" ? r : JSON.stringify(r);
        } else if (invoice.service_id === "forge-image") {
          const r = await base44.asServiceRole.integrations.Core.GenerateImage({
            prompt: `${invoice.input}. Highly detailed, professional quality.`,
          });
          result = r.url;
        } else if (invoice.service_id === "covenant-architect") {
          const r = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `You are AWA Architect, an expert in Kaspa covenant++ script design (Toccata smart covenants). The client's use case: """${invoice.input}"""\n\nDesign a covenant++ blueprint in markdown: # Blueprint title, ## Recommended rule (pick from: zktimelock, zkgate, zkescrow, zkvault, xmsslock, sentinel — justify), ## Rule parameters (concrete values), ## Transaction flow (deposit → covenant UTXO → spend paths), ## Failure & timeout paths, ## Why L1 consensus enforcement beats an indexer here. Be concrete and technical.`,
          });
          result = typeof r === "string" ? r : JSON.stringify(r);
        } else {
          throw new Error("Service fulfillment not implemented");
        }
      } catch (e) {
        status = "failed";
        result = `Fulfillment error: ${e.message}`;
      }

      await base44.asServiceRole.entities.AWAInvoice.update(invoice.id, { tx_id: txId, result, status });

      if (status === "failed") return Response.json({ error: result, invoice_id: invoice.id }, { status: 500 });
      return Response.json({ fulfilled: true, invoice_id: invoice.id, result, result_type: invoice.result_type, paid_kas: Number(paidOutput.amount) / 1e8, tx_id: txId });
    }

    // ── Buyer's invoice history ──
    if (action === "invoices") {
      const list = await base44.asServiceRole.entities.AWAInvoice.filter({ buyer_email: user.email }, "-created_date", 25);
      return Response.json({ invoices: list });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});